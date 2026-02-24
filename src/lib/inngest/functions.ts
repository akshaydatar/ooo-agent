import { inngest } from "./client";
import { NonRetriableError } from "inngest";
import { GmailClient } from "../google/gmail";
import { DriveClient } from "../google/drive";
import { ContextService } from "@/modules/context/service";
import { prisma } from "../db";

const enforceRateLimitBackoff = (module: string, error: any) => {
    console.error(`[Inngest] ${module} error:`, error?.message);
    const isRateLimit = error?.status === 429 || error?.code === 429 || error?.message?.includes('429') || error?.message?.includes('rate limit') || error?.message?.includes('quota');
    if (isRateLimit) {
        // Log that we are relying on Inngest's exponential backoff for this step
        console.warn(`[Inngest] 429 Rate Limit hit in ${module}. Throwing to trigger exponential backoff retry.`);
        throw error;
    }
    throw new NonRetriableError(`${module} failed without rate limiting. Skipping retries.`, { cause: error });
};

export const startContextIndexing = inngest.createFunction(
    { id: "start-context-indexing", retries: 5 }, // Allow up to 5 retries for backoff
    { event: "ooo.agent/activated" },
    async ({ event, step }) => {
        const userId = event.data.userId;

        // 1. Verify user's token and get config
        const user = await step.run("get-user-config", async () => {
            return await prisma.user.findUnique({ where: { id: userId } });
        });

        if (!user || !user.agentEnabled) {
            return { skipped: true, reason: "Agent not enabled or user not found" };
        }

        const contextService = new ContextService();

        // 2. Fetch and Index Gmail Threads
        await step.run("index-gmail-threads", async () => {
            console.log(`[Inngest] Running index-gmail-threads for user ${userId}`);
            try {
                const gmailClient = new GmailClient(userId);
                const threads = await gmailClient.fetchRecentThreads(25); // Limit for MVP

                let count = 0;
                for (const thread of threads) {
                    await contextService.indexItem({ ...thread, userId });
                    count++;
                }
                return { threadsIndexed: count };
            } catch (error: any) {
                enforceRateLimitBackoff("index-gmail-threads", error);
            }
        });

        // 3. Fetch and Index Drive Docs
        await step.run("index-drive-docs", async () => {
            console.log(`[Inngest] Running index-drive-docs for user ${userId}`);
            try {
                const driveClient = new DriveClient(userId);
                const docs = await driveClient.fetchRecentDocuments(10); // Limit for MVP

                let count = 0;
                for (const doc of docs) {
                    await contextService.indexItem({ ...doc, userId });
                    count++;
                }
                return { docsIndexed: count };
            } catch (error: any) {
                enforceRateLimitBackoff("index-drive-docs", error);
            }
        });

        // 4. Fetch and Index Calendar Events
        await step.run("index-calendar-events", async () => {
            console.log(`[Inngest] Running index-calendar-events for user ${userId}`);
            try {
                const { CalendarClient } = await import("../google/calendar");
                const calendarClient = new CalendarClient(userId);
                const events = await calendarClient.fetchRecentEvents(25); // Limit for MVP

                let count = 0;
                for (const event of events) {
                    await contextService.indexItem({ ...event, userId });
                    count++;
                }
                return { eventsIndexed: count };
            } catch (error: any) {
                enforceRateLimitBackoff("index-calendar-events", error);
            }
        });

        return { success: true, userId };
    }
);

export const pollIncomingEmails = inngest.createFunction(
    { id: "poll-incoming-emails", retries: 3 },
    { cron: "*/5 * * * *" }, // Run every 5 minutes
    async ({ step }) => {
        // 1. Find all users who have the agent enabled
        const activeUsers = await step.run("get-active-users", async () => {
            return await prisma.user.findMany({
                where: { agentEnabled: true },
                select: { id: true, email: true }
            });
        });

        if (activeUsers.length === 0) {
            return { skipped: true, reason: "No active users" };
        }

        const results = [];

        // 2. Poll emails per user
        for (const user of activeUsers) {
            const userResult = await step.run(`poll-emails-for-${user.id}`, async () => {
                const { ResponseService } = await import("@/modules/response/service");
                const responseService = new ResponseService();

                try {
                    const gmailClient = new GmailClient(user.id);
                    const unreadEmails = await gmailClient.getUnreadEmails(10);
                    let processed = 0;

                    for (const email of unreadEmails) {
                        try {
                            // Generate response internally (which creates the draft)
                            await responseService.generateDraft({
                                userId: user.id,
                                id: email.id,
                                sender: email.sender,
                                subject: email.subject,
                                content: email.content,
                                receivedAt: email.receivedAt
                            });

                            // Mark as read so we don't process it again next 5 minutes
                            await gmailClient.markAsRead(email.id);
                            processed++;
                        } catch (draftErr) {
                            console.error(`[Inngest] Error generating draft for email ${email.id}:`, draftErr);
                        }
                    }

                    return { userId: user.id, unreadFound: unreadEmails.length, processed };
                } catch (err: any) {
                    try {
                        enforceRateLimitBackoff(`poll-emails-for-${user.id}`, err);
                    } catch (handledErr: any) {
                        return { userId: user.id, error: handledErr?.message || err?.message };
                    }
                }
            });
            results.push(userResult);
        }

        return { success: true, results };
    }
);
