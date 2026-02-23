"use server"

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function checkMCPConnection(service: 'gmail' | 'drive' | 'slack' | 'calendar') {
    console.log(`[Server Action] Checking connection for Google Workspace (${service})...`);

    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, message: 'Not authenticated' };

        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: 'google',
            },
        });

        // Artificial delay for UI effect
        await new Promise(resolve => setTimeout(resolve, 800));

        if (account && account.access_token) {
            return { success: true, message: 'Connected via Google API' };
        }

        return { success: false, message: 'Service not linked' };
    } catch (error) {
        console.error('Connection Error:', error);
        return { success: false, message: 'Connection failed' };
    }
}
