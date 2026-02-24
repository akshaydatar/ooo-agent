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
    generate(request: LLMRequest): Promise<LLMResponse>;
    embed(text: string): Promise<number[]>;
}

export class MockLLMProvider implements LLMProvider {
    async generate(request: LLMRequest): Promise<LLMResponse> {
        console.log(`[MockLLM] Generating response for prompt length: ${request.userPrompt.length}`);

        // Simulate latency
        await new Promise(resolve => setTimeout(resolve, 500));

        let responseContent = "";

        // Mock behavior: If prompt mentions "context", add placeholder
        if (request.userPrompt.toLowerCase().includes('context')) {
            responseContent += 'Based on our internal documentation, here is some context that might help:\n[AI would insert RAG content here]';
        }

        // Mock behavior: If prompt mentions "CC", add CC note
        if (request.userPrompt.includes('you have cc\'d')) {
            const ccMatch = request.userPrompt.match(/you have cc'd (.*?) because/);
            const contact = ccMatch ? ccMatch[1] : 'the contact';
            responseContent += `\n\nI have additionally CC'd ${contact} who can assist further.`;
        }

        if (!responseContent) {
            responseContent = "I have processed your request and routed this email accordingly.";
        }

        return {
            content: responseContent.trim(),
            usage: {
                promptTokens: request.userPrompt.length / 4,
                completionTokens: 50
            }
        };
    };

    async embed(text: string): Promise<number[]> {
        // Return 1536 random numbers (standard embedding size)
        return Array(1536).fill(0).map(() => Math.random());
    }
}

import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiLLMProvider implements LLMProvider {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        console.log(`[GeminiLLM] Generating response...`);

        const chat = this.model.startChat({
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
            },
        });

        const result = await chat.sendMessage(request.userPrompt);
        const response = await result.response;
        const text = response.text();

        return {
            content: text,
            usage: {
                promptTokens: 0, // Gemini SDK doesn't always return this easily in simple call
                completionTokens: 0
            }
        };
    }

    async embed(text: string): Promise<number[]> {
        try {
            const embeddingModel = this.genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });
            const result = await embeddingModel.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            console.error("Gemini Embed Error:", error);
            // Fallback to random if real embedding fails (for demo purposes)
            // In production we should throw, but here we want to see the error.
            throw error;
        }
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
