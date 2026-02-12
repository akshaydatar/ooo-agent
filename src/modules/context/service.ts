import { prisma } from '@/lib/db';
import { recursiveCharacterSplit } from '@/lib/chunking';
import { MCPClient } from '@/lib/mcp/client';
import { MockMCPClient } from '@/lib/mcp/mock-adapter';
import { SQLiteVectorStore, VectorStore } from '@/lib/vector-store';
import { ContextItem, ContextQuery, ContextServiceConfig } from './types';

export class ContextService {
    private vectorStore: VectorStore;
    private mcp: MCPClient;

    constructor(config?: ContextServiceConfig) {
        this.vectorStore = new SQLiteVectorStore();
        // In a real app, we'd inject this or load from config
        this.mcp = new MockMCPClient();
    }
    /**
     * Index a new item (email, doc, calendar event) into the vector store and database.
     */
    async indexItem(item: ContextItem): Promise<void> {
        console.log(`[ContextService] Indexing item: ${item.id} (${item.type})`);

        // 1. Store the root item
        const savedItem = await prisma.contextItem.create({
            data: {
                type: item.type,
                content: item.content,
                metadata: JSON.stringify(item.metadata),
            },
        });

        // 2. Split content into sections
        const chunks = recursiveCharacterSplit(item.content, 1000, 200);

        // 3. Generate embeddings & store chunks
        // TODO: Replace mock embedding with actual OpenAI/LLM call
        const mockEmbedding = Array(1536).fill(0).map(() => Math.random());

        const chunkData = chunks.map((chunkText, index) => ({
            contextItemId: savedItem.id,
            content: chunkText,
            // In a real app we'd batch-generate embeddings here
            embedding: JSON.stringify(mockEmbedding),
            index,
        }));

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

        // Check if we have items in DB to return, otherwise mock via MCP
        const items = await prisma.contextItem.findMany({
            take: 5,
            where: {
                content: {
                    contains: params.query
                }
            }
        });

        if (items.length > 0) {
            // Parse metadata string back to object
            return items.map(item => ({
                ...item,
                type: item.type as any,
                metadata: JSON.parse(item.metadata)
            }));
        }

        // Fallback: Use MCP to find relevant docs dynamically
        console.log('[ContextService] DB empty, asking Drive MCP...');
        const mcpResult = await this.mcp.callTool('drive_list_files', { query: params.query });

        if (mcpResult.content[0].text) {
            const driveFiles = JSON.parse(mcpResult.content[0].text);
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
