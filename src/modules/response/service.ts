import { prisma } from "@/lib/db";
import { ContextService } from '../context/service';
import { MockLLMProvider } from "@/lib/llm";
import { GmailClient } from '@/lib/google/gmail';
import { RulesService } from "@/modules/rules/service";
import { PolicyInterceptor } from "../rules/policy-interceptor";
import { RoutingService } from "@/modules/routing/service";
import { DraftResponse, ResponseGenerationParams } from "./types";

export class ResponseService {
    private llm = new MockLLMProvider();
    private contextService = new ContextService();
    private rulesService = new RulesService();
    private routingService = new RoutingService();

    constructor() {
        // No setup needed currently
    }

    /**
     * Generate an email draft response based on the incoming request and retrieved context.
     */
    async generateDraft(params: ResponseGenerationParams): Promise<DraftResponse> {
        console.log(`[ResponseService] Generating draft for: ${params.sender} on topic "${params.subject}"`);

        // In a real app, we'd get userId from session or params
        const userId = params.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const assistantName = user?.name ? `${user.name.split(' ')[0]}_OOO_assistant` : 'OOO_assistant';

        try {
            // 1. Enforce Policies & Scrubber
            const policyInterceptor = new PolicyInterceptor();
            const { blocked, reason, cleanContent } = await policyInterceptor.enforce(userId, [params.sender], params.content);

            if (blocked) {
                console.warn(`[ResponseService] Blocked by policy: ${reason}`);
                await prisma.activityLog.create({
                    data: {
                        userId,
                        action: 'POLICY_BLOCKED',
                        metadata: JSON.stringify({ target: params.sender, reason })
                    }
                });
                return {
                    id: `blocked-${Date.now()}`,
                    subject: params.subject,
                    body: reason || "Blocked",
                    recipient: params.sender,
                    cc: [],
                    status: 'draft', // Not 'sent', simply blocked.
                    metadata: { confidence: 1.0, reason }
                };
            }

            const matchedRule = await this.rulesService.evaluate(userId, {
                sender: params.sender,
                subject: params.subject,
                body: cleanContent
            });

            // 2. Resolve Coverage (Routing)
            const coverage = await this.routingService.resolveCoverage(userId, params.subject);

            let ccRecipients: string[] = [];
            let coverageText = "";
            let baseResponse = "Hi,\n\nI am currently out of the office.";

            if (coverage) {
                coverageText = `For matters regarding "${params.subject}", I have copied ${coverage.contact.name} (${coverage.contact.email}) who can assist you.`;
                ccRecipients.push(coverage.contact.email);
            } else {
                // If there's a fallback manager we can use that, but we'll stick to a generic message
                if (user?.managerName && user?.managerEmail) {
                    coverageText = `For urgent matters, please contact ${user.managerName} at ${user.managerEmail}.`;
                }
            }

            // 3. Retrieve Context (Links to documents)
            const contextItems = await this.contextService.query({ userId, query: params.subject });
            let docLinks = "";

            // Filter to only include items that actually look like documents from Drive
            const relevantDocs = contextItems.filter((item: any) => {
                let meta: any = {};
                try {
                    meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
                } catch (e) { }
                return !!meta?.url || !!meta?.webViewLink || !!meta?.link;
            });

            if (relevantDocs.length > 0) {
                // Deduplicate links
                const seenUrls = new Set();
                const uniqueLinks = [];
                for (const item of relevantDocs) {
                    let meta: any = {};
                    try { meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata; } catch (e) { }
                    const url = meta.url || meta.webViewLink || meta.link;
                    const title = meta.title || meta.name || "Document";
                    if (!seenUrls.has(url)) {
                        seenUrls.add(url);
                        uniqueLinks.push(`- ${title}: ${url}`);
                    }
                }
                if (uniqueLinks.length > 0) {
                    docLinks = "You may find these resources helpful:\n" + uniqueLinks.join('\n');
                }
            }

            // Assemble default response
            let draftBody = `${baseResponse}\n\n${coverageText}`.trim();
            if (docLinks) {
                draftBody += `\n\n${docLinks}`;
            }

            // 4. If rule exists, add AI Summary
            if (matchedRule) {
                let systemInstruction = "You are an intelligent OOO Assistant. Create a brief, helpful summary responding to the user's email.";
                const action = JSON.parse(matchedRule.action);
                if (action.type === 'instructions') {
                    systemInstruction += `\n\nIMPORTANT RULE: ${action.value}`;
                }

                const prompt = `
                Incoming Email from: ${params.sender}
                Subject: ${params.subject}
                Content: ${cleanContent}
                
                Relevant Context:
                ${contextItems.map((i: any) => i.content).join('\n')}

                Please provide a brief AI summary or automated answer to include in the out-of-office reply. 
                DO NOT INCLUDE any greetings (e.g. "Hi there") or sign-offs (e.g. "Best", "Thanks"). Just provide the core message.
                Keep it to 1-2 short paragraphs.
                `;

                const llmResponse = await this.llm.generate({
                    systemPrompt: systemInstruction,
                    userPrompt: prompt
                });

                if (llmResponse.content) {
                    draftBody += `\n\n---\n*Assistant Note:*\n${llmResponse.content.trim()}`;
                }
            }

            draftBody += `\n\nBest,\n${assistantName}`;

            // 5. Create Draft via API
            return await this.createDraft(userId, params.sender, `OOO: ${params.subject}`, draftBody, ccRecipients, contextItems);

        } catch (error) {
            console.error("[ResponseService] Error generating draft:", error);

            // Fallback Logic
            if (user?.managerName && user?.managerEmail) {
                console.log("[ResponseService] Using Fallback Configuration");
                const coveragePlanText = user.coveragePlanLink ? ` You can also view our team's coverage plan here: ${user.coveragePlanLink}` : "";

                const fallbackBody = `Hi,\n\nI am currently out of the office. For urgent matters, please contact ${user.managerName} at ${user.managerEmail}.${coveragePlanText}\n\nBest,\n${assistantName}`;

                return await this.createDraft(userId, params.sender, `OOO: ${params.subject}`, fallbackBody, [], []);
            }

            throw error; // If no fallback info, rethrow
        }
    }

    private async createDraft(userId: string, recruit: string, subject: string, body: string, cc: string[], contextItems: any[]): Promise<DraftResponse> {
        console.log('[ResponseService] Executing LIVE email send via Gmail API...');

        // Use realistic API instead of MCP
        const gmailClient = new GmailClient(userId);

        // Append CC to body for visibility since we are sending a simple raw text draft right now
        // In a more complex MIME implementation, cc would go in the To/CC headers
        if (cc.length > 0) {
            body += `\n\nCC: ${cc.join(', ')}`;
        }

        try {
            await gmailClient.sendResponse(recruit, subject, body);
            console.log(`[ResponseService] Successfully replied to ${recruit} on topic "${subject}"`);

            await prisma.activityLog.create({
                data: {
                    userId,
                    action: 'EMAIL_RESPONDED',
                    metadata: JSON.stringify({
                        target: recruit,
                        subject: subject,
                        ccCount: cc.length,
                        contextUsed: contextItems.length
                    })
                }
            });
        } catch (e) {
            console.error("Gmail API Error - Fallback to Draft or Error Logging", e);
        }

        return {
            id: `sent-${Date.now()}`,
            subject: subject,
            body: body,
            recipient: recruit,
            cc: cc,
            status: 'sent',
            metadata: {
                confidence: 0.9,
                usedContextIds: contextItems.map(c => c.id)
            }
        };
    }
}
