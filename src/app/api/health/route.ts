import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Simple query to verify DB connection
        await prisma.user.count();
        return NextResponse.json({
            status: 'ok',
            database: 'connected',
        });
    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json({
            status: 'error',
            database: 'disconnected',
        }, { status: 500 });
    }
}
