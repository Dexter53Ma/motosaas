'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DamageReportFormProps {
  rentalId: string
  vehicleId: string
  customerId: string
  onReportCreated?: (report: any) => void
  onCancel?: () => void
}

const DAMAGE_TYPES = [
  { value: 'scratch', label: 'Scratch' },
  { value: 'dent', label: 'Dent' },
  { value: 'crack', label: 'Crack' },
  { value: 'broken', label: 'Broken' },
  { value: 'stain', label: 'Stain' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'other', label: 'Other' },
]

const SEVERITY_LEVELS = [
  { value: 'minor', label: 'Minor', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'moderate', label: 'Moderate', color: 'bg-orange-100 text-orange-800' },
  { value: 'major', label: 'Major', color: 'bg-red-100 text-red-800' },
  { value: 'total', label: 'Total Loss', color: 'bg-red-600 text-white' },
]

const DAMAGE_LOCATIONS = [
  'Front Bumper', 'Rear Bumper', 'Left Door', 'Right Door',
  'Hood', 'Trunk', 'Left Fender', 'Right Fender',
  'Windshield', 'Rear Window', 'Left Mirror', 'Right Mirror',
  'Left Headlight', 'Right Headlight', 'Left Taillight', 'Right Taillight',
  'Roof', 'Undercarriage', 'Interior', 'Engine', 'Other',
]

export default function DamageReportForm({ rentalId, vehicleId, customerId, onReportCreated, onCancel }: DamageReportFormProps) {
  const [formData, setFormData] = useState({
    damage_type: 'scratch',
    severity: 'minor',
    location: '',
    description: '',
    estimated_cost: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) throw new Error('No tenant found')

      const { data: report, error: reportError } = await supabase
        .from('damage_reports')
        .insert({
          tenant_id: userData.tenant_id,
          rental_id: rentalId,
          vehicle_id: vehicleId,
          customer_id: customerId,
          reported_by: user.id,
          damage_type: formData.damage_type,
          severity: formData.severity,
          location: formData.location,
          description: formData.description,
          estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : 0,
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (reportError) throw reportError

      onReportCreated?.(report)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Damage Type *</label>
        <select
          value={formData.damage_type}
          onChange={(e) => setFormData({ ...formData, damage_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {DAMAGE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
        <div className="grid grid-cols-2 gap-2">
          {SEVERITY_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setFormData({ ...formData, severity: level.value })}
              className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                formData.severity === level.value
                  ? `${level.color} border-current`
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
        <select
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select location</option>
          {DAMAGE_LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={3}
          placeholder="Describe the damage in detail..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (MAD)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.estimated_cost}
          onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
          placeholder="0.00"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          placeholder="Additional notes..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !formData.location || !formData.description}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Report Damage'}
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