import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });

        const [emailsProcessed, rulesCount, coverageCount] = await Promise.all([
            prisma.activityLog.count({ where: { userId: session.user.id, action: 'EMAIL_RESPONDED' } }),
            prisma.responseRule.count({ where: { userId: session.user.id } }),
            prisma.coverageMap.count({ where: { userId: session.user.id } }),
        ]);

        return NextResponse.json({
            emailsProcessed,
            rulesCount,
            coverageCount,
            managerName: user?.managerName || '',
            managerEmail: user?.managerEmail || '',
            oooStartDate: user?.oooStartDate,
            oooEndDate: user?.oooEndDate,
            escalations: 0, // Mock for now
            pendingItems: 0 // Mock for now
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
