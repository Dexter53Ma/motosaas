'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getWhatsAppConfig, updateWhatsAppConfig, getTemplates, createTemplate, updateTemplate, deleteTemplate, type WhatsAppTemplate } from '@/lib/whatsapp'

export default function WhatsAppSettingsPage() {
  const [config, setConfig] = useState<any>(null)
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'rental_confirmation',
    language: 'fr',
    subject: '',
    body: '',
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    const [configData, templatesData] = await Promise.all([
      getWhatsAppConfig(userData.tenant_id).catch(() => null),
      getTemplates(userData.tenant_id).catch(() => []),
    ])

    setConfig(configData)
    setTemplates(templatesData)
    setLoading(false)
  }

  async function handleSaveConfig() {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) throw new Error('No tenant found')

      await updateWhatsAppConfig(userData.tenant_id, config || {})
      setSuccess('Configuration saved successfully')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveTemplate() {
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) throw new Error('No tenant found')

      const variables = templateForm.body.match(/\{\{(\w+)\}\}/g)?.map(v => v.replace(/\{\{|\}\}/g, '')) || []

      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          ...templateForm,
          variables,
        })
      } else {
        await createTemplate({
          tenant_id: userData.tenant_id,
          ...templateForm,
          variables,
          is_active: true,
        })
      }

      setShowTemplateForm(false)
      setEditingTemplate(null)
      setTemplateForm({ name: '', category: 'rental_confirmation', language: 'fr', subject: '', body: '' })
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await deleteTemplate(id)
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  function handleEditTemplate(template: WhatsAppTemplate) {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      category: template.category,
      language: template.language,
      subject: template.subject || '',
      body: template.body,
    })
    setShowTemplateForm(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">Loading...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
              <div className="hidden md:flex space-x-4">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Dashboard</Link>
                <Link href="/dashboard/vehicles" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Vehicles</Link>
                <Link href="/dashboard/customers" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Customers</Link>
                <Link href="/dashboard/rentals" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Rentals</Link>
                <Link href="/dashboard/payments" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Payments</Link>
                <Link href="/dashboard/whatsapp" className="text-gray-900 font-semibold px-3 py-2 text-sm">WhatsApp</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Settings</h1>
            <p className="text-gray-600">Configure WhatsApp integration and message templates</p>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4">{success}</div>}

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Connection Status</h2>
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${config?.is_connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">{config?.is_connected ? 'Connected' : 'Not Connected'}</span>
          </div>
          {config?.phone_number && (
            <p className="text-gray-600 mt-2">Phone: {config.phone_number}</p>
          )}
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={config?.phone_number || ''}
                onChange={(e) => setConfig({ ...config, phone_number: e.target.value })}
                placeholder="+212 600 000 000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                value={config?.business_name || ''}
                onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                placeholder="Your Business Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>

        {/* Templates */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Message Templates</h2>
            <button
              onClick={() => { setShowTemplateForm(true); setEditingTemplate(null); setTemplateForm({ name: '', category: 'rental_confirmation', language: 'fr', subject: '', body: '' }) }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + New Template
            </button>
          </div>

          {showTemplateForm && (
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              <h3 className="font-medium mb-3">{editingTemplate ? 'Edit Template' : 'New Template'}</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Template Name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="flex gap-3">
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="rental_confirmation">Rental Confirmation</option>
                    <option value="payment_reminder">Payment Reminder</option>
                    <option value="return_reminder">Return Reminder</option>
                    <option value="invoice">Invoice</option>
                    <option value="promotion">Promotion</option>
                    <option value="custom">Custom</option>
                  </select>
                  <select
                    value={templateForm.language}
                    onChange={(e) => setTemplateForm({ ...templateForm, language: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="fr">French</option>
                    <option value="ar">Arabic</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <textarea
                  placeholder="Message body. Use {{variable_name}} for dynamic content."
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-sm text-gray-500">
                  Available variables: {'{{customer_name}}'}, {'{{vehicle_make}}'}, {'{{vehicle_model}}'}, {'{{start_date}}'}, {'{{end_date}}'}, {'{{daily_rate}}'}, {'{{amount}}'}, {'{{return_date}}'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveTemplate}
                    disabled={saving || !templateForm.name || !templateForm.body}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Template'}
                  </button>
                  <button
                    onClick={() => { setShowTemplateForm(false); setEditingTemplate(null) }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {templates.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No templates yet. Create one to get started.</p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-gray-500">
                        {template.category.replace('_', ' ')} • {template.language.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{template.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}