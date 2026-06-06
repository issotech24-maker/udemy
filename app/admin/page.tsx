import type { Metadata } from 'next'
import AdminDashboard from './AdminDashboard'

export const metadata: Metadata = {
  title: 'Admin – UdemyRadar',
  description: 'لوحة إدارة UdemyRadar CMS',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminDashboard />
}
