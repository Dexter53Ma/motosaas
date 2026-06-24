'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Shield, Plus, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface InsurancePolicy {
  id: string
  vehicle_id: string
  insurance_company: string
  policy_number: string
  policy_type: string
  start_date: string
  end_date: string
  premium_amount: number
  coverage_amount: number
  status: string
  vehicles: { make: string; model: string; year: number; license_plate: string }
}

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  license_plate: string
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  expiring_soon: 'bg-amber-100 text-amber-800',
  expired: 'bg-red-100 text-red-800',
}

const POLICY_TYPES = ['comprehensive', 'third_party', 'collision', 'liability']

export default function InsurancePage() {
  const { t } = useI18n()
  const [policies, setPolicies] = useState<InsurancePolicy[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const [form, setForm] = useState({
    vehicle_id: '',
    insurance_company: '',
    policy_number: '',
    policy_type: 'comprehensive',
    start_date: '',
    end_date: '',
    premium_amount: '',
    coverage_amount: '',
    status: 'active',
  })

  useEffect(() => {
    fetchPolicies()
    fetchVehicles()
    checkExpiringPolicies()
  }, [])

  async function fetchPolicies() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    const { data } = await supabase
      .from('insurance_policies')
      .select('*, vehicles(make, model, year, license_plate)')
      .eq('tenant_id', userData.tenant_id)
      .order('end_date')

    if (data) setPolicies(data)
    setLoading(false)
  }

  async function fetchVehicles() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) return
    const { data } = await supabase.from('vehicles').select('id, make, model, year, license_plate').eq('tenant_id', userData.tenant_id)
    if (data) setVehicles(data)
  }

  async function checkExpiringPolicies() {
    const thirtyDays = new Date()
    thirtyDays.setDate(thirtyDays.getDate() + 30)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) return

    await supabase
      .from('insurance_policies')
      .update({ status: 'expiring_soon' })
      .eq('tenant_id', userData.tenant_id)
      .eq('status', 'active')
      .lte('end_date', thirtyDays.toISOString().split('T')[0])
      .gte('end_date', new Date().toISOString().split('T')[0])

    await supabase
      .from('insurance_policies')
      .update({ status: 'expired' })
      .eq('tenant_id', userData.tenant_id)
      .in('status', ['active', 'expiring_soon'])
      .lt('end_date', new Date().toISOString().split('T')[0])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) return

    const { error } = await supabase.from('insurance_policies').insert({
      tenant_id: userData.tenant_id,
      vehicle_id: form.vehicle_id,
      insurance_company: form.insurance_company,
      policy_number: form.policy_number,
      policy_type: form.policy_type,
      start_date: form.start_date,
      end_date: form.end_date,
      premium_amount: parseFloat(form.premium_amount),
      coverage_amount: parseFloat(form.coverage_amount),
      status: form.status,
    })

    if (!error) {
      setDialogOpen(false)
      setForm({ vehicle_id: '', insurance_company: '', policy_number: '', policy_type: 'comprehensive', start_date: '', end_date: '', premium_amount: '', coverage_amount: '', status: 'active' })
      toast.success('Insurance policy added successfully!')
      fetchPolicies()
    } else {
      toast.error('Failed to add policy')
    }
    setSubmitting(false)
  }

  const filtered = policies.filter(p => {
    const matchSearch = !search ||
      p.insurance_company?.toLowerCase().includes(search.toLowerCase()) ||
      p.policy_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.vehicles?.make?.toLowerCase().includes(search.toLowerCase()) ||
      p.vehicles?.license_plate?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: policies.length,
    active: policies.filter(p => p.status === 'active').length,
    expiringSoon: policies.filter(p => p.status === 'expiring_soon').length,
    expired: policies.filter(p => p.status === 'expired').length,
    totalPremium: policies.reduce((s, p) => s + (p.premium_amount || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Insurance & Permits</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track vehicle insurance policies and permits</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/25" />}>
            <Plus className="w-4 h-4" />
            Add Policy
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Insurance Policy</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <Select value={form.vehicle_id} onValueChange={(v) => v !== null && setForm({ ...form, vehicle_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.year} {v.make} {v.model}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Insurance Company</Label>
                  <Input value={form.insurance_company} onChange={(e) => setForm({ ...form, insurance_company: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Policy Number</Label>
                  <Input value={form.policy_number} onChange={(e) => setForm({ ...form, policy_number: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Policy Type</Label>
                  <Select value={form.policy_type} onValueChange={(v) => v !== null && setForm({ ...form, policy_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {POLICY_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Premium (MAD)</Label>
                  <Input type="number" value={form.premium_amount} onChange={(e) => setForm({ ...form, premium_amount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Coverage (MAD)</Label>
                  <Input type="number" value={form.coverage_amount} onChange={(e) => setForm({ ...form, coverage_amount: e.target.value })} required />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Add Policy'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stats.expiringSoon > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{stats.expiringSoon}</span> {stats.expiringSoon === 1 ? 'policy' : 'policies'} expiring within 30 days
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="border-l-4 border-emerald-300 shadow-sm">
          <CardContent className="py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="text-xl font-bold mt-1 text-emerald-600">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-blue-300 shadow-sm">
          <CardContent className="py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active</p>
            <p className="text-xl font-bold mt-1 text-blue-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-300 shadow-sm">
          <CardContent className="py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expiring Soon</p>
            <p className="text-xl font-bold mt-1 text-amber-600">{stats.expiringSoon}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-300 shadow-sm">
          <CardContent className="py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expired</p>
            <p className="text-xl font-bold mt-1 text-red-600">{stats.expired}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-300 shadow-sm">
          <CardContent className="py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Premium</p>
            <p className="text-xl font-bold mt-1 text-purple-600">{stats.totalPremium.toLocaleString()} MAD</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by company, policy, or vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-gray-50 border-gray-200 rounded-xl"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No policies yet</h3>
            <p className="text-muted-foreground mb-5 text-sm">Track your vehicle insurance and permits here</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1a1b2e] hover:bg-[#1a1b2e]">
                <TableHead className="text-white">Vehicle</TableHead>
                <TableHead className="text-white">Company</TableHead>
                <TableHead className="text-white">Policy #</TableHead>
                <TableHead className="text-white">Type</TableHead>
                <TableHead className="text-white">Coverage</TableHead>
                <TableHead className="text-white">Premium</TableHead>
                <TableHead className="text-white">Period</TableHead>
                <TableHead className="text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((policy) => (
                <TableRow key={policy.id} className="hover:bg-gray-50">
                  <TableCell>
                    <p className="font-medium">{policy.vehicles?.year} {policy.vehicles?.make} {policy.vehicles?.model}</p>
                    <p className="text-xs text-muted-foreground">{policy.vehicles?.license_plate}</p>
                  </TableCell>
                  <TableCell>{policy.insurance_company}</TableCell>
                  <TableCell className="font-mono text-sm">{policy.policy_number}</TableCell>
                  <TableCell className="capitalize">{policy.policy_type?.replace('_', ' ')}</TableCell>
                  <TableCell>{policy.coverage_amount?.toLocaleString()} MAD</TableCell>
                  <TableCell>{policy.premium_amount?.toLocaleString()} MAD</TableCell>
                  <TableCell>
                    <p className="text-sm">{new Date(policy.start_date).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">to {new Date(policy.end_date).toLocaleDateString()}</p>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[policy.status] || 'bg-gray-100 text-gray-800'}`}>
                      {policy.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
