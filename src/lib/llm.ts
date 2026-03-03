import { GoogleGenerativeAI } from "@google/generative-ai";
import { LocalEmbeddingService } from "./local-embeddings";

export interface LLMRequest {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
}

export interface LLMResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
    };
}

export interface LLMProvider {
    generate(request: LLMRequest & { tier?: 'flash' | 'pro' }): Promise<LLMResponse>;
    embed(text: string): Promise<number[]>;
}

export class MockLLMProvider implements LLMProvider {
    async generate(request: LLMRequest): Promise<LLMResponse> {
        console.log(`[MockLLM] Generating response...`);
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
            content: "Mock response for context analysis.",
            usage: { promptTokens: 0, completionTokens: 0 }
        };
    };

    async embed(text: string): Promise<number[]> {
        // Even the Mock provider uses the local embedding engine for consistency
        return LocalEmbeddingService.embed(text);
    }
}

export class GeminiLLMProvider implements LLMProvider {
    private genAI: GoogleGenerativeAI;
    private flashModel: any;
    private proModel: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.flashModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        this.proModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }

    async generate(request: LLMRequest & { tier?: 'flash' | 'pro' }): Promise<LLMResponse> {
        const model = request.tier === 'pro' ? this.proModel : this.flashModel;
        console.log(`[GeminiLLM] Generating response using tier: ${request.tier || 'flash'}...`);

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: `System Instruction: ${request.systemPrompt}` }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood." }],
                },
            ],
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: request.temperature ?? 0.7,
            },
        });

        const result = await chat.sendMessage(request.userPrompt);
        const response = await result.response;
        return {
            content: response.text(),
            usage: { promptTokens: 0, completionTokens: 0 }
        };
    }

    /**
     * Optimized: Use local embeddings instead of Gemini API to save cost.
     */
    async embed(text: string): Promise<number[]> {
        return LocalEmbeddingService.embed(text);
    }
}

/**
 * Factory to manage LLM provider selection.
 */
export class LLMProviderFactory {
    static getProvider(userApiKey?: string): LLMProvider {
        const override = process.env.OVERRIDE_LLM?.toLowerCase();

        // Always allow mock override if explicitly requested
        if (override === 'mock') {
            console.log("[LLMProviderFactory] Using MockLLMProvider due to OVERRIDE_LLM=mock");
            return new MockLLMProvider();
        }

        const isTestOrDev = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
        const providerName = process.env.LLM_PROVIDER?.toLowerCase();
        const apiKey = userApiKey || process.env.GEMINI_API_KEY;

        if (providerName === 'gemini' || apiKey) {
            if (!apiKey) {
                if (isTestOrDev) {
                    console.warn("[LLMProviderFactory] GEMINI_API_KEY is not set. Falling back to MockLLMProvider in development.");
                    return new MockLLMProvider();
                }
                throw new Error("GEMINI_API_KEY is required in production.");
            }
            return new GeminiLLMProvider(apiKey);
        }

        if (isTestOrDev) {
            return new MockLLMProvider();
        }

        throw new Error("No LLM Provider configured for production.");
    }
}
