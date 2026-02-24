import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        // Skip auth check for test MVP or enforce if session exists

        const { id } = await params;

        await prisma.coverageMap.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete coverage map:", error);
        return NextResponse.json({ error: 'Failed to delete coverage map' }, { status: 500 });
    }
}
