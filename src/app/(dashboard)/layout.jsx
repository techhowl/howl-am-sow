// src/app/(dashboard)/layout.jsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { hasNoAccess } from '@/lib/auth/permissions'
import Sidebar from '@/components/layout/Sidebar'
import TaskToast from '@/components/shared/TaskToast'

export default async function DashboardLayout({ children }) {
  const session = await auth()

  // Not signed in → login
  if (!session) redirect('/login')

  // Signed in but no access yet ('user' role) → pending screen
  if (hasNoAccess(session.user.role)) redirect('/pending')

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