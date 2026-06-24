'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  login: 'bg-purple-100 text-purple-800',
  logout: 'bg-gray-100 text-gray-800',
  export: 'bg-yellow-100 text-yellow-800',
  import: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '',
    table: '',
    user: '',
    start: '',
    end: '',
  })
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const supabase = createClient()
  const PAGE_SIZE = 50

  useEffect(() => { fetchLogs() }, [filters, page])

  async function fetchLogs() {
    setLoading(true)

    let query = supabase
      .from('audit_logs')
      .select('*, user:users(full_name, email)')
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (filters.action) query = query.eq('action', filters.action)
    if (filters.table) query = query.eq('table_name', filters.table)
    if (filters.start) query = query.gte('created_at', filters.start)
    if (filters.end) query = query.lte('created_at', filters.end + 'T23:59:59')

    const { data } = await query

    if (data) {
      setLogs(data)
      setHasMore(data.length === PAGE_SIZE)
    }

    setLoading(false)
  }

  function formatData(data: any) {
    if (!data) return '-'
    const entries = Object.entries(data)
    if (entries.length === 0) return '-'
    return entries.slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ') + (entries.length > 3 ? '...' : '')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
              <h1 className="text-lg font-medium">Audit Logs</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1) }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="export">Export</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
              <select
                value={filters.table}
                onChange={(e) => { setFilters({ ...filters, table: e.target.value }); setPage(1) }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Tables</option>
                <option value="vehicles">Vehicles</option>
                <option value="customers">Customers</option>
                <option value="rentals">Rentals</option>
                <option value="payments">Payments</option>
                <option value="invoices">Invoices</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.start}
                onChange={(e) => { setFilters({ ...filters, start: e.target.value }); setPage(1) }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.end}
                onChange={(e) => { setFilters({ ...filters, end: e.target.value }); setPage(1) }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setFilters({ action: '', table: '', user: '', start: '', end: '' }); setPage(1) }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Record</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Changes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No audit logs found</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>{log.user?.full_name || 'System'}</div>
                        <div className="text-gray-500 text-xs">{log.user?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${ACTION_COLORS[log.action] || ACTION_COLORS.other}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{log.table_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {log.record_id ? log.record_id.substring(0, 8) + '...' : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {log.new_data ? formatData(log.new_data) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Page {page}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}