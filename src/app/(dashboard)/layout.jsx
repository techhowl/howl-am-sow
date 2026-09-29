// src/app/(dashboard)/layout.jsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { hasNoAccess } from '@/lib/auth/permissions'
import Sidebar from '@/components/layout/Sidebar'
import TaskToast from '@/components/shared/TaskToast'

export default async function DashboardLayout({ children }) {
  const session = await auth()

  // Check for a real user, not just a truthy session. On an auth error next-auth
  // returns an error object with no `user`, and reading `session.user.role` off
  // that threw a TypeError and took the whole dashboard down.
  const user = session?.user

  // Not signed in → login
  if (!user?.id) redirect('/login')

  // Signed in but no access yet ('user' role) → pending screen
  if (hasNoAccess(user.role)) redirect('/pending')

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Main content — offset exactly 220px to match sidebar width */}
      <main style={{ marginLeft: '220px', minHeight: '100vh' }}>
        {children}
      </main>
      {/* Toast notifications for employees */}
      <TaskToast />
    </div>
  )
}