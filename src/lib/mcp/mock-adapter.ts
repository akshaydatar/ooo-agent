import { MCPClient, MCPTool, MCPResource, MCPCallToolResult, MCPReadResourceResult } from './client';

export class MockMCPClient implements MCPClient {
    private tools: MCPTool[] = [
        {
            name: 'gmail_list_messages',
            description: 'List messages from Gmail',
            parameters: { type: 'object', properties: { query: { type: 'string' } } }
        },
        {
            name: 'gmail_create_draft',
            description: 'Create a draft email in Gmail',
            parameters: { type: 'object', properties: { to: { type: 'string' }, cc: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } } }
        },
        {
            name: 'drive_list_files',
            description: 'List files from Google Drive',
            parameters: { type: 'object', properties: { query: { type: 'string' } } }
        },
        {
            name: 'slack_post_message',
            description: 'Post a message to Slack',
            parameters: { type: 'object', properties: { channel: { type: 'string' }, text: { type: 'string' } } }
        }
    ];

    private resources: MCPResource[] = [
        { uri: 'drive://docs/policy', name: 'OOO Policy', mimeType: 'text/markdown' },
        { uri: 'drive://docs/project-gemini', name: 'Project Gemini Spec', mimeType: 'text/markdown' }
    ];

    async listTools(): Promise<MCPTool[]> {
        return this.tools;
    }

    async callTool(name: string, args: Record<string, any>): Promise<MCPCallToolResult> {
        console.log(`[MockMCP] Calling tool: ${name} with args:`, args);

        switch (name) {
            case 'gmail_list_messages':
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify([
                            { id: 'msg_123', snippet: 'Urgent: Project Gemini Update' },
                            { id: 'msg_124', snippet: 'Weekly Sync' }
                        ])
                    }]
                };

            case 'gmail_create_draft':
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({ id: 'draft_789', status: 'created' })
                    }]
                };

            case 'drive_list_files':
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify([
                            { id: 'doc_1', name: 'Project Gemini Spec', webViewLink: 'https://docs.google.com/...' },
                            { id: 'doc_2', name: 'OOO Policy', webViewLink: 'https://docs.google.com/...' }
                        ])
                    }]
                };

            case 'slack_post_message':
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({ ok: true, ts: '1234567890.123456' })
                    }]
                };

            default:
                throw new Error(`Tool ${name} not found`);
        }
    }

    async listResources(): Promise<MCPResource[]> {
        return this.resources;
    }

    async readResource(uri: string): Promise<MCPReadResourceResult> {
        console.log(`[MockMCP] Reading resource: ${uri}`);

        if (uri === 'drive://docs/policy') {
            return {
                contents: [{
                    uri,
                    mimeType: 'text/markdown',
                    text: '# OOO Policy\n\nStandard response time is 24h. Emergencies call manager.'
                }]
            };
        }

        if (uri === 'drive://docs/project-gemini') {
            return {
                contents: [{
                    uri,
                    mimeType: 'text/markdown',
                    text: '# Project Gemini\n\nConfidential project. Contact Akshay for details.'
                }]
            };
        }

        throw new Error(`Resource ${uri} not found`);
    }
}
