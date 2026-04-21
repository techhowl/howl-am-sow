import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '250px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}