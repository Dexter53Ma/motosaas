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
import { Landmark, Plus, TrendingDown, Calendar, AlertCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface Loan {
  id: string
  vehicle_id: string
  lender_name: string
  loan_amount: number
  monthly_payment: number
  interest_rate: number
  start_date: string
  end_date: string
  remaining_balance: number
  status: string
  vehicles: {
    make: string
    model: string
    year: number
    license_plate: string
  }
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
  paid_off: 'bg-blue-100 text-blue-800',
  defaulted: 'bg-red-100 text-red-800',
}

export default function LoansPage() {
  const { t } = useI18n()
  const [loans, setLoans] = useState<Loan[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const [form, setForm] = useState({
    vehicle_id: '',
    lender_name: '',
    loan_amount: '',
    monthly_payment: '',
    interest_rate: '',
    start_date: '',
    end_date: '',
    remaining_balance: '',
    status: 'active',
  })

  useEffect(() => {
    fetchLoans()
    fetchVehicles()
  }, [])

  async function fetchLoans() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    const { data } = await supabase
      .from('loans')
      .select('*, vehicles(make, model, year, license_plate)')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false })

    if (data) setLoans(data)
    setLoading(false)
  }

  async function fetchVehicles() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) return

    const { data } = await supabase
      .from('vehicles')
      .select('id, make, model, year, license_plate')
      .eq('tenant_id', userData.tenant_id)
      .order('make')

    if (data) setVehicles(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) return

    const { error } = await supabase.from('loans').insert({
      tenant_id: userData.tenant_id,
      vehicle_id: form.vehicle_id,
      lender_name: form.lender_name,
      loan_amount: parseFloat(form.loan_amount),
      monthly_payment: parseFloat(form.monthly_payment),
      interest_rate: parseFloat(form.interest_rate),
      start_date: form.start_date,
      end_date: form.end_date,
      remaining_balance: parseFloat(form.remaining_balance || form.loan_amount),
      status: form.status,
    })

    if (!error) {
      setDialogOpen(false)
      setForm({ vehicle_id: '', lender_name: '', loan_amount: '', monthly_payment: '', interest_rate: '', start_date: '', end_date: '', remaining_balance: '', status: 'active' })
      toast.success('Loan added successfully!')
      fetchLoans()
    } else {
      toast.error('Failed to add loan')
    }
    setSubmitting(false)
  }

  const filtered = loans.filter(loan => {
    const matchSearch = !search ||
      loan.lender_name?.toLowerCase().includes(search.toLowerCase()) ||
      loan.vehicles?.make?.toLowerCase().includes(search.toLowerCase()) ||
      loan.vehicles?.model?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || loan.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: loans.length,
    active: loans.filter(l => l.status === 'active').length,
    totalOutstanding: loans.filter(l => l.status === 'active').reduce((s, l) => s + (l.remaining_balance || 0), 0),
    monthlyPayments: loans.filter(l => l.status === 'active').reduce((s, l) => s + (l.monthly_payment || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Loan Tracking</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track vehicle purchase loans from banks</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/25" />}>
            <Plus className="w-4 h-4" />
            Add Loan
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Loan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <Select value={form.vehicle_id} onValueChange={(v) => v !== null && setForm({ ...form, vehicle_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.year} {v.make} {v.model} ({v.license_plate})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lender Name</Label>
                  <Input value={form.lender_name} onChange={(e) => setForm({ ...form, lender_name: e.target.value })} placeholder="Bank name" required />
                </div>
                <div className="space-y-2">
                  <Label>Loan Amount (MAD)</Label>
                  <Input type="number" value={form.loan_amount} onChange={(e) => setForm({ ...form, loan_amount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Payment (MAD)</Label>
                  <Input type="number" value={form.monthly_payment} onChange={(e) => setForm({ ...form, monthly_payment: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input type="number" step="0.1" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Remaining Balance (MAD)</Label>
                  <Input type="number" value={form.remaining_balance} onChange={(e) => setForm({ ...form, remaining_balance: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Add Loan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-emerald-300 shadow-sm">
          <CardContent className="py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Loans</p>
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
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outstanding</p>
            <p className="text-xl font-bold mt-1 text-amber-600">{stats.totalOutstanding.toLocaleString()} MAD</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-300 shadow-sm">
          <CardContent className="py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly Payments</p>
            <p className="text-xl font-bold mt-1 text-purple-600">{stats.monthlyPayments.toLocaleString()} MAD</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search by lender or vehicle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-50 border-gray-200 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paid_off">Paid Off</option>
              <option value="defaulted">Defaulted</option>
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
            <Landmark className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No loans yet</h3>
            <p className="text-muted-foreground mb-5 text-sm">Track your vehicle purchase loans here</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1a1b2e] hover:bg-[#1a1b2e]">
                <TableHead className="text-white">Vehicle</TableHead>
                <TableHead className="text-white">Lender</TableHead>
                <TableHead className="text-white">Loan Amount</TableHead>
                <TableHead className="text-white">Monthly</TableHead>
                <TableHead className="text-white">Remaining</TableHead>
                <TableHead className="text-white">Rate</TableHead>
                <TableHead className="text-white">Period</TableHead>
                <TableHead className="text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((loan) => (
                <TableRow key={loan.id} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell>
                    <p className="font-medium">{loan.vehicles?.year} {loan.vehicles?.make} {loan.vehicles?.model}</p>
                    <p className="text-xs text-muted-foreground">{loan.vehicles?.license_plate}</p>
                  </TableCell>
                  <TableCell>{loan.lender_name}</TableCell>
                  <TableCell className="font-medium">{loan.loan_amount?.toLocaleString()} MAD</TableCell>
                  <TableCell>{loan.monthly_payment?.toLocaleString()} MAD</TableCell>
                  <TableCell className="font-medium text-amber-600">{loan.remaining_balance?.toLocaleString()} MAD</TableCell>
                  <TableCell>{loan.interest_rate}%</TableCell>
                  <TableCell>
                    <p className="text-sm">{new Date(loan.start_date).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">to {new Date(loan.end_date).toLocaleDateString()}</p>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[loan.status] || 'bg-gray-100 text-gray-800'}`}>
                      {loan.status.replace('_', ' ')}
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
