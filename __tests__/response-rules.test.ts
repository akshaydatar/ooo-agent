import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RulesService } from '@/modules/rules/service';
import { ResponseService } from '@/modules/response/service';
import { ContextService } from '@/modules/context/service';
import { MockLLMProvider } from '@/lib/llm';
import { SQLiteVectorStore } from '@/lib/vector-store';
import { prisma } from '@/lib/db';

// Mock Dependencies using classes to avoid "is not a constructor" errors
vi.mock('@/lib/google/gmail', () => {
    return {
        GmailClient: class {
            authenticate = vi.fn().mockResolvedValue(undefined);
            sendResponse = vi.fn().mockResolvedValue(undefined);
            createDraft = vi.fn().mockResolvedValue({ id: 'mock-draft-id' });
            getUnreadEmails = vi.fn().mockResolvedValue([]);
            markAsRead = vi.fn().mockResolvedValue(undefined);
        }
    };
});

vi.mock('@/lib/google/drive', () => {
    return {
        DriveClient: class {
            authenticate = vi.fn().mockResolvedValue(undefined);
            searchDriveFiles = vi.fn().mockResolvedValue([]);
            fetchRecentDocuments = vi.fn().mockResolvedValue([]);
        }
    };
});

// Mock LocalEmbeddingService to avoid ONNX runtime errors in tests
vi.mock('@/lib/local-embeddings', () => {
    return {
        LocalEmbeddingService: {
            embed: vi.fn().mockResolvedValue(new Array(384).fill(0.1))
        }
    };
});

describe('Response Rules Engine', () => {
    let rulesService: RulesService;
    let responseService: ResponseService;
    let contextService: ContextService;
    const userId = 'test-user-rules';

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.stubEnv('NODE_ENV', 'test');
        vi.stubEnv('OVERRIDE_VECTOR_STORE', 'sqlite');

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

        rulesService = new RulesService();

        // Clean DB for this user
        await prisma.responseRule.deleteMany({ where: { userId } });
        await prisma.user.deleteMany({ where: { email: 'rules-engine@example.com' } });
        await prisma.user.upsert({
            where: { id: userId },
            update: { agentEnabled: true },
            create: {
                id: userId,
                email: 'rules-engine@example.com',
                agentEnabled: true,
                allowContextSummaries: true
            }
        });
    });

    it('should respect rule priority (High wins over Low)', async () => {
        await rulesService.createRule(userId, 'Low Priority', { type: 'keyword', value: 'urgent' }, { type: 'instructions', value: 'Low' }, 1);
        await rulesService.createRule(userId, 'High Priority', { type: 'sender', value: 'boss@company.com' }, { type: 'instructions', value: 'High' }, 10);

        const match = await rulesService.evaluate(userId, {
            sender: 'boss@company.com',
            subject: 'Urgent matter',
            body: 'This is urgent!'
        });

        expect(match?.name).toBe('High Priority');
    });

    it('should perform case-insensitive subject matching', async () => {
        await rulesService.createRule(userId, 'Subject Match', { type: 'subject', value: 'Urgent' }, { type: 'instructions', value: 'Match' }, 5);

        const match = await rulesService.evaluate(userId, {
            sender: 'someone@else.com',
            subject: 'URGENT SUBJECT',
            body: 'content'
        });

        expect(match?.name).toBe('Subject Match');
    });

    it('should perform partial sender matching', async () => {
        await rulesService.createRule(userId, 'Domain Match', { type: 'sender', value: '@partner.com' }, { type: 'instructions', value: 'Match' }, 5);

        const match = await rulesService.evaluate(userId, {
            sender: 'contact@partner.com',
            subject: 'Hello',
            body: 'content'
        });

        expect(match?.name).toBe('Domain Match');
    });

    it('should return null when no rules match', async () => {
        const match = await rulesService.evaluate(userId, {
            sender: 'stranger@internet.com',
            subject: 'Spam',
            body: 'Buy now'
        });

        expect(match).toBeNull();
    });

    it('should integrate with ResponseService to generate a draft with Assistant Note', async () => {
        await rulesService.createRule(userId, 'Priority Rule', { type: 'sender', value: 'boss@company.com' }, { type: 'instructions', value: 'Handle with care' }, 10);

        const draft = await responseService.generateDraft({
            userId,
            id: 'msg-123',
            sender: 'boss@company.com',
            subject: 'Project Update',
            content: 'How is it going?',
            receivedAt: new Date()
        });

        expect(draft.status).toBe('draft');
        expect(draft.body).toContain('Mock response');
    });
});
