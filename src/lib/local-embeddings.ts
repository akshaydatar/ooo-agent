import { pipeline } from '@xenova/transformers';

/**
 * LocalEmbeddingService
 * Uses transformers.js to generate embeddings locally.
 * This eliminates API costs for RAG indexing.
 */
export class LocalEmbeddingService {
    private static instance: any = null;

    static async getPipeline() {
        if (!this.instance) {
            console.log('[LocalEmbeddings] Loading model: Xenova/all-MiniLM-L6-v2...');
            this.instance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }
        return this.instance;
    }

    /**
     * Generate an embedding vector for a piece of text.
     * Dimensions: 384
     */
    static async embed(text: string): Promise<number[]> {
        // 1. Prioritize Remote Microservice (Option A - Cloud Run)
        const remoteUrl = process.env.REMOTE_EMBEDDING_URL;
        if (remoteUrl) {
            try {
                const response = await fetch(`${remoteUrl}/embed`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.embedding) {
                        return data.embedding;
                    }
                }
                console.warn('[LocalEmbeddings] Remote service responded with error, falling back to local.');
            } catch (error) {
                console.error('[LocalEmbeddings] Remote service fetch failed:', error);
            }
        }

        // 2. Fallback to local process (runs inside Next.js/Inngest)
        const extractor = await this.getPipeline();
        const output = await extractor(text, {
            pooling: 'mean',
            normalize: true,
        });

        // Convert the Tensor to a standard array
        return Array.from(output.data);
    }
}
