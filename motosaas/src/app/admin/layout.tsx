'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!data) {
      router.push('/dashboard')
      return
    }

    setIsAdmin(true)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-red-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="text-xl font-bold text-white">
                MotoRent Admin
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link href="/admin" className="text-red-100 hover:text-white px-3 py-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/admin/tenants" className="text-red-100 hover:text-white px-3 py-2 text-sm font-medium">
                  Tenants
                </Link>
                <Link href="/admin/subscriptions" className="text-red-100 hover:text-white px-3 py-2 text-sm font-medium">
                  Subscriptions
                </Link>
                <Link href="/admin/support" className="text-red-100 hover:text-white px-3 py-2 text-sm font-medium">
                  Support
                </Link>
                <Link href="/admin/logs" className="text-red-100 hover:text-white px-3 py-2 text-sm font-medium">
                  Logs
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/dashboard" className="text-red-100 hover:text-white text-sm font-medium">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}