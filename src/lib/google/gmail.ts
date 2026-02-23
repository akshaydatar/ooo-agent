import { google, gmail_v1 } from 'googleapis';
import { GoogleApiClient } from './client';
import { ContextItem } from '@/modules/context/types';

export class GmailClient extends GoogleApiClient {
    private gmail: gmail_v1.Gmail;

    constructor(userId: string) {
        super(userId);
        this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    }

    /**
     * Fetch recent thread history for context indexing.
     */
    async fetchRecentThreads(maxResults: number = 50): Promise<ContextItem[]> {
        await this.authenticate();

        const response = await this.gmail.users.threads.list({
            userId: 'me',
            maxResults,
            q: 'in:inbox OR in:sent', // Fetch recent conversations
        });

        const threads = response.data.threads || [];
        const contextItems: ContextItem[] = [];

        for (const thread of threads) {
            if (!thread.id) continue;

            const threadData = await this.gmail.users.threads.get({
                userId: 'me',
                id: thread.id,
            });

            // Very basic body extraction for MVP context
            let content = '';
            let subject = 'No Subject';
            let participants = new Set<string>();

            threadData.data.messages?.forEach(msg => {
                const headers = msg.payload?.headers;
                headers?.forEach(h => {
                    if (h.name === 'Subject') subject = h.value || subject;
                    if (h.name === 'From') participants.add(h.value || 'unknown');
                    if (h.name === 'To') participants.add(h.value || 'unknown');
                });

                // Decode body if snippet or plaintext exists
                if (msg.snippet) {
                    content += msg.snippet + '\n';
                }
            });

            contextItems.push({
                id: thread.id,
                type: 'email',
                content: `Subject: ${subject}\n\n${content}`,
                metadata: {
                    subject,
                    participants: Array.from(participants)
                },
                createdAt: new Date()
            });
        }

        return contextItems;
    }

    /**
     * Send an email response.
     */
    async sendResponse(to: string, subject: string, bodyText: string, threadId?: string): Promise<void> {
        await this.authenticate();

        const rawMessage = [
            `To: ${to}`,
            'Content-Type: text/plain; charset="UTF-8"',
            'MIME-Version: 1.0',
            `Subject: Re: ${subject}`,
            '',
            bodyText
        ].join('\n');

        const encodedMessage = Buffer.from(rawMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        await this.gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
                threadId: threadId
            }
        });
    }
}
