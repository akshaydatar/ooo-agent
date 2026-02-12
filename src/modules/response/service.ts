import { prisma } from "@/lib/db";
import { ContextService } from '../context/service';
import { MockLLMProvider } from "@/lib/llm";
import { MCPClient } from "@/lib/mcp/client";
import { MockMCPClient } from '@/lib/mcp/mock-adapter';
import { StdioMCPClient } from '@/lib/mcp/stdio-client';
import { loadMCPConfig } from '@/lib/mcp/config';
import { RulesService } from "@/modules/rules/service";
import { RoutingService } from "@/modules/routing/service";
import { DraftResponse, ResponseGenerationParams } from "./types";

export class ResponseService {
    private llm = new MockLLMProvider();
    private contextService = new ContextService();
    private rulesService = new RulesService();
    private routingService = new RoutingService();
    private mcp: MCPClient;

    constructor() {
        const config = loadMCPConfig();
        if (config.servers.length > 0) {
            this.mcp = new StdioMCPClient(config.servers[0]);
            (this.mcp as StdioMCPClient).connect().catch(e => console.error("Failed to connect MCP", e));
        } else {
            this.mcp = new MockMCPClient();
        }
    }

    /**
     * Generate an email draft response based on the incoming request and retrieved context.
     */
    async generateDraft(params: ResponseGenerationParams): Promise<DraftResponse> {
        console.log(`[ResponseService] Generating draft for: ${params.sender} on topic "${params.subject}"`);

        // In a real app, we'd get userId from session or params
        const userId = "test-user-id";

        try {
            // 1. Evaluate Rules
            const matchedRule = await this.rulesService.evaluate(userId, {
                sender: params.sender,
                subject: params.subject,
                body: params.content
            });

            let systemInstruction = "You are an intelligent OOO Assistant.";
            if (matchedRule) {
                const action = JSON.parse(matchedRule.action);
                if (action.type === 'instructions') {
                    systemInstruction += `\n\nIMPORTANT RULE: ${action.value}`;
                }
            }

            // 2. Retrieve Context
            // In a real app, calls ContextService which might use Drive MCP
            // For now, we simulate context retrieval
            const contextItems = await this.contextService.query({ query: params.subject });
            const contextText = contextItems.map(i => i.content).join('\n') || "No specific docs found.";

            // 3. Resolve Coverage (Routing)
            const coverage = await this.routingService.resolveCoverage(params.subject);

            let coverageInfo = "";
            let ccRecipients: string[] = [];

            if (coverage) {
                coverageInfo = `\nNote: ${coverage.contact.name} (${coverage.contact.email}) is the best contact for this topic. They have been CC'd.`;
                ccRecipients.push(coverage.contact.email);
            }

            // 4. Construct Prompt
            const prompt = `
            Incoming Email from: ${params.sender}
            Subject: ${params.subject}
            Content: ${params.content}
            
            Relevant Context:
            ${contextText}

            Coverage Info:
            ${coverageInfo}
            
            Draft a polite, professional OOO response. 
            IMPORTANT: You MUST explicitly state in the email body that you have cc'd ${coverage ? coverage.contact.name : 'the attached contact'} because "they may be able to answer you directly".
            `;

            // 5. Generate Content
            const llmResponse = await this.llm.generate({
                systemPrompt: systemInstruction,
                userPrompt: prompt
            });

            const draftBody = llmResponse.content;

            // 6. Create Draft via MCP
            return await this.createDraft(params.sender, `OOO: ${params.subject}`, draftBody, ccRecipients, contextItems);

        } catch (error) {
            console.error("[ResponseService] Error generating draft:", error);

            // Fallback Logic
            const user = await prisma.user.findUnique({ where: { id: userId } });

            if (user?.managerName && user?.managerEmail) {
                console.log("[ResponseService] Using Fallback Configuration");
                const coveragePlanText = user.coveragePlanLink ? ` You can also view our team's coverage plan here: ${user.coveragePlanLink}` : "";

                const fallbackBody = `Hi,\n\nI am currently out of the office. For urgent matters, please contact ${user.managerName} at ${user.managerEmail}.${coveragePlanText}\n\nBest,\nOOO Agent (Fallback Mode)`;

                return await this.createDraft(params.sender, `OOO: ${params.subject}`, fallbackBody, [], []);
            }

            throw error; // If no fallback info, rethrow
        }
    }

    private async createDraft(recruit: string, subject: string, body: string, cc: string[], contextItems: any[]): Promise<DraftResponse> {
        console.log('[ResponseService] Creating draft via Gmail MCP...');
        const mcpResult = await this.mcp.callTool('gmail_create_draft', {
            to: recruit,
            cc: cc.length > 0 ? cc.join(',') : undefined,
            subject: subject,
            body: body
        });

        const draftData = JSON.parse(mcpResult.content[0].text || '{}');

        return {
            id: draftData.id || 'draft-error',
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
