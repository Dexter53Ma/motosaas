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
import { Shield, Plus, DollarSign, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface Deposit {
  id: string
  customer_id: string
  rental_id: string
  amount: number
  deposit_date: string
  return_date: string | null
  deduction_reason: string | null
  refund_amount: number | null
  status: string
  customers: { full_name: string; phone: string }
  rentals: { vehicles: { make: string; model: string; year: number; license_plate: string } }
}

interface Customer {
  id: string
  full_name: string
}

interface Rental {
  id: string
  customer_id: string
  vehicles: any
}

const STATUS_COLORS: Record<string, string> = {
  held: 'bg-amber-100 text-amber-800',
  partially_refunded: 'bg-blue-100 text-blue-800',
  fully_refunded: 'bg-emerald-100 text-emerald-800',
}

export default function DepositsPage() {
  const { t } = useI18n()
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const [form, setForm] = useState({
    customer_id: '',
    rental_id: '',
    amount: '',
    deposit_date: new Date().toISOString().split('T')[0],
    return_date: '',
    deduction_reason: '',
    refund_amount: '',
    status: 'held',
  })

  useEffect(() => {
    fetchDeposits()
    fetchCustomers()
    fetchRentals()
  }, [])

  async function fetchDeposits() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    const { data } = await supabase
      .from('deposits')
      .select('*, customers(full_name, phone), rentals(vehicles(make, model, year, license_plate))')
      .eq('tenant_id', userData.tenant_id)
      .order('deposit_date', { ascending: false })

    if (data) setDeposits(data)
    setLoading(false)
  }

  async function fetchCustomers() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) return
    const { data } = await supabase.from('customers').select('id, full_name').eq('tenant_id', userData.tenant_id)
    if (data) setCustomers(data)
  }

  async function fetchRentals() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) return
    const { data } = await supabase
      .from('rentals')
      .select('id, customer_id, vehicles(make, model, year)')
      .eq('tenant_id', userData.tenant_id)
      .eq('status', 'active')
    if (data) setRentals(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) return

    const { error } = await supabase.from('deposits').insert({
      tenant_id: userData.tenant_id,
      customer_id: form.customer_id,
      rental_id: form.rental_id,
      amount: parseFloat(form.amount),
      deposit_date: form.deposit_date,
      return_date: form.return_date || null,
      deduction_reason: form.deduction_reason || null,
      refund_amount: form.refund_amount ? parseFloat(form.refund_amount) : null,
      status: form.status,
    })

    if (!error) {
      setDialogOpen(false)
      setForm({ customer_id: '', rental_id: '', amount: '', deposit_date: new Date().toISOString().split('T')[0], return_date: '', deduction_reason: '', refund_amount: '', status: 'held' })
      toast.success('Deposit recorded successfully!')
      fetchDeposits()
    } else {
      toast.error('Failed to record deposit')
    }
    setSubmitting(false)
  }

  const filtered = deposits.filter(d => {
    const matchSearch = !search ||
      d.customers?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.rentals?.vehicles?.license_plate?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: deposits.length,
    held: deposits.filter(d => d.status === 'held').length,
    totalHeld: deposits.filter(d => d.status === 'held').reduce((s, d) => s + (d.amount || 0), 0),
    pendingRefunds: deposits.filter(d => d.status === 'held').reduce((s, d) => s + (d.amount || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deposit Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track security deposits from customers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/25" />}>
            <Plus className="w-4 h-4" />
            Add Deposit
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Deposit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={form.customer_id} onValueChange={(v) => v !== null && setForm({ ...form, customer_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rental</Label>
                  <Select value={form.rental_id} onValueChange={(v) => v !== null && setForm({ ...form, rental_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select rental" /></SelectTrigger>
                    <SelectContent>
                      {rentals.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.vehicles?.make} {r.vehicles?.model} ({r.id.slice(0, 8)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Deposit Amount (MAD)</Label>
                  <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Deposit Date</Label>
                  <Input type="date" value={form.deposit_date} onChange={(e) => setForm({ ...form, deposit_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Return Date</Label>
                  <Input type="date" value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Refund Amount (MAD)</Label>
                  <Input type="number" value={form.refund_amount} onChange={(e) => setForm({ ...form, refund_amount: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Deduction Reason</Label>
                  <Input value={form.deduction_reason} onChange={(e) => setForm({ ...form, deduction_reason: e.target.value })} placeholder="Reason for deduction" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Add Deposit'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-emerald-300 shadow-sm">
          <CardContent className="py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Deposits</p>
            <p className="text-xl font-bold mt-1 text-emerald-600">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-300 shadow-sm">
          <CardContent className="py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Currently Held</p>
            <p className="text-xl font-bold mt-1 text-amber-600">{stats.held}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-blue-300 shadow-sm">
          <CardContent className="py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Held (MAD)</p>
            <p className="text-xl font-bold mt-1 text-blue-600">{stats.totalHeld.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-300 shadow-sm">
          <CardContent className="py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending Refunds</p>
            <p className="text-xl font-bold mt-1 text-purple-600">{stats.pendingRefunds.toLocaleString()} MAD</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by customer or vehicle plate..."
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
              <option value="held">Held</option>
              <option value="partially_refunded">Partially Refunded</option>
              <option value="fully_refunded">Fully Refunded</option>
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
            <h3 className="text-lg font-semibold mb-2">No deposits yet</h3>
            <p className="text-muted-foreground mb-5 text-sm">Track customer security deposits here</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1a1b2e] hover:bg-[#1a1b2e]">
                <TableHead className="text-white">Customer</TableHead>
                <TableHead className="text-white">Vehicle</TableHead>
                <TableHead className="text-white">Deposit</TableHead>
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white">Refund</TableHead>
                <TableHead className="text-white">Deduction</TableHead>
                <TableHead className="text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((deposit) => (
                <TableRow key={deposit.id} className="hover:bg-gray-50">
                  <TableCell>
                    <p className="font-medium">{deposit.customers?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{deposit.customers?.phone}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{deposit.rentals?.vehicles?.year} {deposit.rentals?.vehicles?.make} {deposit.rentals?.vehicles?.model}</p>
                    <p className="text-xs text-muted-foreground">{deposit.rentals?.vehicles?.license_plate}</p>
                  </TableCell>
                  <TableCell className="font-medium">{deposit.amount?.toLocaleString()} MAD</TableCell>
                  <TableCell>
                    <p className="text-sm">{new Date(deposit.deposit_date).toLocaleDateString()}</p>
                    {deposit.return_date && (
                      <p className="text-xs text-muted-foreground">Return: {new Date(deposit.return_date).toLocaleDateString()}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-emerald-600 font-medium">
                    {deposit.refund_amount != null ? `${deposit.refund_amount.toLocaleString()} MAD` : '-'}
                  </TableCell>
                  <TableCell>
                    {deposit.deduction_reason ? (
                      <div>
                        <p className="text-sm text-red-600">{deposit.deduction_reason}</p>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[deposit.status] || 'bg-gray-100 text-gray-800'}`}>
                      {deposit.status.replace('_', ' ')}
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
