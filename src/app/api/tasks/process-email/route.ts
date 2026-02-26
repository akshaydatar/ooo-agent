import { NextResponse } from 'next/server';
import { GmailClient } from '@/lib/google/gmail';
import { ResponseService } from '@/modules/response/service';

/**
 * Background Task Handler for processing new emails
 * Invoked securely by Google Cloud Tasks
 */
export async function POST(request: Request) {
    try {
        // Basic security check to ensure this request comes from Cloud Tasks
        // Cloud Tasks always sets this header: https://cloud.google.com/tasks/docs/creating-http-target-tasks#handler
        if (process.env.NODE_ENV !== 'development') {
            const isCloudTask = request.headers.get('x-cloudtasks-queuename');
            if (!isCloudTask) {
                console.warn("[Cloud Task] Unauthorized invocation attempt.");
                return new NextResponse("Unauthorized", { status: 401 });
            }
        }

        const body = await request.json();
        const { userId, email: emailAddress, historyId } = body;

        if (!userId) {
            return new NextResponse("Missing userId", { status: 400 });
        }

        console.log(`[Cloud Task] Processing push notification for user ${userId}, email: ${emailAddress}`);

        const responseService = new ResponseService();
        const gmailClient = new GmailClient(userId);

        // Fetch unread emails associated with this push
        const unreadEmails = await gmailClient.getUnreadEmails(5);
        let processed = 0;

        for (const email of unreadEmails) {
            try {
                console.log(`[Cloud Task] Generating draft for email ${email.id} from ${email.sender}`);
                await responseService.generateDraft({
                    userId,
                    id: email.id,
                    sender: email.sender,
                    subject: email.subject,
                    content: email.content,
                    receivedAt: email.receivedAt
                });

                await gmailClient.markAsRead(email.id);
                processed++;
                console.log(`[Cloud Task] Successfully processed and marked ${email.id} as read`);
            } catch (err) {
                console.error(`[Cloud Task] Failed processing email ${email.id}:`, err);
                // Don't throw here, continue processing other emails
            }
        }

        return new NextResponse(JSON.stringify({ success: true, processed }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("[Cloud Task] Error executing task:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
