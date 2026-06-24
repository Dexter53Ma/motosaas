'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ChecklistFormProps {
  rentalId?: string
  vehicleId: string
  templateId: string
  onComplete?: (instance: any) => void
  onCancel?: () => void
}

export default function ChecklistForm({ rentalId, vehicleId, templateId, onComplete, onCancel }: ChecklistFormProps) {
  const [template, setTemplate] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [instanceId, setInstanceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => { loadTemplate() }, [templateId])

  async function loadTemplate() {
    const { data: templateData } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateData) {
      setTemplate(templateData)
      const templateItems = (templateData.items || []).map((item: string) => ({
        label: item,
        checked: false,
        notes: '',
      }))
      setItems(templateItems)
    }

    setLoading(false)
  }

  async function createInstance() {
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) throw new Error('No tenant found')

      const { data: instance, error: instanceError } = await supabase
        .from('checklist_instances')
        .insert({
          tenant_id: userData.tenant_id,
          template_id: templateId,
          rental_id: rentalId || null,
          vehicle_id: vehicleId,
          user_id: user.id,
          status: 'in_progress',
        })
        .select()
        .single()

      if (instanceError) throw instanceError
      setInstanceId(instance.id)

      const checklistItems = items.map((item) => ({
        instance_id: instance.id,
        item_label: item.label,
        is_checked: false,
        notes: null,
      }))

      const { error: itemsError } = await supabase
        .from('checklist_items')
        .insert(checklistItems)

      if (itemsError) throw itemsError
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleItem(index: number) {
    const newItems = [...items]
    newItems[index].checked = !newItems[index].checked
    setItems(newItems)
  }

  async function updateItemNotes(index: number, notes: string) {
    const newItems = [...items]
    newItems[index].notes = notes
    setItems(newItems)
  }

  async function completeChecklist() {
    setSaving(true)
    setError('')

    try {
      if (!instanceId) {
        await createInstance()
        return
      }

      const allChecked = items.every((item) => item.checked)
      const { error: updateError } = await supabase
        .from('checklist_instances')
        .update({
          status: allChecked ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', instanceId)

      if (updateError) throw updateError

      onComplete?.({ id: instanceId, status: allChecked ? 'completed' : 'failed' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading template...</div>
  }

  if (!template) {
    return <div className="text-center py-4 text-red-600">Template not found</div>
  }

  const checkedCount = items.filter((i) => i.checked).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{template.name}</h3>
          <p className="text-sm text-gray-500">
            {checkedCount}/{items.length} items checked
          </p>
        </div>
        <div className="w-32 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              item.checked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem(index)}
                className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className={`font-medium ${item.checked ? 'text-green-700 line-through' : ''}`}>
                  {item.label}
                </p>
                {item.checked && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Checked at {new Date().toLocaleTimeString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={completeChecklist}
          disabled={saving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : checkedCount === items.length ? 'Complete Checklist' : 'Save Progress'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}