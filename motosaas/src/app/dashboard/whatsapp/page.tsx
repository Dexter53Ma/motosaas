'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, MessageSquare, Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { getWhatsAppConfig, updateWhatsAppConfig, getTemplates, createTemplate, updateTemplate, deleteTemplate, type WhatsAppTemplate } from '@/lib/whatsapp'
import { useI18n } from '@/lib/i18n'

export default function WhatsAppSettingsPage() {
  const { t } = useI18n()
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
      setSuccess(t('common.success'))
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
    if (!confirm(t('whatsapp.delete_confirm'))) return

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
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-gray-500">{t('common.loading')}</p>
      </main>
    )
  }

  return (
    <PageTransition>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('whatsapp.title')}</h1>
            <p className="text-gray-600">{t('whatsapp.desc')}</p>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg mb-4">{success}</div>}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('whatsapp.connection_status')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${config?.is_connected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">{config?.is_connected ? t('whatsapp.connected') : t('whatsapp.not_connected')}</span>
            </div>
            {config?.phone_number && (
              <p className="text-gray-600 mt-2">{t('whatsapp.phone')}: {config.phone_number}</p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('whatsapp.configuration')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>{t('whatsapp.phone_number')}</Label>
                <Input
                  type="text"
                  value={config?.phone_number || ''}
                  onChange={(e) => setConfig({ ...config, phone_number: e.target.value })}
                  placeholder="+212 600 000 000"
                />
              </div>
              <div>
                <Label>{t('whatsapp.business_name')}</Label>
                <Input
                  type="text"
                  value={config?.business_name || ''}
                  onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                  placeholder={t('whatsapp.business_name')}
                />
              </div>
              <Button onClick={handleSaveConfig} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? t('common.loading') : t('whatsapp.save_config')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t('whatsapp.message_templates')}
              </CardTitle>
              <Button
                onClick={() => { setShowTemplateForm(true); setEditingTemplate(null); setTemplateForm({ name: '', category: 'rental_confirmation', language: 'fr', subject: '', body: '' }) }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('whatsapp.new_template')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showTemplateForm && (
              <div className="border rounded-lg p-4 mb-4 bg-gray-50">
                <h3 className="font-medium mb-3">{editingTemplate ? t('whatsapp.edit_template') : t('whatsapp.new_template')}</h3>
                <div className="space-y-3">
                  <Input
                    placeholder={t('whatsapp.template_name')}
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  />
                  <div className="flex gap-3">
                    <select
                      value={templateForm.category}
                      onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                      className="flex-1 h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm"
                    >
                      <option value="rental_confirmation">{t('whatsapp.rental_confirmation')}</option>
                      <option value="payment_reminder">{t('whatsapp.payment_reminder')}</option>
                      <option value="return_reminder">{t('whatsapp.return_reminder')}</option>
                      <option value="invoice">{t('whatsapp.invoice')}</option>
                      <option value="promotion">{t('whatsapp.promotion')}</option>
                      <option value="custom">{t('whatsapp.custom')}</option>
                    </select>
                    <select
                      value={templateForm.language}
                      onChange={(e) => setTemplateForm({ ...templateForm, language: e.target.value })}
                      className="flex-1 h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm"
                    >
                      <option value="fr">French</option>
                      <option value="ar">Arabic</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <textarea
                    placeholder={t('whatsapp.message_hint')}
                    value={templateForm.body}
                    onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                    rows={5}
                    className="w-full min-h-[100px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                  />
                  <p className="text-sm text-gray-500">
                    {t('whatsapp.variables_hint')}: {'{{customer_name}}'}, {'{{vehicle_make}}'}, {'{{vehicle_model}}'}, {'{{start_date}}'}, {'{{end_date}}'}, {'{{daily_rate}}'}, {'{{amount}}'}, {'{{return_date}}'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveTemplate}
                      disabled={saving || !templateForm.name || !templateForm.body}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {saving ? t('common.loading') : t('whatsapp.save_template')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setShowTemplateForm(false); setEditingTemplate(null) }}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {templates.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('whatsapp.no_templates')}</p>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {t('common.delete')}
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{template.body}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </PageTransition>
  )
}
