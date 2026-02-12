export interface ContextItem {
    id: string;
    type: 'email' | 'document' | 'calendar_event';
    content: string;
    metadata: Record<string, any>;
    createdAt: Date;
}

export interface ContextQuery {
    query: string;
    type?: 'email' | 'document';
    limit?: number;
}

export interface ContextServiceConfig {
    // Placeholder for future config
    vectorStorePath?: string;
}
