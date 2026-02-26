import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                agentEnabled: true,
                managerName: true,
                managerEmail: true,
                oooStartDate: true,
                oooEndDate: true,
                allowContextSummaries: true
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Failed to fetch settings:", error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

const updateSettingsSchema = z.object({
    agentEnabled: z.boolean().optional(),
    managerName: z.string().optional(),
    managerEmail: z.string().email().optional().or(z.literal('')),
    oooStartDate: z.string().datetime().nullable().optional(),
    oooEndDate: z.string().datetime().nullable().optional(),
    allowContextSummaries: z.boolean().optional(),
}).strict();

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const json = await request.json();
        const body = updateSettingsSchema.parse(json);

        const updateData: Record<string, unknown> = {};
        if (body.agentEnabled !== undefined) updateData.agentEnabled = body.agentEnabled;
        if (body.managerName !== undefined) updateData.managerName = body.managerName;
        if (body.managerEmail !== undefined) updateData.managerEmail = body.managerEmail;
        if (body.oooStartDate !== undefined) updateData.oooStartDate = body.oooStartDate ? new Date(body.oooStartDate) : null;
        if (body.oooEndDate !== undefined) updateData.oooEndDate = body.oooEndDate ? new Date(body.oooEndDate) : null;
        if (body.allowContextSummaries !== undefined) updateData.allowContextSummaries = body.allowContextSummaries;

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
        });

        const { GmailClient } = await import('@/lib/google/gmail');
        const gmailClient = new GmailClient(user.id);

        // Trigger indexing if enabled
        if (body.agentEnabled === true) {
            try {
                const topicName = process.env.GMAIL_PUBSUB_TOPIC;
                if (!topicName) throw new Error("GMAIL_PUBSUB_TOPIC not configured");
                await gmailClient.watch(topicName);
                console.log(`[API Settings] Successfully subscribed user ${user.id} to Pub/Sub topic ${topicName}`);
            } catch (err) {
                console.error("Failed to establish Gmail push subscription:", err);
            }
        } else if (body.agentEnabled === false) {
            try {
                await gmailClient.stop();
                console.log(`[API Settings] Successfully stopped push subscriptions for user ${user.id}`);
            } catch (err) {
                console.error("Failed to stop Gmail push subscription:", err);
            }
        }

        return NextResponse.json({ success: true, agentEnabled: user.agentEnabled });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
        }
        console.error("Failed to update settings:", error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
