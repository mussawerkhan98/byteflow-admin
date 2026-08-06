import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/' || pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname.startsWith('/uploads')) {
    return NextResponse.next()
  }
  return NextResponse.redirect(new URL('/admin', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
