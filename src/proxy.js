// src/proxy.js

import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/pending')
  const isApiAuth = pathname.startsWith('/api/auth')
  const isLandingPage = pathname === '/'
  const isProtectedRoute = pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/brands') ||
                          pathname.startsWith('/timeline') ||
                          pathname.startsWith('/analytics') ||
                          pathname.startsWith('/users')

  // Allow API auth routes
  if (isApiAuth) {
    return NextResponse.next()
  }

  // If logged in and trying to access auth pages or landing, redirect to dashboard
  if (isLoggedIn && (isAuthPage || isLandingPage)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // If not logged in and trying to access protected routes, redirect to landing
  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Allow access to landing page for non-logged in users
  if (!isLoggedIn && isLandingPage) {
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}