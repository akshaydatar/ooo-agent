import { prisma } from '../src/lib/db';

async function main() {
    console.log('Clearing old OAuth accounts to force token refresh...');
    const result = await prisma.account.deleteMany({
        where: { provider: 'google' }
    });
    console.log(`Deleted ${result.count} stale Google accounts.`);
}

main().finally(() => prisma.$disconnect());
