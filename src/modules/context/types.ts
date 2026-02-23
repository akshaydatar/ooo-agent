export interface ContextItem {
    id: string;
    userId?: string;
    type: 'email' | 'document' | 'calendar_event';
    content: string;
    metadata: Record<string, any>;
    createdAt: Date;
}

export interface ContextQuery {
    userId: string;
    query: string;
    type?: 'email' | 'document';
    limit?: number;
}

export interface ContextServiceConfig {
    // Placeholder for future config
    vectorStorePath?: string;
}
