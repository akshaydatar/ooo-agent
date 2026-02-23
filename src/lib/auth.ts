import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import GoogleProvider from 'next-auth/providers/google';

const prisma = new PrismaClient();

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: 'jwt' },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    // Request scopes needed for the integrations later
                    scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar.readonly"
                }
            }
        }),
    ],
    callbacks: {
        async signIn({ account, profile }) {
            // Enterprise Domain Verification
            if (account?.provider === "google") {
                const allowedDomain = process.env.ALLOWED_DOMAIN;
                if (allowedDomain && !profile?.email?.endsWith(`@${allowedDomain}`)) {
                    console.error(`Unauthorized login attempt from: ${profile?.email}`);
                    return false; // Deny access
                }
                return true;
            }
            return true;
        },
        ...authConfig.callbacks,
    },
});
