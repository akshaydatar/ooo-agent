import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/webhooks/gmail/route';
import { prisma } from '@/lib/db';

const createTaskMock = vi.fn().mockResolvedValue([{ name: 'mock-task-name' }]);
const queuePathMock = vi.fn().mockReturnValue('mock-queue-path');

// Mock the dependencies
vi.mock('@google-cloud/tasks', () => ({
    CloudTasksClient: vi.fn().mockImplementation(function () {
        return {
            createTask: createTaskMock,
            queuePath: queuePathMock,
        };
    }),
}));

vi.mock('@/lib/db', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        }
    }
}));

describe('Gmail Pub/Sub Webhook Route', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createRequest = (body: any) => {
        return new Request('http://localhost/api/webhooks/gmail', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    };

    it('should return 400 if message data is missing', async () => {
        const req = createRequest({ message: {} });
        const res = await POST(req);

        expect(res.status).toBe(400);
        expect(await res.text()).toContain('Invalid Pub/Sub message');
    });

    it('should return 200 and skip if user does not exist', async () => {
        // Mock finding no user
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

        const payload = { emailAddress: 'unknown@example.com', historyId: '12345' };
        const req = createRequest({
            message: { data: Buffer.from(JSON.stringify(payload)).toString('base64') }
        });

        const res = await POST(req);

        expect(res.status).toBe(200);
        expect(await res.text()).toBe('OK');
        expect(createTaskMock).not.toHaveBeenCalled();
    });

    it('should enqueue a Cloud Task if user exists and agent is enabled', async () => {
        // Mock finding an active user
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: 'valid-user-id',
            agentEnabled: true,
        } as any);

        const payload = { emailAddress: 'active@example.com', historyId: '67890' };
        const req = createRequest({
            message: { data: Buffer.from(JSON.stringify(payload)).toString('base64') }
        });

        // Set NODE_ENV to production temporarily to ensure CloudTasksClient is used instead of dev mock bypass
        vi.stubEnv('NODE_ENV', 'production');

        const res = await POST(req);

        vi.unstubAllEnvs();

        expect(res.status).toBe(200);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: 'active@example.com' },
            select: { id: true, agentEnabled: true }
        });

        expect(createTaskMock).toHaveBeenCalled();
        const taskArg = createTaskMock.mock.calls[0][0].task;

        expect(taskArg.httpRequest.url).toContain('/api/tasks/process-email');
        expect(taskArg.httpRequest.httpMethod).toBe('POST');

        // Assert payload is correctly base64 encoded
        const decodedPayload = JSON.parse(Buffer.from(taskArg.httpRequest.body, 'base64').toString('utf-8'));
        expect(decodedPayload).toEqual({
            userId: 'valid-user-id',
            email: 'active@example.com',
            historyId: '67890'
        });
    });
});
