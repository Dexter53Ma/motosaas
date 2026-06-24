'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ChecklistForm from '@/components/ChecklistForm'

const TEMPLATE_TYPES = [
  { value: 'checkout', label: 'Checkout', description: 'Before renting out the vehicle' },
  { value: 'return', label: 'Return', description: 'When customer returns the vehicle' },
  { value: 'inspection', label: 'Inspection', description: 'Regular vehicle inspection' },
  { value: 'maintenance', label: 'Maintenance', description: 'Before/after maintenance work' },
]

export default function ChecklistsPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [instances, setInstances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [showChecklist, setShowChecklist] = useState<{ templateId: string; vehicleId: string } | null>(null)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'checkout',
    items: [''],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)

    const { data: templatesData } = await supabase
      .from('checklist_templates')
      .select('*')
      .order('name')

    if (templatesData) setTemplates(templatesData)

    const { data: instancesData } = await supabase
      .from('checklist_instances')
      .select('*, template:checklist_templates(name), vehicle:vehicles(make, model, license_plate), user:users(full_name)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (instancesData) setInstances(instancesData)

    setLoading(false)
  }

  async function createTemplate() {
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) throw new Error('No tenant found')

      const validItems = newTemplate.items.filter((item) => item.trim() !== '')
      if (validItems.length === 0) throw new Error('Add at least one item')

      const { error: templateError } = await supabase
        .from('checklist_templates')
        .insert({
          tenant_id: userData.tenant_id,
          name: newTemplate.name,
          type: newTemplate.type,
          items: validItems,
        })

      if (templateError) throw templateError

      setShowNewTemplate(false)
      setNewTemplate({ name: '', type: 'checkout', items: [''] })
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function addItem() {
    setNewTemplate({ ...newTemplate, items: [...newTemplate.items, ''] })
  }

  function updateItem(index: number, value: string) {
    const items = [...newTemplate.items]
    items[index] = value
    setNewTemplate({ ...newTemplate, items })
  }

  function removeItem(index: number) {
    const items = newTemplate.items.filter((_, i) => i !== index)
    setNewTemplate({ ...newTemplate, items })
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this template?')) return

    const { error } = await supabase
      .from('checklist_templates')
      .delete()
      .eq('id', id)

    if (!error) await fetchData()
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
              <h1 className="text-lg font-medium">Checklists</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Templates</h2>
          <button
            onClick={() => setShowNewTemplate(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Template
          </button>
        </div>

        {/* New Template Form */}
        {showNewTemplate && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="font-medium mb-4">Create Checklist Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Pre-Rental Inspection"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {TEMPLATE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
                <div className="space-y-2">
                  {newTemplate.items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateItem(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={`Item ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Item
                </button>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={createTemplate}
                  disabled={saving || !newTemplate.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Template'}
                </button>
                <button
                  onClick={() => { setShowNewTemplate(false); setError('') }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-gray-500">
                    {TEMPLATE_TYPES.find((t) => t.value === template.type)?.label}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {template.items?.length || 0} items
                  </p>
                </div>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                {(template.items || []).slice(0, 3).map((item: string, i: number) => (
                  <div key={i}>• {item}</div>
                ))}
                {(template.items?.length || 0) > 3 && (
                  <div className="text-gray-400">+{template.items.length - 3} more</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Instances */}
        <h2 className="text-xl font-bold mb-4">Recent Checklists</h2>
        <div className="bg-white rounded-lg shadow">
          {instances.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No checklists yet</div>
          ) : (
            <div className="divide-y">
              {instances.map((instance) => (
                <div key={instance.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{instance.template?.name}</p>
                      <p className="text-sm text-gray-500">
                        {instance.vehicle?.make} {instance.vehicle?.model} ({instance.vehicle?.license_plate})
                      </p>
                      <p className="text-sm text-gray-500">
                        By: {instance.user?.full_name} • {new Date(instance.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      instance.status === 'completed' ? 'bg-green-100 text-green-800' :
                      instance.status === 'failed' ? 'bg-red-100 text-red-800' :
                      instance.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {instance.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}