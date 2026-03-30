import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_PATHS = ['/', '/sign-in', '/sign-up', '/join', '/demo', '/privacy'];
const AUTH_COOKIE = 'site-auth';

function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1);
    }
    if (pathname === `/${locale}`) {
      return '/';
    }
  }
  return pathname;
}

function isPublicPath(logicalPath: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => logicalPath === p || logicalPath.startsWith(p + '/'),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const logicalPath = stripLocale(pathname);

  // Site-wide password gate (for pre-launch / demo protection)
  const sitePassword = process.env.SITE_PASSWORD ?? '';
  if (sitePassword) {
    const hasAuth = request.cookies.get(AUTH_COOKIE)?.value === 'granted';
    const submittedPassword = searchParams.get('p');

    if (submittedPassword) {
      if (submittedPassword === sitePassword) {
        const dest = new URL('/', request.url);
        const response = NextResponse.redirect(dest);
        response.cookies.set(AUTH_COOKIE, 'granted', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        });
        return response;
      }
      // Wrong password — show form with error
      return new NextResponse(passwordPage(true, sitePassword), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (!hasAuth) {
      return new NextResponse(passwordPage(false, sitePassword), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  }

  // Public paths: skip Supabase session (works without DB)
  if (isPublicPath(logicalPath)) {
    return intlMiddleware(request);
  }

  // Protected paths: Supabase session required
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    // No Supabase configured — redirect to demo (demo-only deployment)
    return NextResponse.redirect(new URL('/demo', request.url));
  }

  const { user, supabaseResponse } = await updateSession(request);

  if (!user) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  const role = user.user_metadata?.role as string | undefined;

  if (logicalPath.startsWith('/dashboard') && role !== 'teacher') {
    return NextResponse.redirect(new URL('/explore', request.url));
  }

  if (logicalPath.startsWith('/parent') && role !== 'parent') {
    return NextResponse.redirect(new URL('/explore', request.url));
  }

  if (logicalPath === '/sign-in' || logicalPath === '/sign-up') {
    const defaultRoute =
      role === 'teacher'
        ? '/dashboard'
        : role === 'parent'
          ? '/parent'
          : '/explore';
    return NextResponse.redirect(new URL(defaultRoute, request.url));
  }

  const intlResponse = intlMiddleware(request);
  for (const cookie of supabaseResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie.name, cookie.value);
  }
  return intlResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest).*)',
  ],
};

function passwordPage(showError: boolean, sitePassword: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Eternal Tree</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#09090b;color:#fafafa;font-family:system-ui,-apple-system,sans-serif}
.c{display:flex;flex-direction:column;gap:14px;width:300px;text-align:center}
h1{font-size:24px;font-weight:700;margin:0;letter-spacing:-0.5px}
p{font-size:13px;color:#71717a;margin:0}
.e{color:#ef4444;font-size:12px}
input{padding:14px;border-radius:10px;border:1px solid #27272a;background:#18181b;color:#fafafa;font-size:15px;text-align:center;outline:none;transition:border-color 0.2s}
input:focus{border-color:#2D5BFF}
button{padding:14px;border-radius:10px;border:none;background:#2D5BFF;color:#fff;font-size:15px;font-weight:600;cursor:pointer;transition:background 0.2s}
button:hover{background:#2448CC}
</style>
</head><body>
<div class="c">
<h1>The Eternal <a href="/?p=${sitePassword}" style="color:inherit;text-decoration:none"><span style="display:inline-block;width:3px;height:3px;border-radius:50%;background:rgba(5,150,105,0.2);vertical-align:super;margin:0 -1px"></span></a>Tree</h1>
<p>Enter password to continue</p>
${showError ? '<p class="e">Incorrect password</p>' : ''}
<form method="GET" autocomplete="off">
<input type="text" name="p" placeholder="Password" autofocus required
  autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
  style="-webkit-text-security:disc">
<button type="submit">Enter</button>
</form>
<p style="margin-top:24px"><span style="color:#3f3f46;font-size:11px" title="hi [at] ogio.dev">curious how this was made?</span></p>
</div>
</body></html>`;
}
