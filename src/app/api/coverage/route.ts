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

        const coverageMaps = await prisma.coverageMap.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: 'desc' },
        });
        return NextResponse.json(coverageMaps);
    } catch (error) {
        console.error("Failed to fetch coverage maps:", error);
        return NextResponse.json({ error: 'Failed to fetch coverage maps' }, { status: 500 });
    }
}

const createCoverageSchema = z.object({
    topic: z.string().min(1),
    contactId: z.string().min(1),
    contactEmail: z.string().email().optional().or(z.literal('')),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const json = await request.json();
        const body = createCoverageSchema.parse(json);

        const newMap = await prisma.coverageMap.create({
            data: {
                topic: body.topic,
                contactId: body.contactId,
                contactEmail: body.contactEmail,
                userId: session.user.id,
            },
        });
        return NextResponse.json(newMap);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
        }
        console.error("Failed to create coverage map:", error);
        return NextResponse.json({ error: 'Failed to create coverage map' }, { status: 500 });
    }
}
