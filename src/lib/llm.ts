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
}

export class MockLLMProvider implements LLMProvider {
    async generate(request: LLMRequest): Promise<LLMResponse> {
        console.log(`[MockLLM] Generating response for prompt length: ${request.userPrompt.length}`);

        // Simulate latency
        await new Promise(resolve => setTimeout(resolve, 500));

        let responseContent = `
Subject: Re: ${request.userPrompt.split('\n')[0].substring(0, 50)}...

Hi there,

Thanks for your email. I am currently out of the office with limited access to email.
`;

        // Mock behavior: If prompt mentions "context", add placeholder
        if (request.userPrompt.toLowerCase().includes('context')) {
            responseContent += '\nBased on our internal documentation, here is some context that might help:\n[AI would insert RAG content here]';
        }

        // Mock behavior: If prompt mentions "CC", add CC note
        if (request.userPrompt.includes('you have cc\'d')) {
            const ccMatch = request.userPrompt.match(/you have cc'd (.*?) because/);
            const contact = ccMatch ? ccMatch[1] : 'the contact';
            responseContent += `\n\nI have cc'd ${contact} because they may be able to answer you directly.`;
        }

        responseContent += '\n\nI will get back to you when I return.\n\nBest,\nOOO Agent';

        return {
            content: responseContent.trim(),
            usage: {
                promptTokens: request.userPrompt.length / 4,
                completionTokens: 50
            }
        };
    }
}
