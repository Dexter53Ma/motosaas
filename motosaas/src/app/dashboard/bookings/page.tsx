'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Car, Plus, Users, Calendar, DollarSign, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  license_plate: string
  daily_rate: number
  status: string
}

interface Customer {
  id: string
  full_name: string
  phone: string
}

interface BookingItem {
  vehicle_id: string
  daily_rate: number
}

interface GroupBooking {
  id: string
  customer_id: string
  start_date: string
  end_date: string
  total_amount: number
  discount_percent: number
  status: string
  created_at: string
  customers: { full_name: string; phone: string }
  group_booking_items: { vehicle_id: string; daily_rate: number; vehicles: { make: string; model: string; year: number; license_plate: string } }[]
}

export default function BookingsPage() {
  const { t } = useI18n()
  const [bookings, setBookings] = useState<GroupBooking[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [form, setForm] = useState({
    customer_id: '',
    start_date: '',
    end_date: '',
    discount_percent: '0',
    vehicles: [] as BookingItem[],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    const [bookingsData, vehiclesData, customersData] = await Promise.all([
      supabase.from('group_bookings')
        .select('*, customers(full_name, phone), group_booking_items(*, vehicles(make, model, year, license_plate))')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false }),
      supabase.from('vehicles')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .eq('status', 'available'),
      supabase.from('customers')
        .select('id, full_name, phone')
        .eq('tenant_id', userData.tenant_id),
    ])

    if (bookingsData.data) setBookings(bookingsData.data)
    if (vehiclesData.data) setVehicles(vehiclesData.data)
    if (customersData.data) setCustomers(customersData.data)
    setLoading(false)
  }

  function addVehicle() {
    setForm({ ...form, vehicles: [...form.vehicles, { vehicle_id: '', daily_rate: 0 }] })
  }

  function removeVehicle(index: number) {
    const vehicles = [...form.vehicles]
    vehicles.splice(index, 1)
    setForm({ ...form, vehicles })
  }

  function updateVehicle(index: number, field: string, value: any) {
    const vehicles = [...form.vehicles]
    if (field === 'vehicle_id') {
      const v = vehicles.find(v => v.vehicle_id === value)
      vehicles[index] = { ...vehicles[index], vehicle_id: value, daily_rate: v?.daily_rate || 0 }
    } else {
      vehicles[index] = { ...vehicles[index], [field]: value }
    }
    setForm({ ...form, vehicles })
  }

  function calculateTotal() {
    if (!form.start_date || !form.end_date) return 0
    const days = Math.max(1, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / (1000 * 60 * 60 * 24)))
    const subtotal = form.vehicles.reduce((sum, v) => sum + (v.daily_rate * days), 0)
    const discount = subtotal * (parseFloat(form.discount_percent) / 100)
    return subtotal - discount
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) throw new Error('No tenant found')

      if (form.vehicles.length < 2) throw new Error('Select at least 2 vehicles for a group booking')

      const days = Math.max(1, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / (1000 * 60 * 60 * 24)))
      const total = calculateTotal()

      const { data: booking, error: bookingError } = await supabase
        .from('group_bookings')
        .insert({
          tenant_id: userData.tenant_id,
          customer_id: form.customer_id,
          start_date: form.start_date,
          end_date: form.end_date,
          total_amount: total,
          discount_percent: parseFloat(form.discount_percent) || 0,
          status: 'confirmed',
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      const items = form.vehicles.map(v => ({
        group_booking_id: booking.id,
        vehicle_id: v.vehicle_id,
        daily_rate: v.daily_rate,
      }))

      const { error: itemsError } = await supabase.from('group_booking_items').insert(items)
      if (itemsError) throw itemsError

      setDialogOpen(false)
      setForm({ customer_id: '', start_date: '', end_date: '', discount_percent: '0', vehicles: [] })
      toast.success('Group booking created successfully!')
      await fetchData()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to create booking')
    } finally {
      setSaving(false)
    }
  }

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    totalRevenue: bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
  }

  const filtered = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (search) {
      const name = b.customers?.full_name || ''
      if (!name.toLowerCase().includes(search.toLowerCase())) return false
    }
    return true
  })

  const STATUS_COLORS: Record<string, string> = {
    confirmed: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Multi-Vehicle Bookings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Group rentals for multiple vehicles</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/25" />}>
            <Plus className="w-4 h-4" />
            New Group Booking
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Group Booking</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}

              <div className="space-y-2">
                <Label>Customer</Label>
                <select
                  required
                  value={form.customer_id}
                  onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="">Select customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} â€” {c.phone}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Group Discount (%)</Label>
                <Input type="number" min="0" max="50" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} />
              </div>

              {/* Vehicles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Vehicles ({form.vehicles.length})</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addVehicle}>
                    <Plus className="w-3 h-3" /> Add Vehicle
                  </Button>
                </div>

                {form.vehicles.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <select
                      required
                      value={item.vehicle_id}
                      onChange={(e) => updateVehicle(index, 'vehicle_id', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="">Select vehicle</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} â€” {v.daily_rate} MAD/day</option>
                      ))}
                    </select>
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                      {item.daily_rate} MAD/day
                    </span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeVehicle(index)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {form.vehicles.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Click "Add Vehicle" to start</p>
                )}
              </div>

              {/* Total */}
              {form.vehicles.length > 0 && form.start_date && form.end_date && (
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>{form.vehicles.length} vehicles Ã— {Math.max(1, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / (1000 * 60 * 60 * 24)))} days</span>
                    <span>{form.vehicles.reduce((s, v) => s + v.daily_rate, 0)} MAD/day</span>
                  </div>
                  {parseFloat(form.discount_percent) > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 mb-1">
                      <span>Discount ({form.discount_percent}%)</span>
                      <span>-{(form.vehicles.reduce((s, v) => s + v.daily_rate, 0) * Math.max(1, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / (1000 * 60 * 60 * 24))) * parseFloat(form.discount_percent) / 100).toFixed(0)} MAD</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-emerald-600">{calculateTotal().toLocaleString()} MAD</span>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={saving || form.vehicles.length < 2} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                {saving ? 'Creating...' : 'Create Group Booking'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: String(stats.total), color: 'text-gray-900', border: 'border-gray-200' },
          { label: 'Confirmed', value: String(stats.confirmed), color: 'text-emerald-600', border: 'border-emerald-300' },
          { label: 'Completed', value: String(stats.completed), color: 'text-blue-600', border: 'border-blue-300' },
          { label: 'Total Revenue', value: `${stats.totalRevenue.toLocaleString()} MAD`, color: 'text-purple-600', border: 'border-purple-300' },
        ].map(s => (
          <Card key={s.label} className={`border-l-4 ${s.border} shadow-sm`}>
            <CardContent className="py-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search by customer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-50 border-gray-200"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No group bookings yet</h3>
            <p className="text-muted-foreground text-sm">Create a group booking to rent multiple vehicles at once</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => {
            const days = Math.max(1, Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)))
            return (
              <Card key={booking.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{booking.customers?.full_name || 'Unknown'}</h3>
                        <Badge className={STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-800'}>{booking.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        <Calendar className="w-3.5 h-3.5 inline mr-1" />
                        {booking.start_date} â†’ {booking.end_date} ({days} days)
                        {booking.discount_percent > 0 && (
                          <Badge variant="secondary" className="ml-2">{booking.discount_percent}% off</Badge>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{(booking.total_amount || 0).toLocaleString()} MAD</p>
                    </div>
                  </div>

                  {/* Vehicle chips */}
                  <div className="flex flex-wrap gap-2">
                    {booking.group_booking_items?.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                        <Car className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{item.vehicles?.year} {item.vehicles?.make} {item.vehicles?.model}</span>
                        <span className="text-muted-foreground">({item.daily_rate} MAD/day)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
