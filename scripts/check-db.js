const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$connect();
        console.log('✅ Database connection successful');

        // Check if tables exist by counting users (should be 0 or more, but not error)
        const userCount = await prisma.user.count();
        console.log(`✅ Schema check passed. User count: ${userCount}`);

    } catch (e) {
        console.error('❌ Database connection failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
