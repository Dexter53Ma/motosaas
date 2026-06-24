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

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '',
    table: '',
    user: '',
    start: '',
    end: '',
    search: '',
  })
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    byAction: {} as Record<string, number>,
  })
  const supabase = createClient()

  useEffect(() => { fetchLogs() }, [filters])

  async function fetchLogs() {
    setLoading(true)

    let query = supabase
      .from('audit_logs')
      .select('*, user:users(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(100)

    if (filters.action) query = query.eq('action', filters.action)
    if (filters.table) query = query.eq('table_name', filters.table)
    if (filters.start) query = query.gte('created_at', filters.start)
    if (filters.end) query = query.lte('created_at', filters.end + 'T23:59:59')

    const { data, count } = await query

    if (data) {
      setLogs(data)
      const byAction: Record<string, number> = {}
      data.forEach(log => {
        byAction[log.action] = (byAction[log.action] || 0) + 1
      })
      setStats({
        total: count || 0,
        today: data.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length,
        thisWeek: data.filter(l => {
          const d = new Date(l.created_at)
          const now = new Date()
          return d >= new Date(now.setDate(now.getDate() - 7))
        }).length,
        byAction,
      })
    }

    setLoading(false)
  }

  async function exportLogs() {
    const { data } = await supabase
      .from('audit_logs')
      .select('*, user:users(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (!data || data.length === 0) return

    const headers = ['Timestamp', 'User', 'Action', 'Table', 'Record ID', 'Details']
    const rows = data.map(log => [
      new Date(log.created_at).toISOString(),
      log.user?.full_name || 'System',
      log.action,
      log.table_name,
      log.record_id || '',
      JSON.stringify(log.new_data || {}),
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit_trail_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  function formatJson(data: any) {
    if (!data) return '-'
    return Object.entries(data).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
              <h1 className="text-lg font-medium">Audit Trail</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={exportLogs}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Events</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Today</p>
            <p className="text-2xl font-bold">{stats.today}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">This Week</p>
            <p className="text-2xl font-bold">{stats.thisWeek}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Actions</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(stats.byAction).slice(0, 3).map(([action, count]) => (
                <span key={action} className={`px-2 py-0.5 text-xs rounded ${ACTION_COLORS[action]}`}>
                  {action}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search logs..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="login">Login</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
              <select
                value={filters.table}
                onChange={(e) => setFilters({ ...filters, table: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All</option>
                <option value="vehicles">Vehicles</option>
                <option value="customers">Customers</option>
                <option value="rentals">Rentals</option>
                <option value="payments">Payments</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.start}
                onChange={(e) => setFilters({ ...filters, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.end}
                onChange={(e) => setFilters({ ...filters, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ action: '', table: '', user: '', start: '', end: '', search: '' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No audit logs found</div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <span className={`px-2 py-1 text-xs rounded-full ${ACTION_COLORS[log.action]}`}>
                        {log.action}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{log.table_name}</p>
                        {log.record_id && (
                          <span className="text-xs text-gray-500 font-mono">
                            {log.record_id.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {log.user?.full_name || 'System'} • {formatJson(log.new_data)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}