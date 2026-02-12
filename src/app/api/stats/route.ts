import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const [emailsProcessed, rulesCount, coverageCount] = await Promise.all([
            prisma.activityLog.count({ where: { action: 'EMAIL_RESPONDED' } }),
            prisma.responseRule.count(),
            prisma.coverageMap.count(),
        ]);

        return NextResponse.json({
            emailsProcessed,
            rulesCount,
            coverageCount,
            escalations: 0, // Mock for now
            pendingItems: 0 // Mock for now
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
