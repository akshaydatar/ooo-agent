import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { agentEnabled } = body;

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: { agentEnabled }
        });

        // Trigger indexing if enabled
        if (agentEnabled) {
            console.log(`[API Settings] OOO Agent activated for user ${user.id}. Firing event...`);
            // In a real app we would await inngest.send({ name: 'ooo.agent/activated', data: { userId: user.id } })
            try {
                await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/inngest`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'ooo.agent/activated', data: { userId: user.id } })
                }).catch(() => { }); // Fire and forget for local
            } catch (e) { }
        }

        return NextResponse.json({ success: true, agentEnabled: user.agentEnabled });
    } catch (error) {
        console.error("Failed to update settings", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
