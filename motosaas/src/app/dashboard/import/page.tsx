'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const IMPORT_TYPES = [
  { id: 'customers', label: 'Customers', description: 'Import customer data from CSV' },
  { id: 'vehicles', label: 'Vehicles', description: 'Import vehicle inventory from CSV' },
  { id: 'payments', label: 'Payments', description: 'Import payment history from CSV' },
]

export default function ImportPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').slice(0, 6)
      const headers = lines[0].split(',').map(h => h.trim())
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] || '' }), {})
      })
      setPreview(rows)
    }
    reader.readAsText(selectedFile)
  }

  async function handleImport() {
    if (!file || !selectedType) return

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) throw new Error('No tenant found')

      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const dataLines = lines.slice(1)

      let success = 0
      const errors: string[] = []

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const values = dataLines[i].split(',').map(v => v.trim())
          const row: Record<string, string> = headers.reduce((obj: Record<string, string>, h, j) => ({ ...obj, [h]: values[j] || '' }), {})

          let insertData: any = { tenant_id: userData.tenant_id }

          if (selectedType === 'customers') {
            insertData = {
              ...insertData,
              full_name: row.name || row.full_name || '',
              phone: row.phone || '',
              email: row.email || '',
              address: row.address || '',
            }
            const { error } = await supabase.from('customers').insert(insertData)
            if (error) throw error
          } else if (selectedType === 'vehicles') {
            insertData = {
              ...insertData,
              make: row.make || '',
              model: row.model || '',
              year: parseInt(row.year) || new Date().getFullYear(),
              license_plate: row.license_plate || row.plate || '',
              daily_rate: parseFloat(row.daily_rate || row.rate) || 0,
              status: 'available',
            }
            const { error } = await supabase.from('vehicles').insert(insertData)
            if (error) throw error
          } else if (selectedType === 'payments') {
            insertData = {
              ...insertData,
              customer_id: row.customer_id,
              amount: parseFloat(row.amount) || 0,
              payment_method: row.payment_method || row.method || 'cash',
              reference: row.reference || row.ref || '',
            }
            const { error } = await supabase.from('payments').insert(insertData)
            if (error) throw error
          }

          success++
        } catch (err: any) {
          errors.push(`Row ${i + 2}: ${err.message}`)
        }
      }

      setResult({ success, errors })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
              <h1 className="text-lg font-medium">Import Data</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {IMPORT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => { setSelectedType(type.id); setResult(null); setFile(null); setPreview([]) }}
              className={`p-4 rounded-lg border text-left ${
                selectedType === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-medium">{type.label}</h3>
              <p className="text-sm text-gray-500">{type.description}</p>
            </button>
          ))}
        </div>

        {selectedType && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">
              Import {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
            </h2>

            {/* File Upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 mb-6"
            >
              {file ? (
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600">Click to upload CSV file</p>
                  <p className="text-sm text-gray-500 mt-1">Make sure columns match the expected format</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Preview */}
            {preview.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Preview (first 5 rows)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(preview[0]).map((key) => (
                          <th key={key} className="px-3 py-2 text-left font-medium text-gray-700">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-3 py-2 text-gray-600">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            {/* Result */}
            {result && (
              <div className={`p-4 rounded-lg mb-4 ${result.errors.length === 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <p className="font-medium">
                  {result.success} rows imported successfully
                </p>
                {result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-red-600">{result.errors.length} errors:</p>
                    <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={loading || !file}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Start Import'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}