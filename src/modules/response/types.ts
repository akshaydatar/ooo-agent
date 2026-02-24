export interface EmailDraft {
    id: string;
    sender: string;
    subject: string;
    content: string;
    receivedAt: Date;
}

export interface DraftResponse {
    id: string;
    subject: string;
    body: string;
    recipient: string;
    cc?: string[];
    status: 'draft' | 'sent';
    metadata: {
        confidence: number;
        usedContextIds?: string[];
        reason?: string;
    }
}

export interface ResponseGenerationParams {
    userId: string;
    id: string;
    sender: string;
    subject: string;
    content: string;
    receivedAt: Date;
}

export interface ResponseTemplate {
    id: string;
    name: string;
    template: string;
}
