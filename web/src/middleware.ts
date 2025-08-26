// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { fallbackLng, languages } from './i18n/settings';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);

  // 检查路径是否已经包含语言标识
  const pathnameIsMissingLocale = languages.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // 如果路径缺少语言标识，则重定向到默认语言
  if (pathnameIsMissingLocale) {
    // e.g. incoming request is /products
    // The new URL is now /en-US/products

    requestHeaders.set('x-next-pathname', "");
    return NextResponse.rewrite(
      new URL(`/${fallbackLng}${pathname}`, request.url),
      {
        request: {
          headers: requestHeaders,
        },
      }
    );
  }

  requestHeaders.set('x-next-pathname', pathname.split('/')[1]);
  return NextResponse.next(
    {
      request: {
        headers: requestHeaders,
      },
    }
  );
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|favicon.webp|robots.txt|sitemap.xml).*)'],
};