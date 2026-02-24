import { google, drive_v3 } from 'googleapis';
import { GoogleApiClient } from './client';
import { ContextItem } from '@/modules/context/types';

export class DriveClient extends GoogleApiClient {
    private drive: drive_v3.Drive;

    constructor(userId: string) {
        super(userId);
        this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    }

    /**
     * Fetch recent documents owned or explicitly shared with the user for indexing.
     */
    async fetchRecentDocuments(maxResults: number = 20): Promise<ContextItem[]> {
        await this.authenticate();

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const dateStr = sixMonthsAgo.toISOString();

        const response = await this.drive.files.list({
            q: `(mimeType='application/vnd.google-apps.document' or mimeType='text/plain') and modifiedTime > '${dateStr}'`, // Only text-based docs within 6 months
            orderBy: 'modifiedTime desc',
            pageSize: maxResults,
            fields: 'files(id, name, webViewLink, owners, lastModifyingUser)',
        });

        const files = response.data.files || [];
        const contextItems: ContextItem[] = [];

        for (const file of files) {
            if (!file.id) continue;

            try {
                // Export Google Docs to plain text
                const textExport = await this.drive.files.export({
                    fileId: file.id,
                    mimeType: 'text/plain'
                });

                const content = typeof textExport.data === 'string'
                    ? textExport.data
                    : JSON.stringify(textExport.data);

                contextItems.push({
                    id: file.id,
                    type: 'document',
                    content: `Document Title: ${file.name}\n\n${content}`,
                    metadata: {
                        title: file.name,
                        url: file.webViewLink,
                        owner: file.owners?.[0]?.displayName || 'Unknown',
                        lastModifier: file.lastModifyingUser?.displayName || 'Unknown'
                    },
                    createdAt: new Date()
                });
            } catch (err) {
                console.warn(`[DriveClient] Failed to export doc ${file.id}:`, err);
                continue;
            }
        }

        return contextItems;
    }

    /**
     * Search documents using standard drive search capabilities.
     * Useful for realtime lookup vs vector DB fallback.
     */
    async searchDriveFiles(query: string, maxResults: number = 5): Promise<any[]> {
        await this.authenticate();

        const response = await this.drive.files.list({
            q: `name contains '${query}' and (mimeType='application/vnd.google-apps.document' or mimeType='application/pdf')`,
            orderBy: 'modifiedTime desc',
            pageSize: maxResults,
            fields: 'files(id, name, webViewLink)',
        });

        return response.data.files || [];
    }
}
