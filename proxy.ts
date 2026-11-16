import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  // /api/media serves the uploaded images (the same ones the website shows),
  // so the admin's own logo and upload previews can load them here.
  if (pathname === '/' || pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname.startsWith('/api/media/') || pathname.startsWith('/uploads')) {
    return NextResponse.next()
  }
  // The Claude connector: the MCP server, its REST API and the OAuth sign-in
  // around them. Each checks its own access token or sign-in.
  if (pathname === '/mcp' || pathname.startsWith('/api/claude/') || pathname.startsWith('/oauth/') || pathname.startsWith('/api/oauth/') || pathname.startsWith('/.well-known/')) {
    return NextResponse.next()
  }
  return NextResponse.redirect(new URL('/admin', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
