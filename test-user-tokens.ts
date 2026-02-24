import { prisma } from './src/lib/db';

async function main() {
    console.log('Inspecting Users and Accounts...');
    const users = await prisma.user.findMany({
        where: { agentEnabled: true },
        include: { accounts: true }
    });

    for (const user of users) {
        console.log(`\nUser: ${user.name} (${user.email}) - ID: ${user.id}`);
        if (user.accounts.length === 0) {
            console.log('  No OAuth accounts linked!');
            continue;
        }
        for (const acc of user.accounts) {
            console.log(`  Provider: ${acc.provider}`);
            console.log(`  Has Access Token: ${!!acc.access_token}`);
            console.log(`  Has Refresh Token: ${!!acc.refresh_token}`);
            console.log(`  Expires At: ${acc.expires_at} (${acc.expires_at ? new Date(acc.expires_at * 1000).toLocaleString() : 'N/A'})`);
        }
    }
}

main().finally(() => prisma.$disconnect());
