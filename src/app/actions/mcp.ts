"use server"

import { MockMCPClient } from "@/lib/mcp/mock-adapter";

// In a real app, this would use a singleton or connection pool
const mcp = new MockMCPClient();

export async function checkMCPConnection(service: 'gmail' | 'drive' | 'slack' | 'calendar' | 'google_workspace') {
    console.log(`[Server Action] Checking connection for ${service}...`);

    // Simulate a ping to the MCP tool to verify connectivity
    try {
        const tools = await mcp.listTools();

        if (service === 'google_workspace') {
            // Check if we have at least one or all. For now, let's say purely if we have access to any google service
            // In a real scenario, we'd want to check specific scopes.
            const hasGmail = tools.some(t => t.name.startsWith('gmail'));
            const hasCalendar = tools.some(t => t.name.startsWith('calendar'));
            const hasDrive = tools.some(t => t.name.startsWith('drive')); // Mock might not have drive yet, but let's assume valid if gmail/cal are there

            // Artificial delay
            await new Promise(resolve => setTimeout(resolve, 800));

            // For the sake of the demo, if we have gmail/calendar, we assume "Workspace" is connected
            const isConnected = hasGmail || hasCalendar;
            return { success: isConnected, message: isConnected ? 'Connected to Google Workspace' : 'Could not connect to Google Services' };
        }

        const hasTool = tools.some(t => t.name.startsWith(service));

        // Artificial delay for UI effect
        await new Promise(resolve => setTimeout(resolve, 800));

        return { success: hasTool, message: hasTool ? 'Connected via MCP' : 'Service not available' };
    } catch (error) {
        console.error('MCP Connection Error:', error);
        return { success: false, message: 'Connection failed' };
    }
}
