import { NextResponse } from 'next/server'

export function middleware(req) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/access-denied', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin-dashboard'],
}
