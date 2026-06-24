'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PageTransition } from '@/components/PageTransition'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Plus,
  GripVertical,
  Trash2,
  Edit,
  X,
  Car,
  Users,
  FileText,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface CustomField {
  id: string
  entity_type: 'vehicle' | 'customer' | 'rental'
  name: string
  type: 'text' | 'number' | 'date' | 'select' | 'boolean'
  is_required: boolean
  options: string[]
  display_order: number
}

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'boolean', label: 'Boolean' },
]

const ENTITY_ICONS: Record<string, any> = {
  vehicle: Car,
  customer: Users,
  rental: FileText,
}

export default function CustomFieldsPage() {
  const { t } = useI18n()
  const [fields, setFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)
  const [entityFilter, setEntityFilter] = useState('all')
  const [formData, setFormData] = useState({
    entity_type: 'vehicle',
    name: '',
    type: 'text',
    is_required: false,
    options: '',
  })
  const supabase = createClient()

  useEffect(() => { fetchFields() }, [])

  async function fetchFields() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    const { data: fieldsData } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('display_order', { ascending: true })

    if (fieldsData) setFields(fieldsData)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) return

    const optionsArray = formData.type === 'select'
      ? formData.options.split(',').map(o => o.trim()).filter(Boolean)
      : []

    const payload = {
      tenant_id: userData.tenant_id,
      entity_type: formData.entity_type,
      name: formData.name,
      type: formData.type,
      is_required: formData.is_required,
      options: optionsArray,
      display_order: editingField?.display_order ?? fields.length,
    }

    if (editingField) {
      await supabase.from('custom_fields').update(payload).eq('id', editingField.id)
      toast.success('Custom field updated!')
    } else {
      await supabase.from('custom_fields').insert(payload)
      toast.success('Custom field created!')
    }

    setShowForm(false)
    setEditingField(null)
    resetForm()
    fetchFields()
  }

  function resetForm() {
    setFormData({
      entity_type: 'vehicle',
      name: '',
      type: 'text',
      is_required: false,
      options: '',
    })
  }

  function handleEdit(field: CustomField) {
    setEditingField(field)
    setFormData({
      entity_type: field.entity_type,
      name: field.name,
      type: field.type,
      is_required: field.is_required,
      options: field.options?.join(', ') || '',
    })
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this custom field?')) return
    await supabase.from('custom_fields').delete().eq('id', id)
    toast.success('Custom field deleted')
    fetchFields()
  }

  async function handleMoveUp(field: CustomField, index: number) {
    if (index === 0) return
    const prevField = filtered[index - 1]
    await supabase
      .from('custom_fields')
      .update({ display_order: field.display_order - 1 })
      .eq('id', field.id)
    await supabase
      .from('custom_fields')
      .update({ display_order: prevField.display_order + 1 })
      .eq('id', prevField.id)
    fetchFields()
  }

  async function handleMoveDown(field: CustomField, index: number) {
    if (index >= filtered.length - 1) return
    const nextField = filtered[index + 1]
    await supabase
      .from('custom_fields')
      .update({ display_order: field.display_order + 1 })
      .eq('id', field.id)
    await supabase
      .from('custom_fields')
      .update({ display_order: nextField.display_order - 1 })
      .eq('id', nextField.id)
    fetchFields()
  }

  const filtered = entityFilter === 'all'
    ? fields
    : fields.filter(f => f.entity_type === entityFilter)

  const entityCounts = fields.reduce((acc, f) => {
    acc[f.entity_type] = (acc[f.entity_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <PageTransition>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("custom_fields.title")}</h1>
            <p className="text-gray-600">{t("custom_fields.desc")}</p>
          </div>
          <Button
            onClick={() => { resetForm(); setEditingField(null); setShowForm(true) }}
            className="bg-[#10b981] hover:bg-[#059669] text-white"
          >
            <Plus className="size-4 mr-2" />
            Add Custom Field
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Plus className="size-4" />
                <p className="text-sm">{t("custom_fields.total")}</p>
              </div>
              <p className="text-2xl font-bold">{fields.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-500 mb-1">
                <Car className="size-4" />
                <p className="text-sm">{t("custom_fields.vehicle_fields")}</p>
              </div>
              <p className="text-2xl font-bold">{entityCounts.vehicle || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-[#10b981] mb-1">
                <Users className="size-4" />
                <p className="text-sm">{t("custom_fields.customer_fields")}</p>
              </div>
              <p className="text-2xl font-bold">{entityCounts.customer || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-purple-500 mb-1">
                <FileText className="size-4" />
                <p className="text-sm">{t("custom_fields.rental_fields")}</p>
              </div>
              <p className="text-2xl font-bold">{entityCounts.rental || 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mb-4">
          <Select value={entityFilter} onValueChange={(v) => v && setEntityFilter(v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("custom_fields.all_entities")}</SelectItem>
              <SelectItem value="vehicle">Vehicle</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="rental">Rental</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingField ? 'Edit Custom Field' : 'New Custom Field'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingField(null) }}>
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("custom_fields.entity_type")}</label>
                  <Select value={formData.entity_type} onValueChange={(v) => v !== null && setFormData({ ...formData, entity_type: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="rental">Rental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("custom_fields.field_name")}</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Color, Engine Size"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("custom_fields.field_type")}</label>
                  <Select value={formData.type} onValueChange={(v) => v !== null && setFormData({ ...formData, type: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.type === 'select' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("custom_fields.options")}</label>
                    <Input
                      value={formData.options}
                      onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                      placeholder="Red, Blue, Green, Black"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                    <input
                    type="checkbox"
                    id="required"
                    checked={formData.is_required}
                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                    className="w-4 h-4 text-[#10b981] rounded"
                  />
                  <label htmlFor="required" className="text-sm font-medium">{t("custom_fields.required")}</label>
                </div>
                <div className="flex justify-end gap-2 mt-4 md:col-span-2">
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingField(null) }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#10b981] hover:bg-[#059669] text-white">
                    {editingField ? 'Update Field' : 'Create Field'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("custom_fields.title")}</CardTitle>
            <CardDescription>{t("custom_fields.drag_reorder")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-8 text-center text-gray-500">{t("custom_fields.loading")}</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t("custom_fields.empty")}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>{t("custom_fields.entity")}</TableHead>
                    <TableHead>{t("custom_fields.field_name")}</TableHead>
                    <TableHead>{t("custom_fields.type")}</TableHead>
                    <TableHead>{t("custom_fields.required")}</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead className="text-right">{t("custom_fields.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((field, index) => {
                    const EntityIcon = ENTITY_ICONS[field.entity_type] || FileText
                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => handleMoveUp(field, index)}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <GripVertical className="size-3 rotate-180" />
                            </button>
                            <button
                              onClick={() => handleMoveDown(field, index)}
                              disabled={index >= filtered.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <GripVertical className="size-3" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit capitalize">
                            <EntityIcon className="size-3" />
                            {field.entity_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{field.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{field.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {field.is_required ? (
                            <Badge className="bg-[#10b981] text-white">{t("custom_fields.required")}</Badge>
                          ) : (
                            <Badge variant="outline">{t("custom_fields.optional")}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {field.options?.length ? field.options.join(', ') : 'â€”'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(field)}>
                              <Edit className="size-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(field.id)}>
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </PageTransition>
  )
}
