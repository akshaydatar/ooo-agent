import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnAPI = nextUrl.pathname.startsWith('/api/coverage') || nextUrl.pathname.startsWith('/api/stats');

            console.log(`[Middleware] Path: ${nextUrl.pathname}, LoggedIn: ${isLoggedIn}`);
            if (isOnDashboard || isOnAPI) {
                if (isLoggedIn) return true;
                console.log('[Middleware] Redirecting to login (Manual)');
                return Response.redirect(new URL('/login', nextUrl));
            } else if (isLoggedIn && nextUrl.pathname === '/login') {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
        session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub as string;
            }
            return session;
        }
    },
    providers: [], // Configured in auth.ts
    // Note: Hardcoded for MVP as process.env is flaky in Edge Runtime locally
    secret: 'jEJFiYWhuhfVQIzxH8ZWCqK2IGMALWSkEkRww0rv4Bk=',
} satisfies NextAuthConfig;
