import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard');

    if (isOnDashboard) {
        if (isLoggedIn) return;
        return NextResponse.redirect(new URL('/login', req.url));
    } else if (isLoggedIn && req.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }
});

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
