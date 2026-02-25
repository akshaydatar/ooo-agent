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

        const sixMonthsAgo = Math.floor(Date.now() / 1000) - (6 * 30 * 24 * 60 * 60);
        const response = await this.gmail.users.threads.list({
            userId: 'me',
            maxResults,
            q: `(in:inbox OR in:sent) after:${sixMonthsAgo}`, // Fetch recent conversations
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
            const participants = new Set<string>();

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

    /**
     * Create a draft email response.
     */
    async createDraft(to: string, subject: string, bodyText: string, threadId?: string): Promise<any> {
        await this.authenticate();

        const rawMessage = [
            `To: ${to}`,
            'Content-Type: text/plain; charset="UTF-8"',
            'MIME-Version: 1.0',
            `Subject: ${subject.startsWith('Re:') || subject.startsWith('RE:') ? subject : `Re: ${subject}`}`,
            '',
            bodyText
        ].join('\n');

        const encodedMessage = Buffer.from(rawMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const res = await this.gmail.users.drafts.create({
            userId: 'me',
            requestBody: {
                message: {
                    raw: encodedMessage,
                    threadId: threadId
                }
            }
        });

        console.log(`[GmailClient] Draft created successfully: ${res.data.id}`);
        return res.data;
    }

    /**
     * Toggles the native Gmail Vacation Responder (Auto-reply).
     */
    async setVacationResponder(enable: boolean, restrictToContacts: boolean = false, restrictToDomain: boolean = false): Promise<void> {
        await this.authenticate();

        await this.gmail.users.settings.updateVacation({
            userId: 'me',
            requestBody: {
                enableAutoReply: enable,
                responseSubject: '', // Let our agent handle the actual response, so we clear native subject/body if disabling
                responseBodyPlainText: '',
                restrictToContacts,
                restrictToDomain
            }
        });
        console.log(`[GmailClient] Native Vacation Responder enabled: ${enable}`);
    }

    /**
     * Fetch unread emails that haven't been processed yet.
     */
    async getUnreadEmails(maxResults: number = 10): Promise<any[]> {
        await this.authenticate();

        const response = await this.gmail.users.messages.list({
            userId: 'me',
            maxResults,
            q: 'is:unread label:inbox'
        });

        const messages = response.data.messages || [];
        const detailedMessages = [];

        for (const msg of messages) {
            if (!msg.id) continue;

            const msgData = await this.gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'full' // Get headers and body
            });

            let subject = 'No Subject';
            let from = 'unknown';

            msgData.data.payload?.headers?.forEach(h => {
                if (h.name === 'Subject') subject = h.value || subject;
                if (h.name === 'From') from = h.value || from;
            });

            const content = msgData.data.snippet || '';

            detailedMessages.push({
                id: msg.id,
                threadId: msg.threadId,
                sender: from,
                subject: subject,
                content: content,
                receivedAt: new Date(Number(msgData.data.internalDate))
            });
        }

        return detailedMessages;
    }

    /**
     * Marks an email as read so it isn't processed twice.
     */
    async markAsRead(messageId: string): Promise<void> {
        await this.authenticate();
        await this.gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            requestBody: {
                removeLabelIds: ['UNREAD']
            }
        });
    }
}
