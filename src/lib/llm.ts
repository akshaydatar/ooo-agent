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

export class LLMProviderFactory {
    static getProvider(): LLMProvider {
        const providerName = process.env.LLM_PROVIDER?.toLowerCase() || 'mock';

        if (providerName === 'gemini') {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                console.warn("[LLMProviderFactory] GEMINI_API_KEY is not set. Falling back to MockLLMProvider.");
                return new MockLLMProvider();
            }
            return new GeminiLLMProvider(apiKey);
        }

        return new MockLLMProvider();
    }
}
