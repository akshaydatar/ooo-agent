import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../db';

export class GoogleApiClient {
    protected oauth2Client: OAuth2Client;
    protected userId: string;

    constructor(userId: string) {
        this.userId = userId;
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.NEXTAUTH_URL
        );
    }

    /**
     * Authenticates the client using the user's stored access tokens.
     */
    protected async authenticate(): Promise<void> {
        const account = await prisma.account.findFirst({
            where: {
                userId: this.userId,
                provider: 'google',
            },
        });

        if (!account || !account.access_token) {
            throw new Error(`Google Account not found or missing tokens for user ${this.userId}`);
        }

        this.oauth2Client.setCredentials({
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
        });

        // Add event listener to save updated tokens if they get refreshed
        this.oauth2Client.on('tokens', async (tokens) => {
            if (tokens.refresh_token) {
                await prisma.account.update({
                    where: { id: account.id },
                    data: {
                        access_token: tokens.access_token,
                        refresh_token: tokens.refresh_token,
                        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
                    },
                });
            } else if (tokens.access_token) {
                await prisma.account.update({
                    where: { id: account.id },
                    data: {
                        access_token: tokens.access_token,
                        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
                    },
                });
            }
        });
    }
}
