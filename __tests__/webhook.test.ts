import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/webhooks/gmail/route';
import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/db';

// Mock the dependencies
vi.mock('@/lib/inngest/client', () => ({
    inngest: {
        send: vi.fn(),
    }
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
        expect(inngest.send).not.toHaveBeenCalled();
    });

    it('should trigger inngest if user exists and agent is enabled', async () => {
        // Mock finding an active user
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: 'valid-user-id',
            agentEnabled: true,
        } as any);

        const payload = { emailAddress: 'active@example.com', historyId: '67890' };
        const req = createRequest({
            message: { data: Buffer.from(JSON.stringify(payload)).toString('base64') }
        });

        const res = await POST(req);

        expect(res.status).toBe(200);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: 'active@example.com' },
            select: { id: true, agentEnabled: true }
        });

        expect(inngest.send).toHaveBeenCalledWith({
            name: 'gmail/push.received',
            data: {
                userId: 'valid-user-id',
                email: 'active@example.com',
                historyId: '67890'
            }
        });
    });
});
