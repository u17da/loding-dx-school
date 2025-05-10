import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'build') {
    return NextResponse.next();
  }

  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });
    
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
    const isLoginPage = req.nextUrl.pathname === '/admin/login';

    if (isAdminRoute && !isLoginPage && !session) {
      const redirectUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    if (isLoginPage && session) {
      const redirectUrl = new URL('/admin', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
