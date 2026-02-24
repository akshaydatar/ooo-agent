import { prisma } from '@/lib/db';
import { recursiveCharacterSplit } from '@/lib/chunking';
import { DriveClient } from '@/lib/google/drive';
import { SQLiteVectorStore, SupabaseVectorStore, VectorStore } from '@/lib/vector-store';
import { ContextItem, ContextQuery, ContextServiceConfig } from './types';

import { LLMProviderFactory, LLMProvider } from "@/lib/llm";

export class ContextService {
    private vectorStore: VectorStore;
    private llm: LLMProvider;

    constructor(config?: ContextServiceConfig) {
        if (process.env.SUPABASE_URL) {
            this.vectorStore = new SupabaseVectorStore();
        } else {
            console.warn("No SUPABASE_URL found, falling back to SQLiteVectorStore");
            this.vectorStore = new SQLiteVectorStore();
        }

        // 1. Setup LLM Provider
        this.llm = LLMProviderFactory.getProvider();

    }

    /**
     * Index a new item (email, doc, calendar event) into the vector store and database.
     */
    async indexItem(item: ContextItem & { userId?: string }): Promise<void> {
        console.log(`[ContextService] Indexing item: ${item.id} (${item.type})`);

        if (!item.userId) throw new Error("userId is required for indexing");

        // 1. Store the root item
        const savedItem = await prisma.contextItem.create({
            data: {
                userId: item.userId,
                type: item.type,
                content: item.content,
                metadata: JSON.stringify(item.metadata),
            },
        });

        // 2. Split content into sections
        const chunks = recursiveCharacterSplit(item.content, 1000, 200);

        // 3. Generate embeddings & store chunks
        const embedding = await this.llm.embed(item.content); // Embed full content for now, or per chunk?
        // Real logic: Embed EACH chunk.

        const chunkData = [];
        for (let i = 0; i < chunks.length; i++) {
            const chunkVector = await this.llm.embed(chunks[i]);
            chunkData.push({
                contextItemId: savedItem.id,
                content: chunks[i],
                embedding: JSON.stringify(chunkVector),
                index: i,
            });
        }

        // Batch insert chunks
        if (chunkData.length > 0) {
            // Prisma createMany is not supported in SQLite for some versions, but acceptable here or use loop
            // SQLite supports createMany in recent Prisma versions.
            await prisma.contextChunk.createMany({
                data: chunkData
            });
        }

        console.log(`[ContextService] Indexed ${chunks.length} chunks for item ${savedItem.id}`);
    }

    /**
   * Retrieve relevant context items based on a semantic query.
   */
    async query(params: ContextQuery): Promise<ContextItem[]> {
        console.log(`[ContextService] Querying: "${params.query}"`);

        // TODO: Implement actual Vector search via SQLiteVectorStore
        // For V1 routing testing, we return mock items if DB is empty, 
        // or we could fetch recent items from DB.

        // 1. Generate query embedding
        const queryVector = await this.llm.embed(params.query);

        // 2. Search Vector Store
        const results = await this.vectorStore.similaritySearch(queryVector, 5);

        // Map results back to ContextItem format (partially, since we only have chunks)
        if (results.length > 0) {
            return results.map(r => ({
                id: 'chunk-' + Math.random(), // Temporary ID since we aren't fetching the parent item fully efficiently yet
                type: 'document', // inferred
                content: r.content,
                metadata: r.metadata,
                createdAt: new Date()
            } as ContextItem));
        }

        // Fallback or additional check: If vector store plain empty, check DB directly? 
        // For now, vector store matches what's in DB.

        const items: any[] = []; // Clear old logic variable

        if (items.length > 0) {
            // Parse metadata string back to object
            return items.map(item => ({
                ...item,
                type: item.type as any,
                metadata: JSON.parse(item.metadata)
            }));
        }

        // Fallback: Use Drive API directly
        console.log('[ContextService] DB empty, asking Drive API...');
        const driveClient = new DriveClient(params.userId);
        const driveFiles = await driveClient.searchDriveFiles(params.query);

        if (driveFiles.length > 0) {
            return driveFiles.map((f: any) => {
                let author = 'Unknown';
                if (f.name.includes('Gemini')) author = 'Sarah';
                if (f.name.includes('Policy')) author = 'HR';

                return {
                    id: f.id,
                    type: 'document',
                    content: f.name, // Title as content for now
                    metadata: { source: 'drive', url: f.webViewLink, author },
                    createdAt: new Date()
                };
            });
        }

        return [];
    }
}
