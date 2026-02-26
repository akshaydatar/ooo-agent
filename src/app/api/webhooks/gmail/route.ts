import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CloudTasksClient } from '@google-cloud/tasks';

const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'ooo-agent-test';
const queue = process.env.CLOUD_TASKS_QUEUE || 'email-processing-queue';
const location = process.env.CLOUD_TASKS_LOCATION || 'us-central1';

/**
 * Webhook for Google Cloud Pub/Sub notifications
 * Receive notifications from Gmail when a user's inbox changes.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Pub/Sub messages are base64 encoded in the 'data' field
        if (!body.message?.data) {
            return new NextResponse("Invalid Pub/Sub message", { status: 400 });
        }

        const decodedData = JSON.parse(
            Buffer.from(body.message.data, 'base64').toString('utf-8')
        );

        const { emailAddress, historyId } = decodedData;
        console.log(`[Gmail Webhook] Notification for ${emailAddress}, historyId: ${historyId}`);

        // 1. Find the user associated with this email
        const user = await prisma.user.findUnique({
            where: { email: emailAddress },
            select: { id: true, agentEnabled: true }
        });

        if (!user || !user.agentEnabled) {
            console.log(`[Gmail Webhook] User ${emailAddress} not found or agent disabled. Skipping.`);
            return new NextResponse("OK", { status: 200 });
        }

        // 2. Enqueue a Cloud Task to process the change
        const payload = { userId: user.id, email: emailAddress, historyId: historyId };

        // Target the internal background worker endpoint
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const task = {
            httpRequest: {
                httpMethod: 'POST' as const,
                url: `${baseUrl}/api/tasks/process-email`,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: Buffer.from(JSON.stringify(payload)).toString('base64'),
            },
        };

        if (process.env.NODE_ENV === 'development') {
            console.log(`[Development Mode] Mocking Cloud Task enqueue for: ${baseUrl}/api/tasks/process-email with data:`, payload);
        } else {
            const client = new CloudTasksClient();
            const parent = client.queuePath(projectId, location, queue);
            const [response] = await client.createTask({ parent, task });
            console.log(`[Gmail Webhook] Enqueued Cloud Task: ${response.name}`);
        }

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error("[Gmail Webhook] Error processing notification:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
