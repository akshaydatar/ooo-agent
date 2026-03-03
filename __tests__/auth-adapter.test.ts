import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from '@auth/prisma-adapter';

const prisma = new PrismaClient();
const adapter = PrismaAdapter(prisma);

describe('PostgreSQL Prisma Adapter Integration', () => {

    beforeAll(async () => {
        // Clear any users and dependent records related to this specific test to avoid race conditions with other parallel tests
        await prisma.activityLog.deleteMany({ where: { user: { email: 'test@example.com' } } });
        await prisma.coverageMap.deleteMany({ where: { user: { email: 'test@example.com' } } });
        await prisma.responseRule.deleteMany({ where: { user: { email: 'test@example.com' } } });
        await prisma.contextChunk.deleteMany({ where: { contextItem: { user: { email: 'test@example.com' } } } });
        await prisma.contextItem.deleteMany({ where: { user: { email: 'test@example.com' } } });
        await prisma.account.deleteMany({ where: { user: { email: 'test@example.com' } } });
        await prisma.session.deleteMany({ where: { user: { email: 'test@example.com' } } });
        await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should create a new user via NextAuth adapter', async () => {
        const testUser = {
            id: 'test-user-id',
            email: 'test@example.com',
            emailVerified: new Date(),
            name: 'Test Setup',
            image: 'http://example.com/avatar.png'
        };

        // This simulates NextAuth calling the adapter when a user signs in for the first time via OAuth
        const createdUser = await adapter.createUser!(testUser);

        expect(createdUser).toBeDefined();
        expect(createdUser.id).toBeDefined();
        expect(createdUser.email).toBe(testUser.email);

        // Let's verify it persists
        const fetchedUser = await prisma.user.findUnique({
            where: { email: testUser.email }
        });

        expect(fetchedUser).not.toBeNull();
        expect(fetchedUser?.email).toBe(testUser.email);
    });

    it('should create an account linking it to the user', async () => {
        const testUser = await prisma.user.findUnique({ where: { email: 'test@example.com' } });

        expect(testUser).toBeDefined();

        const testAccount = {
            userId: testUser!.id,
            type: 'oauth' as const,
            provider: 'google',
            providerAccountId: 'google-123456789',
            access_token: 'dummy-token',
        };

        const createdAccount = await adapter.linkAccount!(testAccount);
        expect(createdAccount).toBeDefined();
        expect(createdAccount.providerAccountId).toBe(testAccount.providerAccountId);

        // Fetch accounts for user
        const accountsResult = await prisma.account.findMany({ where: { userId: testUser!.id } });
        expect(accountsResult.length).toBe(1);
        expect(accountsResult[0].provider).toBe('google');
    });
});
