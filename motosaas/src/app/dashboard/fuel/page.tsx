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
import { Fuel, Plus, TrendingUp, BarChart3, Droplet } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface FuelEntry {
  id: string
  vehicle_id: string
  fuel_date: string
  liters: number
  cost_per_liter: number
  total_cost: number
  odometer_reading: number
  fuel_type: string
  station_name: string | null
  vehicles: { make: string; model: string; year: number; license_plate: string }
}

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  license_plate: string
}

const FUEL_TYPES = ['gasoline', 'diesel', 'lpg', 'electric']

export default function FuelPage() {
  const { t } = useI18n()
  const [entries, setEntries] = useState<FuelEntry[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const [form, setForm] = useState({
    vehicle_id: '',
    fuel_date: new Date().toISOString().split('T')[0],
    liters: '',
    cost_per_liter: '',
    total_cost: '',
    odometer_reading: '',
    fuel_type: 'gasoline',
    station_name: '',
  })

  useEffect(() => {
    fetchEntries()
    fetchVehicles()
  }, [])

  async function fetchEntries() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    const { data } = await supabase
      .from('fuel_entries')
      .select('*, vehicles(make, model, year, license_plate)')
      .eq('tenant_id', userData.tenant_id)
      .order('fuel_date', { ascending: false })

    if (data) setEntries(data)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) return

    const { error } = await supabase.from('fuel_entries').insert({
      tenant_id: userData.tenant_id,
      vehicle_id: form.vehicle_id,
      fuel_date: form.fuel_date,
      liters: parseFloat(form.liters),
      cost_per_liter: parseFloat(form.cost_per_liter),
      total_cost: parseFloat(form.total_cost),
      odometer_reading: parseInt(form.odometer_reading),
      fuel_type: form.fuel_type,
      station_name: form.station_name || null,
    })

    if (!error) {
      setDialogOpen(false)
      setForm({ vehicle_id: '', fuel_date: new Date().toISOString().split('T')[0], liters: '', cost_per_liter: '', total_cost: '', odometer_reading: '', fuel_type: 'gasoline', station_name: '' })
      toast.success('Fuel entry added successfully!')
      fetchEntries()
    } else {
      toast.error('Failed to add fuel entry')
    }
    setSubmitting(false)
  }

  const filtered = entries.filter(e => {
    const matchSearch = !search ||
      e.vehicles?.make?.toLowerCase().includes(search.toLowerCase()) ||
      e.vehicles?.license_plate?.toLowerCase().includes(search.toLowerCase()) ||
      e.station_name?.toLowerCase().includes(search.toLowerCase())
    const matchVehicle = vehicleFilter === 'all' || e.vehicle_id === vehicleFilter
    return matchSearch && matchVehicle
  })

  const stats = {
    totalEntries: entries.length,
    totalSpend: entries.reduce((s, e) => s + (e.total_cost || 0), 0),
    totalLiters: entries.reduce((s, e) => s + (e.liters || 0), 0),
    avgCostPerLiter: entries.length > 0
      ? entries.reduce((s, e) => s + (e.cost_per_liter || 0), 0) / entries.length
      : 0,
  }

  const vehicleStats = vehicles.map(v => {
    const vEntries = entries.filter(e => e.vehicle_id === v.id)
    const totalCost = vEntries.reduce((s, e) => s + (e.total_cost || 0), 0)
    const totalLiters = vEntries.reduce((s, e) => s + (e.liters || 0), 0)
    const avgConsumption = totalLiters > 0 ? totalCost / totalLiters : 0
    return { vehicle: v, totalCost, totalLiters, avgConsumption, count: vEntries.length }
  }).filter(v => v.count > 0).sort((a, b) => b.totalCost - a.totalCost)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fuel Tracking</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track fuel expenses per vehicle</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/25" />}>
            <Plus className="w-4 h-4" />
            Add Fuel Entry
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Fuel Entry</DialogTitle>
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
                  <Label>Fuel Date</Label>
                  <Input type="date" value={form.fuel_date} onChange={(e) => setForm({ ...form, fuel_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Liters</Label>
                  <Input type="number" step="0.01" value={form.liters} onChange={(e) => {
                    const liters = e.target.value
                    setForm({ ...form, liters, total_cost: form.cost_per_liter ? (parseFloat(liters) * parseFloat(form.cost_per_liter)).toFixed(2) : form.total_cost })
                  }} required />
                </div>
                <div className="space-y-2">
                  <Label>Cost per Liter (MAD)</Label>
                  <Input type="number" step="0.01" value={form.cost_per_liter} onChange={(e) => {
                    const cost = e.target.value
                    setForm({ ...form, cost_per_liter: cost, total_cost: form.liters ? (parseFloat(form.liters) * parseFloat(cost)).toFixed(2) : form.total_cost })
                  }} required />
                </div>
                <div className="space-y-2">
                  <Label>Total Cost (MAD)</Label>
                  <Input type="number" step="0.01" value={form.total_cost} onChange={(e) => setForm({ ...form, total_cost: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Odometer Reading (km)</Label>
                  <Input type="number" value={form.odometer_reading} onChange={(e) => setForm({ ...form, odometer_reading: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Fuel Type</Label>
                  <Select value={form.fuel_type} onValueChange={(v) => v !== null && setForm({ ...form, fuel_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FUEL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Station Name</Label>
                  <Input value={form.station_name} onChange={(e) => setForm({ ...form, station_name: e.target.value })} placeholder="Optional" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Add Entry'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-emerald-300 shadow-sm">
          <CardContent className="py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Entries</p>
            <p className="text-xl font-bold mt-1 text-emerald-600">{stats.totalEntries}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-300 shadow-sm">
          <CardContent className="py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Spend</p>
            <p className="text-xl font-bold mt-1 text-amber-600">{stats.totalSpend.toLocaleString()} MAD</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-blue-300 shadow-sm">
          <CardContent className="py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Liters</p>
            <p className="text-xl font-bold mt-1 text-blue-600">{stats.totalLiters.toLocaleString()} L</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-300 shadow-sm">
          <CardContent className="py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Cost/Liter</p>
            <p className="text-xl font-bold mt-1 text-purple-600">{stats.avgCostPerLiter.toFixed(2)} MAD</p>
          </CardContent>
        </Card>
      </div>

      {vehicleStats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Fuel Cost by Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vehicleStats.map((vs) => (
                <div key={vs.vehicle.id} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{vs.vehicle.year} {vs.vehicle.make} {vs.vehicle.model}</p>
                    <p className="text-xs text-muted-foreground">{vs.count} fill-ups</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600">{vs.totalCost.toLocaleString()} MAD</p>
                    <p className="text-xs text-muted-foreground">{vs.totalLiters.toLocaleString()} L ({vs.avgConsumption.toFixed(2)} MAD/L)</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by vehicle or station..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-gray-50 border-gray-200 rounded-xl"
            />
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            >
              <option value="all">All Vehicles</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
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
            <Fuel className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No fuel entries yet</h3>
            <p className="text-muted-foreground mb-5 text-sm">Track fuel expenses for your fleet here</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1a1b2e] hover:bg-[#1a1b2e]">
                <TableHead className="text-white">Vehicle</TableHead>
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white">Liters</TableHead>
                <TableHead className="text-white">Cost/L</TableHead>
                <TableHead className="text-white">Total</TableHead>
                <TableHead className="text-white">Odometer</TableHead>
                <TableHead className="text-white">Type</TableHead>
                <TableHead className="text-white">Station</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-gray-50">
                  <TableCell>
                    <p className="font-medium">{entry.vehicles?.year} {entry.vehicles?.make} {entry.vehicles?.model}</p>
                    <p className="text-xs text-muted-foreground">{entry.vehicles?.license_plate}</p>
                  </TableCell>
                  <TableCell>{new Date(entry.fuel_date).toLocaleDateString()}</TableCell>
                  <TableCell>{entry.liters} L</TableCell>
                  <TableCell>{entry.cost_per_liter?.toFixed(2)} MAD</TableCell>
                  <TableCell className="font-medium text-amber-600">{entry.total_cost?.toLocaleString()} MAD</TableCell>
                  <TableCell className="font-mono text-sm">{entry.odometer_reading?.toLocaleString()} km</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">{entry.fuel_type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.station_name || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
