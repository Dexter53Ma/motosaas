'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent } from '@/components/ui/card'
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
import { Plus, Trash2, ExternalLink, FileText } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import DocumentUpload from '@/components/DocumentUpload'

const DOCUMENT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'id_card', label: 'ID Card' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'contract', label: 'Contract' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'photo', label: 'Photo' },
  { value: 'other', label: 'Other' },
]

export default function DocumentsPage() {
  const { t } = useI18n()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [tenantId, setTenantId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData?.tenant_id) { setLoading(false); return }
      setTenantId(userData.tenant_id)
      await fetchDocuments(userData.tenant_id)
    }
    init()
  }, [filter])

  async function fetchDocuments(tid?: string) {
    setLoading(true)

    let query = supabase
      .from('documents')
      .select('*, customer:customers(full_name), vehicle:vehicles(make, model, license_plate)')
      .eq('tenant_id', tid as string)

    if (filter !== 'all') {
      query = query.eq('type', filter)
    }

    const { data } = await query.order('created_at', { ascending: false })

    if (data) setDocuments(data)
    setLoading(false)
  }

  async function deleteDocument(id: string, fileUrl: string) {
    if (!confirm('Delete this document?')) return

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (!error) {
      const fileName = fileUrl.split('/').pop()
      if (fileName) {
        await supabase.storage.from('documents').remove([fileName])
      }
      if (tenantId) await fetchDocuments(tenantId)
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase()) ||
    doc.customer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    doc.vehicle?.make?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageTransition>
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b">
              <h3 className="font-medium">{t('documents.upload')}</h3>
            </div>
            <div className="p-4">
              <DocumentUpload
                onUploaded={() => { setShowUpload(false); fetchDocuments() }}
                onCancel={() => setShowUpload(false)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('documents.title')}</h1>
          <p className="text-gray-600">{t('documents.search')}</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="size-4 mr-2" />
          {t('documents.upload')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={t('documents.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">{t('common.loading')}</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">{t('documents.empty')}</div>
        ) : (
          filteredDocuments.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                    <FileText className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.name}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {doc.type.replace('_', ' ')}
                    </p>
                    {doc.customer && (
                      <p className="text-sm text-gray-500">
                        {t('documents.customer_label')} {doc.customer.full_name}
                      </p>
                    )}
                    {doc.vehicle && (
                      <p className="text-sm text-gray-500">
                        {t('documents.vehicle_label')} {doc.vehicle.make} {doc.vehicle.model}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <p>{formatFileSize(doc.file_size || 0)}</p>
                    <p>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" render={<a href={doc.file_url} target="_blank" rel="noopener noreferrer" />}>
                        <ExternalLink className="size-3 mr-1" />
                        {t('documents.view')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => deleteDocument(doc.id, doc.file_url)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageTransition>
  )
}
