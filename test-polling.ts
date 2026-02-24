import { prisma } from './src/lib/db';
import { GmailClient } from './src/lib/google/gmail';

async function main() {
    console.log('1. Checking Active Users in Database...');
    const activeUsers = await prisma.user.findMany({
        where: { agentEnabled: true },
        select: { id: true, email: true, name: true, agentEnabled: true }
    });

    console.log(`Found ${activeUsers.length} active users.`);
    if (activeUsers.length > 0) {
        console.log(activeUsers);
    }

    const allUsers = await prisma.user.findMany({ select: { id: true, email: true, agentEnabled: true } });
    console.log(`\nAll users in DB (${allUsers.length}):`);
    console.log(allUsers);

    if (activeUsers.length === 0) {
        console.log('\nNo active users found. The cron job will skip because `agentEnabled` is false.');
        return;
    }

    for (const user of activeUsers) {
        console.log(`\n2. Polling emails for user ${user.email} (${user.id})...`);
        try {
            const gmailClient = new GmailClient(user.id);
            const unreadEmails = await gmailClient.getUnreadEmails(10);
            console.log(`Unread Emails Found: ${unreadEmails.length}`);

            for (const email of unreadEmails) {
                console.log(`  - Processing Email: [${email.subject}] from ${email.sender}`);
            }
        } catch (err: any) {
            console.error(`Error polling for user ${user.email}:`, err.message);
        }
    }
}

main()
    .catch(e => console.error('Fatal Error:', e))
    .finally(() => prisma.$disconnect());
