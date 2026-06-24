'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface AdminStats {
  total_tenants: number
  active_tenants: number
  trial_tenants: number
  total_users: number
  total_vehicles: number
  total_rentals: number
  total_revenue: number
  open_tickets: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentTenants, setRecentTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)

    const { data: statsData } = await supabase.rpc('get_admin_stats')
    if (statsData?.[0]) setStats(statsData[0])

    const { data: tenants } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (tenants) setRecentTenants(tenants)
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Tenants</p>
            <p className="text-2xl font-bold">{stats.total_tenants}</p>
            <p className="text-sm text-green-600">{stats.active_tenants} active</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Trial Tenants</p>
            <p className="text-2xl font-bold text-blue-600">{stats.trial_tenants}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold">{stats.total_revenue?.toLocaleString() || 0} MAD</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Open Tickets</p>
            <p className="text-2xl font-bold text-orange-600">{stats.open_tickets}</p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold">{stats.total_users}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Vehicles</p>
            <p className="text-2xl font-bold">{stats.total_vehicles}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Rentals</p>
            <p className="text-2xl font-bold">{stats.total_rentals}</p>
          </div>
        </div>
      )}

      {/* Recent Tenants */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Recent Tenants</h2>
          <Link href="/admin/tenants" className="text-blue-600 hover:text-blue-800 text-sm">
            View All
          </Link>
        </div>
        {recentTenants.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No tenants found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{tenant.name}</td>
                    <td className="py-2 text-gray-600">{tenant.email}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        tenant.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                        tenant.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tenant.subscription_status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-600">
                      {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/tenants"
            className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition"
          >
            <span className="text-2xl mb-2">👥</span>
            <span className="text-sm font-medium text-gray-700">Manage Tenants</span>
          </Link>
          <Link
            href="/admin/subscriptions"
            className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
          >
            <span className="text-2xl mb-2">💳</span>
            <span className="text-sm font-medium text-gray-700">Subscriptions</span>
          </Link>
          <Link
            href="/admin/support"
            className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <span className="text-2xl mb-2">🎫</span>
            <span className="text-sm font-medium text-gray-700">Support Tickets</span>
          </Link>
          <Link
            href="/admin/logs"
            className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition"
          >
            <span className="text-2xl mb-2">📋</span>
            <span className="text-sm font-medium text-gray-700">System Logs</span>
          </Link>
        </div>
      </div>
    </div>
  )
}