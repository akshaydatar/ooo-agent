"use server"

import { MockMCPClient } from "@/lib/mcp/mock-adapter";

// In a real app, this would use a singleton or connection pool
const mcp = new MockMCPClient();

export async function checkMCPConnection(service: 'gmail' | 'drive' | 'slack' | 'calendar') {
    console.log(`[Server Action] Checking connection for ${service}...`);

    // Simulate a ping to the MCP tool to verify connectivity
    try {
        const tools = await mcp.listTools();
        const hasTool = tools.some(t => t.name.startsWith(service));

        // Artificial delay for UI effect
        await new Promise(resolve => setTimeout(resolve, 800));

        return { success: hasTool, message: hasTool ? 'Connected via MCP' : 'Service not available' };
    } catch (error) {
        console.error('MCP Connection Error:', error);
        return { success: false, message: 'Connection failed' };
    }
}
