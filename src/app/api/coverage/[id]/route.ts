import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership before deleting
        const coverageMap = await prisma.coverageMap.findUnique({
            where: { id },
        });

        if (!coverageMap) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        if (coverageMap.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.coverageMap.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete coverage map:", error);
        return NextResponse.json({ error: 'Failed to delete coverage map' }, { status: 500 });
    }
}
