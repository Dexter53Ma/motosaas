'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DocumentUploadProps {
  customerId?: string
  vehicleId?: string
  rentalId?: string
  onUploaded?: (document: any) => void
  onCancel?: () => void
}

const DOCUMENT_TYPES = [
  { value: 'id_card', label: 'ID Card' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'contract', label: 'Contract' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'photo', label: 'Photo' },
  { value: 'other', label: 'Other' },
]

export default function DocumentUpload({ customerId, vehicleId, rentalId, onUploaded, onCancel }: DocumentUploadProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'other',
    notes: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setFormData({ ...formData, name: selectedFile.name })

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')
    setUploadProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) throw new Error('No tenant found')

      const fileExt = file.name.split('.').pop()
      const fileName = `${userData.tenant_id}/${Date.now()}.${fileExt}`

      setUploadProgress(50)

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          tenant_id: userData.tenant_id,
          customer_id: customerId || null,
          vehicle_id: vehicleId || null,
          rental_id: rentalId || null,
          uploaded_by: user.id,
          name: formData.name || file.name,
          type: formData.type,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (docError) throw docError

      onUploaded?.(document)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-32 mx-auto" />
          ) : file ? (
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div>
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Optional document name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          placeholder="Optional notes..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && uploadProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !file}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload Document'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}