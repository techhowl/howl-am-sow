// src/app/(dashboard)/layout.jsx
import Sidebar from '@/components/layout/Sidebar'
import TaskToast from '@/components/shared/TaskToast'

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
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