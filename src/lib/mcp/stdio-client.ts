import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MCPClient, MCPTool, MCPResource, MCPCallToolResult, MCPReadResourceResult } from './client';
import { MCPServerConfig } from './config';

export class StdioMCPClient implements MCPClient {
    private client: Client;
    private transport: StdioClientTransport;

    constructor(config: MCPServerConfig) {
        this.transport = new StdioClientTransport({
            command: config.command,
            args: config.args || [],
            env: config.env
        });

        this.client = new Client(
            {
                name: "ooo-agent-client",
                version: "1.0.0"
            },
            {
                capabilities: {}
            }
        );
    }

    async connect() {
        await this.client.connect(this.transport);
    }

    async listTools(): Promise<MCPTool[]> {
        const result = await this.client.listTools();
        return result.tools.map(t => ({
            name: t.name,
            description: t.description || '',
            parameters: t.inputSchema as any
        }));
    }

    async callTool(name: string, args: Record<string, any>): Promise<MCPCallToolResult> {
        const result = await this.client.callTool({
            name,
            arguments: args
        });

        // The SDK result.content is (TextContent | ImageContent | EmbeddedResource)[]
        // We map it to our simple shim format
        return {
            content: (result.content as any[]).map(c => {
                if (c.type === 'text') {
                    return { type: 'text', text: c.text };
                }
                return { type: 'text', text: JSON.stringify(c) };
            })
        };
    }

    async listResources(): Promise<MCPResource[]> {
        const result = await this.client.listResources();
        return result.resources.map(r => ({
            uri: r.uri,
            name: r.name,
            mimeType: r.mimeType
        }));
    }

    async readResource(uri: string): Promise<MCPReadResourceResult> {
        const result = await this.client.readResource({ uri });
        return {
            contents: result.contents.map(c => {
                // Check if it's text resource
                const text = 'text' in c ? c.text : '';
                return {
                    uri: c.uri,
                    mimeType: c.mimeType || 'text/plain',
                    text: text
                };
            })
        };
    }

    async close() {
        await this.client.close();
    }
}
