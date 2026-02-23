import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const coverageMaps = await prisma.coverageMap.findMany({
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

import { z } from 'zod';

const createCoverageSchema = z.object({
    topic: z.string().min(1),
    contactId: z.string().min(1),
    userId: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const body = createCoverageSchema.parse(json);
        const { topic, contactId, userId } = body;

        // For MVP, we might need a default user if not provided, or assume auth.
        // We'll just require userId for now or find the first user.
        let targetUserId = userId;
        if (!targetUserId) {
            const firstUser = await prisma.user.findFirst();
            if (firstUser) targetUserId = firstUser.id;
            else {
                // Create a dummy user if none exists
                const newUser = await prisma.user.create({
                    data: {
                        email: "demo@example.com",
                        name: "Demo User"
                    }
                });
                targetUserId = newUser.id;
            }
        }

        const newMap = await prisma.coverageMap.create({
            data: {
                topic,
                contactId,
                userId: targetUserId,
            },
        });
        return NextResponse.json(newMap);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create coverage map' }, { status: 500 });
    }
}
