'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function ImportPage() {
  const { t } = useI18n()
  const IMPORT_TYPES = [
    { id: 'customers', label: t('import.customers_tab'), description: t('import.desc') },
    { id: 'vehicles', label: t('import.vehicles_tab'), description: t('import.desc') },
    { id: 'payments', label: t('import.payments_tab'), description: t('import.desc') },
  ]

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
              reference_number: row.reference_number || row.reference || row.ref || '',
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
    <PageTransition>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('import.title')}</h1>
          <p className="text-gray-600">{t('import.desc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {IMPORT_TYPES.map((type) => (
            <Card
              key={type.id}
              className={`cursor-pointer transition-colors ${
                selectedType === type.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => { setSelectedType(type.id); setResult(null); setFile(null); setPreview([]) }}
            >
              <CardContent className="p-4">
                <h3 className="font-medium">{type.label}</h3>
                <p className="text-sm text-gray-500">{type.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedType && (
          <Card>
            <CardHeader>
              <CardTitle>
                Import {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 mb-6"
              >
                {file ? (
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-600">{t('import.click_upload')}</p>
                    <p className="text-sm text-gray-500 mt-1">{t('import.format_note')}</p>
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

              {preview.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">{t('import.preview')}</h3>
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

              {result && (
                <div className={`p-4 rounded-lg mb-4 ${result.errors.length === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <div className="flex items-center gap-2">
                    {result.errors.length === 0 ? (
                      <CheckCircle className="size-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="size-5 text-yellow-600" />
                    )}
                    <p className="font-medium">
                      {result.success} {t('import.success')}
                    </p>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-red-600">{result.errors.length} {t('import.errors')}:</p>
                      <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                        {result.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={loading || !file}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Upload className="size-4 mr-2" />
                {loading ? t('import.importing') : t('import.start')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
