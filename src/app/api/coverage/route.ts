import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const coverageMaps = await prisma.coverageMap.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: 'desc' },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });
        return NextResponse.json(coverageMaps);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch coverage maps' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { topic, contactId } = body;

        const newMap = await prisma.coverageMap.create({
            data: {
                topic,
                contactId,
                userId: session.user.id,
            },
        });
        return NextResponse.json(newMap);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create coverage map' }, { status: 500 });
    }
}
