'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
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
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchDocuments() }, [filter])

  async function fetchDocuments() {
    setLoading(true)

    let query = supabase
      .from('documents')
      .select('*, customer:customers(full_name), vehicle:vehicles(make, model, license_plate)')

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
      await fetchDocuments()
    }
  }

  function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return '🖼️'
    if (mimeType === 'application/pdf') return '📄'
    return '📎'
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
              <h1 className="text-lg font-medium">Documents</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowUpload(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-4 border-b">
                <h3 className="font-medium">Upload Document</h3>
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-8">Loading...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">No documents found</div>
          ) : (
            filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getFileIcon(doc.mime_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.name}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {doc.type.replace('_', ' ')}
                    </p>
                    {doc.customer && (
                      <p className="text-sm text-gray-500">
                        Customer: {doc.customer.full_name}
                      </p>
                    )}
                    {doc.vehicle && (
                      <p className="text-sm text-gray-500">
                        Vehicle: {doc.vehicle.make} {doc.vehicle.model}
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
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      View
                    </a>
                    <button
                      onClick={() => deleteDocument(doc.id, doc.file_url)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}