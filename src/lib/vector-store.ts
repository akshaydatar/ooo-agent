import { prisma } from "@/lib/db";

export interface VectorStore {
    addDocuments(
        documents: { content: string; metadata: Record<string, any>; embedding: number[] }[]
    ): Promise<void>;

    similaritySearch(
        queryEmbedding: number[],
        limit: number
    ): Promise<{ content: string; score: number; metadata: any }[]>;
}

export class SQLiteVectorStore implements VectorStore {
    async addDocuments(
        documents: { content: string; metadata: Record<string, any>; embedding: number[] }[]
    ): Promise<void> {
        // In a real app, this method might batch insert into a dedicated table.
        // However, our ContextService handles the transactional creation of ContextItem + ContextChunks.
        // So this class is mainly a helper or for purely vector-side operations if we separated them.
        // For this V1, we simply trust the Service to handle the writes via Prisma directly
        // TO KEEP IT SIMPLE, we might not actually use this method for *insertion* if strictly coupled with Prisma,
        // but we WILL use it for search.

        console.warn("SQLiteVectorStore.addDocuments: Not implemented. Use ContextService.indexItem instead.");
    }

    async similaritySearch(
        queryEmbedding: number[],
        limit: number = 5
    ): Promise<{ content: string; score: number; metadata: any }[]> {
        // Fetch all chunks (inefficient but works for V1 < 10k items)
        // We only select fields needed for cosine similarity
        const chunks = await prisma.contextChunk.findMany({
            select: {
                id: true,
                content: true,
                embedding: true,
                contextItem: {
                    select: {
                        metadata: true,
                    }
                }
            }
        });

        const results = chunks.map((chunk: { content: string; embedding: string; contextItem: { metadata: string } }) => {
            const embedding = JSON.parse(chunk.embedding) as number[];
            const score = this.cosineSimilarity(queryEmbedding, embedding);
            return {
                content: chunk.content,
                score,
                metadata: JSON.parse(chunk.contextItem.metadata)
            };
        });

        // Sort by descending score
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}

import { createClient } from '@supabase/supabase-js';

export class SupabaseVectorStore implements VectorStore {
    private supabase;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    async addDocuments(
        documents: { content: string; metadata: Record<string, any>; embedding: number[] }[]
    ): Promise<void> {
        // Direct insertion via Supabase client to the documents table (assuming it's set up)
        const { error } = await this.supabase.from('documents').insert(
            documents.map(doc => ({
                content: doc.content,
                metadata: doc.metadata,
                embedding: doc.embedding
            }))
        );

        if (error) {
            console.error('Error inserting documents to Supabase:', error);
            throw new Error('Failed to insert documents into Supabase Vector Store');
        }
    }

    async similaritySearch(
        queryEmbedding: number[],
        limit: number = 5
    ): Promise<{ content: string; score: number; metadata: any }[]> {
        // Calls a predefined PostgreSQL function `match_documents` in Supabase
        const { data, error } = await this.supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.7, // configurable
            match_count: limit
        });

        if (error) {
            console.error('Error querying Supabase Vector Store:', error);
            return [];
        }

        return data.map((item: any) => ({
            content: item.content,
            score: item.similarity,
            metadata: item.metadata
        }));
    }
}
