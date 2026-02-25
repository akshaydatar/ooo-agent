import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { inngest } from '@/lib/inngest/client';

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

        // 2. Trigger Inngest to process the change
        // We use a specific event for push-based processing
        await inngest.send({
            name: 'gmail/push.received',
            data: {
                userId: user.id,
                email: emailAddress,
                historyId: historyId
            }
        });

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error("[Gmail Webhook] Error processing notification:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
