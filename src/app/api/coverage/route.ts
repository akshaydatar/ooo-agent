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
    contactEmail: z.string().email().optional().or(z.literal('')),
    userId: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const body = createCoverageSchema.parse(json);
        const { topic, contactId, contactEmail, userId } = body;

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
                contactEmail,
                userId: targetUserId,
            },
        });
        return NextResponse.json(newMap);
    } catch (error: any) {
        console.error("CREATE coverage map error:", error);
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create coverage map', details: error.message || String(error) }, { status: 500 });
    }
}
