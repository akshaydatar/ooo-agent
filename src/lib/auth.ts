import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    // MOCK USER for MVP
                    if (email === 'demo@example.com' && password === 'password') {
                        return {
                            id: 'user-123',
                            name: 'Demo User',
                            email: 'demo@example.com',
                        };
                    }
                }
                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
});
