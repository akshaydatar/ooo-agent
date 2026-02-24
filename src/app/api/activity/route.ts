import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const activities = await prisma.activityLog.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        const mapped = activities.map(act => {
            let meta: any = {};
            try { if (act.metadata) meta = JSON.parse(act.metadata); } catch (e) { }

            // Normalize statuses
            let status = 'pending';
            let description = '';

            if (act.action === 'EMAIL_RESPONDED') {
                status = 'resolved';
                description = `Replied to ${meta.target}`;
            } else if (act.action === 'POLICY_BLOCKED') {
                status = 'escalated';
                description = `Blocked reply to ${meta.target} (${meta.reason})`;
            } else if (act.action === 'ESCALATED') {
                status = 'escalated';
                description = `Escalated to human review`;
            }

            return {
                id: act.id,
                action: act.action,
                status,
                description,
                subject: meta.subject || 'Unknown Topic',
                createdAt: act.createdAt
            };
        });

        return NextResponse.json(mapped);
    } catch (error) {
        console.error("Failed to fetch activity logs", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
