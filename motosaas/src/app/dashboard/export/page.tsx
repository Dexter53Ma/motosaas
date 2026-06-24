'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const EXPORT_TYPES = [
  { id: 'customers', label: 'Customers', description: 'All customer data including contact info and rental history' },
  { id: 'vehicles', label: 'Vehicles', description: 'Vehicle inventory with maintenance and rental stats' },
  { id: 'rentals', label: 'Rentals', description: 'Rental history with payments and status' },
  { id: 'payments', label: 'Payments', description: 'All payment transactions with methods and amounts' },
  { id: 'invoices', label: 'Invoices', description: 'Invoice history with line items and totals' },
  { id: 'damage_reports', label: 'Damage Reports', description: 'Vehicle damage history with costs' },
]

export default function ExportPage() {
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
      let query = supabase.from(selectedExport).select('*')

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
              <h1 className="text-lg font-medium">Data Export</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Options */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Select Data to Export</h2>
              <div className="space-y-3">
                {EXPORT_TYPES.map((type) => (
                  <label
                    key={type.id}
                    className={`block p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedExport === type.id
                        ? 'border-blue-500 bg-blue-50'
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
                        className="h-4 w-4 text-blue-600"
                      />
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm text-gray-500">{type.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Export Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="csv">CSV (Excel compatible)</option>
                    <option value="json">JSON (for developers)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range (Optional)</label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Start date"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="End date"
                    />
                  </div>
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button
                  onClick={handleExport}
                  disabled={loading || !selectedExport}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Exporting...' : 'Export Data'}
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h3 className="font-medium text-sm mb-2">Export Notes</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Data is filtered by your tenant</li>
                <li>• Large exports may take a moment</li>
                <li>• CSV files can be opened in Excel</li>
                <li>• JSON files are useful for integrations</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}