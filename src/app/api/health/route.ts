import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Simple query to verify DB connection
        const userCount = await prisma.user.count();
        return NextResponse.json({
            status: 'ok',
            database: 'connected',
            userCount
        });
    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json({
            status: 'error',
            database: 'disconnected',
            error: String(error)
        }, { status: 500 });
    }
}
