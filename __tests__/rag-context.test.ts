import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextService } from '@/modules/context/service';
import { ResponseService } from '@/modules/response/service';
import { RulesService } from '@/modules/rules/service';
import { MockLLMProvider } from '@/lib/llm';
import { SQLiteVectorStore } from '@/lib/vector-store';
import { prisma } from '@/lib/db';

// Mock Dependencies using classes to avoid "is not a constructor" errors
vi.mock('@/lib/google/gmail', () => ({
    GmailClient: class {
        authenticate = vi.fn().mockResolvedValue(undefined);
        sendResponse = vi.fn().mockResolvedValue(undefined);
        createDraft = vi.fn().mockResolvedValue({ id: 'mock-draft-id' });
        getUnreadEmails = vi.fn().mockResolvedValue([]);
        markAsRead = vi.fn().mockResolvedValue(undefined);
    }
}));

vi.mock('@/lib/google/drive', () => ({
    DriveClient: class {
        authenticate = vi.fn().mockResolvedValue(undefined);
        searchDriveFiles = vi.fn().mockResolvedValue([]);
        fetchRecentDocuments = vi.fn().mockResolvedValue([]);
    }
}));

// Mock LocalEmbeddingService to avoid ONNX runtime errors in tests
vi.mock('@/lib/local-embeddings', () => ({
    LocalEmbeddingService: {
        embed: vi.fn().mockResolvedValue(new Array(384).fill(0.1))
    }
}));

describe('RAG Context Engine', () => {
    let contextService: ContextService;
    let responseService: ResponseService;
    const userId = 'test-user-rag';

    beforeEach(async () => {
        vi.clearAllMocks();
        process.env.NODE_ENV = 'test';
        process.env.OVERRIDE_VECTOR_STORE = 'sqlite';

        const mockLLM = new MockLLMProvider();
        const sqliteStore = new SQLiteVectorStore();
        
        contextService = new ContextService(undefined, { 
            vectorStore: sqliteStore, 
            llm: mockLLM 
        });
        
        responseService = new ResponseService({ 
            llm: mockLLM, 
            contextService: contextService 
        });

        // Clean user context
        await prisma.contextChunk.deleteMany({ where: { contextItem: { userId } } });
        await prisma.contextItem.deleteMany({ where: { userId } });
        await prisma.user.upsert({
            where: { id: userId },
            update: { agentEnabled: true },
            create: { id: userId, email: 'rag@test.com', agentEnabled: true, allowContextSummaries: true }
        });
    });

    it('should index and retrieve items via semantic query', async () => {
        const item = {
            id: 'item-1',
            type: 'document' as const,
            content: 'The company pet policy: dogs are allowed on Fridays but must be on a leash.',
            metadata: { title: 'Pet Policy' },
            createdAt: new Date()
        };

        await contextService.indexItem({ ...item, userId });

        const results = await contextService.query({ userId, query: 'Are pets allowed?' });
        
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].content).toContain('pet policy');
        expect(results[0].content).toContain('dogs are allowed');
    });

    it('should include retrieved context in the draft response', async () => {
        // 1. Create a rule to trigger AI Summary
        const rulesService = new RulesService();
        await rulesService.createRule(userId, 'Generic Rule', { type: 'subject', value: 'launch' }, { type: 'instructions', value: 'Answer using context.' }, 1);

        // 2. Index some context
        await contextService.indexItem({
            id: 'item-2',
            type: 'email' as const,
            content: 'Project X launch date is set for December 1st.',
            metadata: { subject: 'Launch Date' },
            userId
        });

        const draft = await responseService.generateDraft({
            userId,
            id: 'msg-rag',
            sender: 'partner@client.com',
            subject: 'When is the launch?',
            content: 'Need to know the date.',
            receivedAt: new Date()
        });

        expect(draft.body).toContain('Mock response');
    });
});
