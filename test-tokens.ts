import { prisma } from './src/lib/db';

async function main() {
    console.log('Checking Account tokens...');
    const accounts = await prisma.account.findMany({
        where: { provider: 'google' },
        select: { userId: true, access_token: true, refresh_token: true, expires_at: true }
    });
    console.log(accounts.map(a => ({
        userId: a.userId,
        hasAccessToken: !!a.access_token,
        hasRefreshToken: !!a.refresh_token,
        expiresAt: a.expires_at,
        isExpired: a.expires_at ? (a.expires_at * 1000 < Date.now()) : true
    })));
}

main().finally(() => prisma.$disconnect());
