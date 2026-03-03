import { prisma } from "@/lib/db";
import { ContextService } from '../context/service';
import { LLMProviderFactory, LLMProvider } from "@/lib/llm";
import { GmailClient } from '@/lib/google/gmail';
import { RulesService } from "@/modules/rules/service";
import { PolicyInterceptor } from "../rules/policy-interceptor";
import { RoutingService } from "@/modules/routing/service";
import { TriageService } from "./triage-service";
import { DraftResponse, ResponseGenerationParams } from "./types";

export class ResponseService {
    private overrides?: { llm?: LLMProvider; contextService?: ContextService };
    private contextService: ContextService;
    private rulesService = new RulesService();
    private routingService = new RoutingService();

    constructor(overrides?: { llm?: LLMProvider; contextService?: ContextService }) {
        this.overrides = overrides;
        this.contextService = overrides?.contextService || new ContextService();
    }

    /**
     * Generate an email draft response based on the incoming request and retrieved context.
     */
    async generateDraft(params: ResponseGenerationParams): Promise<DraftResponse> {
        console.log(`[ResponseService] Processing: ${params.sender} - "${params.subject}"`);

        // 0. Triage Layer (Local Analysis - Zero Tokens)
        const triage = TriageService.analyze(params.sender, params.subject, params.content);
        if (!triage.actionable) {
            console.log(`[ResponseService] Triage: Skipping non-actionable email (${triage.reason})`);
            return {
                id: `skipped-${Date.now()}`,
                subject: params.subject,
                body: "Skipped by triage",
                recipient: params.sender,
                cc: [],
                status: 'skipped' as any,
                metadata: { confidence: 1.0, reason: triage.reason }
            };
        }

        // In a real app, we'd get userId from session or params
        const userId = params.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const assistantName = user?.name ? `${user.name.split(' ')[0]}'s Personal Ninja` : 'Personal Ninja';
        const activeLlm = this.overrides?.llm || LLMProviderFactory.getProvider(user?.geminiApiKey || undefined);

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

            const ccRecipients: string[] = [];
            let coverageText = "";
            const baseResponse = "Hi,\n\nI am currently out of the office.";

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
                } catch { /* metadata may not be valid JSON */ }
                return !!meta?.url || !!meta?.webViewLink || !!meta?.link;
            });

            if (relevantDocs.length > 0) {
                // Deduplicate links
                const seenUrls = new Set();
                const uniqueLinks = [];
                for (const item of relevantDocs) {
                    let meta: any = {};
                    try { meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata; } catch { /* metadata may not be valid JSON */ }
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
            let draftBody = "";

            // 4. Always add AI Summary if we are Personal Ninja
            let systemInstruction = "You are a Personal Assistant ('Personal Ninja'). Create a helpful, direct draft response to the user's email based on the context provided.";
            if (matchedRule) {
                const action = JSON.parse(matchedRule.action);
                if (action.type === 'instructions') {
                    systemInstruction += `\n\nIMPORTANT RULE: ${action.value}`;
                }
            }

            const relevantContextStr = user?.allowContextSummaries && contextItems.length > 0
                ? `Relevant Context:\n${contextItems.map((i: any) => i.content).join('\n')}`
                : '';

            const prompt = `
            Incoming Email from: ${params.sender}
            Subject: ${params.subject}
            Content: ${cleanContent}
            
            ${relevantContextStr}

            Please provide a draft email response. Do not include signature blocks like "Best, [Name]" unless specified. Just the body.
            `;

            const llmResponse = await activeLlm.generate({
                systemPrompt: systemInstruction,
                userPrompt: prompt
            });

            if (llmResponse.content) {
                draftBody += llmResponse.content.trim();
            }

            if (coverageText) {
                draftBody += `\n\nNote: ${coverageText}`;
            }

            if (docLinks) {
                draftBody += `\n\n${docLinks}`;
            }

            // 5. Create Draft via API
            return await this.createDraft(userId, params.sender, params.subject, draftBody, ccRecipients, contextItems);

        } catch (error) {
            console.error("[ResponseService] Error generating draft:", error);

            // Fallback Logic
            if (user?.managerName && user?.managerEmail) {
                console.log("[ResponseService] Using Fallback Configuration");
                const fallbackBody = `Draft failed to generate. Please review and respond manually.`;
                return await this.createDraft(userId, params.sender, params.subject, fallbackBody, [], []);
            }

            throw error; // If no fallback info, rethrow
        }
    }

    private async createDraft(userId: string, recruit: string, subject: string, body: string, cc: string[], contextItems: any[]): Promise<DraftResponse> {
        console.log('[ResponseService] Executing LIVE draft creation via Gmail API...');

        // Use realistic API instead of MCP
        const gmailClient = new GmailClient(userId);

        if (cc.length > 0) {
            body += `\n\nCC: ${cc.join(', ')}`;
        }

        try {
            await gmailClient.createDraft(recruit, subject, body);
            console.log(`[ResponseService] Successfully created draft for ${recruit} on topic "${subject}"`);

            await prisma.activityLog.create({
                data: {
                    userId,
                    action: 'DRAFT_CREATED',
                    metadata: JSON.stringify({
                        target: recruit,
                        subject: subject,
                        ccCount: cc.length,
                        contextUsed: contextItems.length
                    })
                }
            });
        } catch (e) {
            console.error("Gmail API Error - Failed to create draft", e);
        }

        return {
            id: `draft-${Date.now()}`,
            subject: subject,
            body: body,
            recipient: recruit,
            cc: cc,
            status: 'draft',
            metadata: {
                confidence: 0.9,
                usedContextIds: contextItems.map(c => c.id)
            }
        };
    }
}
