'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Download, Filter } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  login: 'bg-purple-100 text-purple-800',
  logout: 'bg-gray-100 text-gray-800',
  export: 'bg-yellow-100 text-yellow-800',
  import: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
}

export default function AuditTrailPage() {
  const { t } = useI18n()
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

  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (userData?.tenant_id) setTenantId(userData.tenant_id)
    }
    init()
  }, [])

  useEffect(() => { if (tenantId) fetchLogs() }, [filters, tenantId])

  async function fetchLogs() {
    if (!tenantId) return
    setLoading(true)

    let query = supabase
      .from('audit_logs')
      .select('*, user:users(full_name, email)', { count: 'exact' })
      .eq('tenant_id', tenantId)
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
    if (!tenantId) return
    const { data } = await supabase
      .from('audit_logs')
      .select('*, user:users(full_name, email)')
      .eq('tenant_id', tenantId)
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
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('audit.title')}</h1>
        </div>
        <Button variant="outline" onClick={exportLogs}>
          <Download className="size-4 mr-2" />
          {t('audit.export')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('audit.total_events')}</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('audit.today')}</p>
            <p className="text-2xl font-bold">{stats.today}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('audit.this_week')}</p>
            <p className="text-2xl font-bold">{stats.thisWeek}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('audit.action')}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(stats.byAction).slice(0, 3).map(([action, count]) => (
                <Badge key={action} className={ACTION_COLORS[action]}>
                  {action}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('audit.search')}</label>
              <Input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder={t('audit.search_logs')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('audit.action')}</label>
              <Select value={filters.action} onValueChange={(v) => setFilters({ ...filters, action: v === 'all' ? '' : (v ?? '') })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('audit.table')}</label>
              <Select value={filters.table} onValueChange={(v) => setFilters({ ...filters, table: v === 'all' ? '' : (v ?? '') })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="vehicles">Vehicles</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="rentals">Rentals</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('audit.start_date')}</label>
              <Input
                type="date"
                value={filters.start}
                onChange={(e) => setFilters({ ...filters, start: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('audit.end_date')}</label>
              <Input
                type="date"
                value={filters.end}
                onChange={(e) => setFilters({ ...filters, end: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters({ action: '', table: '', user: '', start: '', end: '', search: '' })}
              >
                {t('audit.clear')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">{t('audit.empty')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge className={ACTION_COLORS[log.action]}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.table_name}</TableCell>
                    <TableCell>{log.user?.full_name || 'System'}</TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                      {formatJson(log.new_data)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  )
}
