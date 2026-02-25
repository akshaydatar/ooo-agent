import { prisma } from '../src/lib/db';
import { inngest } from '../src/lib/inngest/client';

// Ensure local dev server bypasses auth
process.env.INNGEST_EVENT_KEY = 'local';

async function main() {
    console.log("Setting up E2E Webhook Test Environment...");

    // 1. Create a dummy user
    const user = await prisma.user.upsert({
        where: { email: 'e2e-test@example.com' },
        update: { agentEnabled: true },
        create: {
            email: 'e2e-test@example.com',
            name: 'E2E Test User',
            agentEnabled: true,
        }
    });

    console.log(`User created. ID: ${user.id}`);

    // 2. Simulate a Webhook POST
    console.log("Simulating Webhook POST to http://localhost:3000/api/webhooks/gmail");

    const payload = {
        emailAddress: 'e2e-test@example.com',
        historyId: '999999'
    };

    const encodedData = Buffer.from(JSON.stringify(payload)).toString('base64');

    try {
        const response = await fetch('http://localhost:3000/api/webhooks/gmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: { data: encodedData }
            })
        });

        console.log(`Webhook responded with: ${response.status} ${response.statusText}`);

        if (response.status === 200) {
            console.log("Success! The webhook was accepted. Inngest should now be processing the event in the background.");
            console.log("To verify, check the Inngest Dev Server dashboard (usually http://localhost:8288)");
        }
    } catch (e) {
        console.error("Failed to hit webhook. Is the Next.js server running on port 3000?");
        console.error(e);
    }
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
