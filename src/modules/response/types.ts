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
        usedContextIds: string[];
    }
}

export interface ResponseGenerationParams {
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
