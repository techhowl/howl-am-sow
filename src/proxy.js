// src/proxy.js

import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role

  // 'user' is the holding state for a freshly registered account that a
  // superadmin has not granted a role to yet — it must not reach any app data.
  const hasNoAccess = isLoggedIn && (!role || role === 'user')

  const isPendingPage = pathname.startsWith('/pending')
  const isLoginPage = pathname.startsWith('/login')
  const isApiAuth = pathname.startsWith('/api/auth')
  const isApi = pathname.startsWith('/api')
  const isLandingPage = pathname === '/'
  const isProtectedRoute = pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/brands') ||
                          pathname.startsWith('/timeline') ||
                          pathname.startsWith('/analytics') ||
                          pathname.startsWith('/users')

  // Allow API auth routes (sign in / sign out / session must always work)
  if (isApiAuth) {
    return NextResponse.next()
  }

  // Registered but not yet approved.
  if (hasNoAccess) {
    // Block every data API. Self-registration is open, so without this any
    // member of the public could sign up and read tasks, comments,
    // notifications and brand members straight from the API.
    if (isApi) {
      return NextResponse.json({ error: 'Access pending approval' }, { status: 403 })
    }
    // Let the pending screen render. Redirecting away from it here is what
    // previously bounced these accounts between /pending and /dashboard
    // forever, since the dashboard layout sends them straight back.
    if (isPendingPage) {
      return NextResponse.next()
    }
    if (isProtectedRoute || isLoginPage || isLandingPage) {
      return NextResponse.redirect(new URL('/pending', req.url))
    }
    return NextResponse.next()
  }

  // Approved and logged in — keep them out of the auth pages and landing page
  if (isLoggedIn && (isLoginPage || isPendingPage || isLandingPage)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Not logged in and trying to access protected routes → landing page
  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\..*).*)'],
}
