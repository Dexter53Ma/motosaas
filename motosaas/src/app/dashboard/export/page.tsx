'use client'

import { useState } from 'react'
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
import { Download, FileText, AlertCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function ExportPage() {
  const { t } = useI18n()
  const EXPORT_TYPES = [
    { id: 'customers', label: t('import.customers_tab'), description: t('export.tenant_filter') },
    { id: 'vehicles', label: t('import.vehicles_tab'), description: t('export.tenant_filter') },
    { id: 'rentals', label: t('reports.tab_rentals'), description: t('export.tenant_filter') },
    { id: 'payments', label: t('import.payments_tab'), description: t('export.tenant_filter') },
    { id: 'invoices', label: t('documents.invoice'), description: t('export.tenant_filter') },
    { id: 'damage_reports', label: t('refunds.reason'), description: t('export.tenant_filter') },
  ]

  const [selectedExport, setSelectedExport] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [format, setFormat] = useState('csv')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleExport() {
    if (!selectedExport) {
      setError('Please select an export type')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData?.tenant_id) throw new Error('No tenant found')

      let query = supabase.from(selectedExport).select('*').eq('tenant_id', userData.tenant_id)

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start)
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end + 'T23:59:59')
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      if (!data || data.length === 0) {
        throw new Error('No data found for the selected filters')
      }

      if (format === 'csv') {
        downloadCSV(data, selectedExport)
      } else if (format === 'json') {
        downloadJSON(data, selectedExport)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function downloadCSV(data: any[], filename: string) {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const value = row[h]
          if (value === null || value === undefined) return ''
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  function downloadJSON(data: any[], filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('export.title')}</h1>
        <p className="text-gray-600">{t('export.select_data')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('export.select_data')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {EXPORT_TYPES.map((type) => (
                  <label
                    key={type.id}
                    className={`block p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedExport === type.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="exportType"
                        value={type.id}
                        checked={selectedExport === type.id}
                        onChange={(e) => setSelectedExport(e.target.value)}
                        className="h-4 w-4 text-emerald-500"
                      />
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm text-gray-500">{type.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('export.settings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('export.format')}</label>
                  <Select value={format} onValueChange={(v) => v && setFormat(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">{t('export.csv')}</SelectItem>
                      <SelectItem value="json">{t('export.json')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('export.date_range')}</label>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      placeholder="Start date"
                    />
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      placeholder="End date"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="size-4" />
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleExport}
                  disabled={loading || !selectedExport}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <Download className="size-4 mr-2" />
                  {loading ? t('export.exporting') : t('export.export_data')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm mb-2">{t('export.notes')}</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2"><FileText className="size-3 text-emerald-500" /> {t('export.tenant_filter')}</li>
                <li className="flex items-center gap-2"><FileText className="size-3 text-emerald-500" /> {t('export.large_export')}</li>
                <li className="flex items-center gap-2"><FileText className="size-3 text-emerald-500" /> {t('export.csv_note')}</li>
                <li className="flex items-center gap-2"><FileText className="size-3 text-emerald-500" /> {t('export.json_note')}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
