import { z } from 'zod';

export const MCPServerConfigSchema = z.object({
    name: z.string(),
    command: z.string(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
});

export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>;

export interface MCPConfig {
    servers: MCPServerConfig[];
}

export function loadMCPConfig(): MCPConfig {
    // In a real app, this might load from a file like mcp.config.json or .env
    // For now, we'll return a default config that can be overridden by env vars

    // Example: Return an empty list or configured servers if we have them
    // We will mostly assume the user configures this via specific environment variables or a specific file
    // For this v0, we can default to looking for a local 'gdrive-server' if running

    return {
        servers: []
    };
}
