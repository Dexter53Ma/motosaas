'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
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
  DollarSign,
  Plus,
  Calendar,
  Car,
  TrendingUp,
  X,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface PricingRule {
  id: string
  rule_name: string
  vehicle_type: string
  base_rate: number
  peak_multiplier: number
  weekend_multiplier: number
  holiday_multiplier: number
  min_rental_days: number
  effective_from: string
  effective_until: string
  active: boolean
}

export default function PricingPage() {
  const { t } = useI18n()
  const [rules, setRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)
  const [formData, setFormData] = useState({
    rule_name: '',
    vehicle_type: 'scooter',
    base_rate: '',
    peak_multiplier: '1.0',
    weekend_multiplier: '1.0',
    holiday_multiplier: '1.0',
    min_rental_days: '1',
    effective_from: '',
    effective_until: '',
    active: true,
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { fetchRules() }, [])

  async function fetchRules() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    const { data: rulesData } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false })

    if (rulesData) setRules(rulesData)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) return

    const payload = {
      tenant_id: userData.tenant_id,
      rule_name: formData.rule_name,
      vehicle_type: formData.vehicle_type,
      base_rate: parseFloat(formData.base_rate),
      peak_multiplier: parseFloat(formData.peak_multiplier),
      weekend_multiplier: parseFloat(formData.weekend_multiplier),
      holiday_multiplier: parseFloat(formData.holiday_multiplier),
      min_rental_days: parseInt(formData.min_rental_days),
      effective_from: formData.effective_from || null,
      effective_until: formData.effective_until || null,
      active: formData.active,
    }

    if (editingRule) {
      const { error } = await supabase.from('pricing_rules').update(payload).eq('id', editingRule.id)
      if (error) { toast.error(error.message); return }
      toast.success('Pricing rule updated!')
    } else {
      const { error } = await supabase.from('pricing_rules').insert(payload)
      if (error) { toast.error(error.message); return }
      toast.success('Pricing rule created!')
    }

    setShowForm(false)
    setEditingRule(null)
    resetForm()
    fetchRules()
  }

  function resetForm() {
    setFormData({
      rule_name: '',
      vehicle_type: 'scooter',
      base_rate: '',
      peak_multiplier: '1.0',
      weekend_multiplier: '1.0',
      holiday_multiplier: '1.0',
      min_rental_days: '1',
      effective_from: '',
      effective_until: '',
      active: true,
    })
  }

  function handleEdit(rule: PricingRule) {
    setEditingRule(rule)
    setFormData({
      rule_name: rule.rule_name,
      vehicle_type: rule.vehicle_type,
      base_rate: String(rule.base_rate),
      peak_multiplier: String(rule.peak_multiplier),
      weekend_multiplier: String(rule.weekend_multiplier),
      holiday_multiplier: String(rule.holiday_multiplier),
      min_rental_days: String(rule.min_rental_days),
      effective_from: rule.effective_from?.split('T')[0] || '',
      effective_until: rule.effective_until?.split('T')[0] || '',
      active: rule.active,
    })
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this pricing rule?')) return
    await supabase.from('pricing_rules').delete().eq('id', id)
    toast.success('Pricing rule deleted')
    fetchRules()
  }

  async function toggleActive(rule: PricingRule) {
    await supabase
      .from('pricing_rules')
      .update({ active: !rule.active })
      .eq('id', rule.id)
    fetchRules()
  }

  const activeRules = rules.filter(r => r.active)
  const today = new Date().toISOString().split('T')[0]

  return (
    <PageTransition>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("pricing.title")}</h1>
            <p className="text-gray-600">{t("pricing.desc")}</p>
          </div>
          <Button
            onClick={() => { resetForm(); setEditingRule(null); setShowForm(true) }}
            className="bg-[#10b981] hover:bg-[#059669] text-white"
          >
            <Plus className="size-4 mr-2" />
            Add Pricing Rule
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <DollarSign className="size-4" />
                <p className="text-sm">{t("pricing.total_rules")}</p>
              </div>
              <p className="text-2xl font-bold">{rules.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-[#10b981] mb-1">
                <TrendingUp className="size-4" />
                <p className="text-sm">{t("pricing.active_rules")}</p>
              </div>
              <p className="text-2xl font-bold text-[#10b981]">{activeRules.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-500 mb-1">
                <Car className="size-4" />
                <p className="text-sm">{t("pricing.vehicle_types")}</p>
              </div>
              <p className="text-2xl font-bold">{new Set(rules.map(r => r.vehicle_type)).size}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-500 mb-1">
                <Calendar className="size-4" />
                <p className="text-sm">{t("pricing.expiring_soon")}</p>
              </div>
              <p className="text-2xl font-bold text-orange-500">
                {rules.filter(r => r.effective_until && r.effective_until <= today && r.active).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingRule ? 'Edit Pricing Rule' : 'New Pricing Rule'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingRule(null) }}>
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("pricing.rule_name")}</label>
                  <Input
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    placeholder="e.g. Summer Peak"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("pricing.vehicle_type")}</label>
                  <Select value={formData.vehicle_type} onValueChange={(v) => v !== null && setFormData({ ...formData, vehicle_type: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scooter">Scooter</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("pricing.base_rate")}</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.base_rate}
                    onChange={(e) => setFormData({ ...formData, base_rate: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("pricing.peak_multiplier")}</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.peak_multiplier}
                    onChange={(e) => setFormData({ ...formData, peak_multiplier: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("pricing.weekend_multiplier")}</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.weekend_multiplier}
                    onChange={(e) => setFormData({ ...formData, weekend_multiplier: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("pricing.holiday_multiplier")}</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.holiday_multiplier}
                    onChange={(e) => setFormData({ ...formData, holiday_multiplier: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("pricing.min_days")}</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.min_rental_days}
                    onChange={(e) => setFormData({ ...formData, min_rental_days: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("pricing.effective_from")}</label>
                  <Input
                    type="date"
                    value={formData.effective_from}
                    onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("pricing.effective_until")}</label>
                  <Input
                    type="date"
                    value={formData.effective_until}
                    onChange={(e) => setFormData({ ...formData, effective_until: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-[#10b981] rounded"
                  />
                  <label htmlFor="active" className="text-sm font-medium">{t('pricing.active')}</label>
                </div>
                <div className="md:col-span-3 flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingRule(null) }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#10b981] hover:bg-[#059669] text-white">
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("pricing.all_rules")}</CardTitle>
            <CardDescription>All pricing rules for your fleet</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-8 text-center text-gray-500">{t("pricing.loading")}</div>
            ) : rules.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No pricing rules yet. Create your first rule above.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("pricing.rule_name")}</TableHead>
                    <TableHead>{t("pricing.vehicle_type")}</TableHead>
                    <TableHead>Base Rate</TableHead>
                    <TableHead>Peak</TableHead>
                    <TableHead>Weekend</TableHead>
                    <TableHead>Holiday</TableHead>
                    <TableHead>Min Days</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.rule_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{rule.vehicle_type}</Badge>
                      </TableCell>
                      <TableCell>{rule.base_rate} MAD</TableCell>
                      <TableCell>{rule.peak_multiplier}x</TableCell>
                      <TableCell>{rule.weekend_multiplier}x</TableCell>
                      <TableCell>{rule.holiday_multiplier}x</TableCell>
                      <TableCell>{rule.min_rental_days}d</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {rule.effective_from ? new Date(rule.effective_from).toLocaleDateString('fr-FR') : 'â€”'}
                        {' to '}
                        {rule.effective_until ? new Date(rule.effective_until).toLocaleDateString('fr-FR') : 'â€”'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rule.active ? 'default' : 'secondary'}
                          className={rule.active ? 'bg-[#10b981] text-white' : ''}
                        >
                          {rule.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(rule)}
                            className={rule.active ? 'text-orange-600' : 'text-[#10b981]'}
                          >
                            {rule.active ? 'Disable' : 'Enable'}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(rule.id)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </PageTransition>
  )
}
