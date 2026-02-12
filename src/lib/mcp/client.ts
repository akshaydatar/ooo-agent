export interface MCPTool {
    name: string;
    description: string;
    parameters: Record<string, any>;
}

export interface MCPResource {
    uri: string;
    name: string;
    mimeType?: string;
}

export interface MCPCallToolResult {
    content: Array<{
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: string;
        mimeType?: string;
        resource?: MCPResource;
    }>;
    isError?: boolean;
}

export interface MCPReadResourceResult {
    contents: Array<{
        uri: string;
        mimeType?: string;
        text?: string;
        blob?: string;
    }>;
}

export interface MCPClient {
    listTools(): Promise<MCPTool[]>;
    callTool(name: string, args: Record<string, any>): Promise<MCPCallToolResult>;
    listResources(): Promise<MCPResource[]>;
    readResource(uri: string): Promise<MCPReadResourceResult>;
}
