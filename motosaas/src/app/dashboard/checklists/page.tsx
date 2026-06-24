'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import ChecklistForm from '@/components/ChecklistForm'

const TEMPLATE_TYPES = [
  { value: 'checkout', label: 'Checkout', description: 'Before renting out the vehicle' },
  { value: 'return', label: 'Return', description: 'When customer returns the vehicle' },
  { value: 'inspection', label: 'Inspection', description: 'Regular vehicle inspection' },
  { value: 'maintenance', label: 'Maintenance', description: 'Before/after maintenance work' },
]

export default function ChecklistsPage() {
  const { t } = useI18n()
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
  const [tenantId, setTenantId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData?.tenant_id) { setLoading(false); return }
      setTenantId(userData.tenant_id)
      await fetchData(userData.tenant_id)
    }
    init()
  }, [])

  async function fetchData(tid: string) {
    setLoading(true)

    const { data: templatesData } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('tenant_id', tid)
      .order('name')

    if (templatesData) setTemplates(templatesData)

    const { data: instancesData } = await supabase
      .from('checklist_instances')
      .select('*, template:checklist_templates(name), vehicle:vehicles(make, model, license_plate), user:users(full_name)')
      .eq('tenant_id', tid)
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
      if (tenantId) await fetchData(tenantId)
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

    if (!error && tenantId) await fetchData(tenantId)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">{t('common.loading')}</div>
  }

  return (
    <PageTransition>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('checklists.title')}</h1>
          <p className="text-gray-600">{t('checklists.recent')}</p>
        </div>
        <Button onClick={() => setShowNewTemplate(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="size-4 mr-2" />
          {t('checklists.new')}
        </Button>
      </div>

      {showNewTemplate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('checklists.create')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('checklists.name')} *</label>
                <Input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Pre-Rental Inspection"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('checklists.type')}</label>
                <Select value={newTemplate.type} onValueChange={(v) => v && setNewTemplate({ ...newTemplate, type: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('checklists.items')}</label>
                <div className="space-y-2">
                  {newTemplate.items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="text"
                        value={item}
                        onChange={(e) => updateItem(index, e.target.value)}
                        placeholder={`Item ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="link" onClick={addItem} className="mt-2 text-emerald-600">
                  + {t('checklists.add_item')}
                </Button>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-2">
                <Button
                  onClick={createTemplate}
                  disabled={saving || !newTemplate.name}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {saving ? t('common.loading') : t('checklists.create_template')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowNewTemplate(false); setError('') }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardContent className="p-4">
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
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteTemplate(template.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                {(template.items || []).slice(0, 3).map((item: string, i: number) => (
                  <div key={i}>• {item}</div>
                ))}
                {(template.items?.length || 0) > 3 && (
                  <div className="text-gray-400">+{template.items.length - 3} more</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-4">{t('checklists.recent')}</h2>
      <Card>
        <CardContent className="p-0">
          {instances.length === 0 ? (
            <div className="p-8 text-center text-gray-500">{t('checklists.empty')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">{instance.template?.name}</TableCell>
                    <TableCell>{instance.vehicle?.make} {instance.vehicle?.model} ({instance.vehicle?.license_plate})</TableCell>
                    <TableCell>{instance.user?.full_name}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(instance.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={
                          instance.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          instance.status === 'failed' ? 'bg-red-100 text-red-800' :
                          instance.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {instance.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  )
}
