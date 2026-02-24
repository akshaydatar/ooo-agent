import { prisma } from '../src/lib/db';

async function main() {
    console.log('Force-deleting users and accounts to fix OAuthAccountNotLinked error...');

    // We wipe the Users completely. Because of the Cascade delete in the Prisma schema,
    // this will automatically wipe the Accounts, Sessions, and Coverage maps associated with them.
    // This allows a 100% fresh Google OAuth registration flow.
    const result = await prisma.user.deleteMany({
        where: {
            // Target the two users we know were testing this
            email: {
                in: ['akshay.ucd@gmail.com', 'ad-test@datar.org']
            }
        }
    });

    console.log(`Deleted ${result.count} stale User records and their associated OAuth tokens/sessions.`);
}

main().finally(() => prisma.$disconnect());
