import { ContextService } from '../context/service';
import { MockLLMProvider } from "@/lib/llm";
import { MCPClient } from "@/lib/mcp/client";
import { MockMCPClient } from '@/lib/mcp/mock-adapter';
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
        this.mcp = new MockMCPClient();
    }

    /**
     * Generate an email draft response based on the incoming request and retrieved context.
     */
    async generateDraft(params: ResponseGenerationParams): Promise<DraftResponse> {
        console.log(`[ResponseService] Generating draft for: ${params.sender} on topic "${params.subject}"`);

        // 1. Evaluate Rules
        // In a real app, we'd get userId from session or params
        const userId = "test-user-id";
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

        // 6. Create Draft via MCP (simulating Gmail API)
        console.log('[ResponseService] Creating draft via Gmail MCP...');
        const mcpResult = await this.mcp.callTool('gmail_create_draft', {
            to: params.sender,
            cc: ccRecipients.length > 0 ? ccRecipients.join(',') : undefined,
            subject: `OOO: ${params.subject}`,
            body: draftBody
        });

        const draftData = JSON.parse(mcpResult.content[0].text || '{}');

        return {
            id: draftData.id || 'draft-error',
            subject: `OOO: ${params.subject}`,
            body: draftBody,
            recipient: params.sender,
            cc: ccRecipients,
            status: 'draft',
            metadata: {
                confidence: 0.9,
                usedContextIds: contextItems.map(c => c.id)
            }
        };
    }
}
