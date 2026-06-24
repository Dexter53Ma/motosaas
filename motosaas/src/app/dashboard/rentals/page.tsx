'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { Search, Plus, Car, Clock, AlertTriangle, DollarSign, AlertCircle } from 'lucide-react'

interface Rental {
  id: string
  customer_id: string
  vehicle_id: string
  start_date: string
  end_date: string
  actual_return_date: string | null
  daily_rate: number
  total_amount: number
  late_fee: number
  status: string
  created_at: string
  customers: {
    full_name: string
    phone: string
  }
  vehicles: {
    make: string
    model: string
    year: number
    license_plate: string
  }
}

export default function RentalsPage() {
  const { t } = useI18n()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [tenantId, setTenantId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (userData) setTenantId(userData.tenant_id)
    }
    init()
  }, [supabase])

  useEffect(() => {
    if (!tenantId) return

    const getRentals = async () => {
      let query = supabase
        .from('rentals')
        .select('*, customers(full_name, phone), vehicles(make, model, year, license_plate)')
        .eq('tenant_id', tenantId)

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // Apply search
      if (search) {
        query = query.or(`customers.full_name.ilike.%${search}%,vehicles.license_plate.ilike.%${search}%`)
      }

      query = query.order('created_at', { ascending: false })

      const { data } = await query
      if (data) {
        setRentals(data as Rental[])
      }
      setLoading(false)
    }

    getRentals()
  }, [supabase, search, statusFilter, tenantId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
      case 'completed': return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      case 'overdue': return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'cancelled': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const getRentalStats = () => {
    const total = rentals.length
    const active = rentals.filter(r => r.status === 'active').length
    const overdue = rentals.filter(r => r.status === 'overdue').length
    const totalRevenue = rentals.reduce((sum, r) => sum + (r.total_amount || 0), 0)
    const totalLateFees = rentals.reduce((sum, r) => sum + (r.late_fee || 0), 0)
    return { total, active, overdue, totalRevenue, totalLateFees }
  }

  const stats = getRentalStats()

  // Check for overdue rentals
  useEffect(() => {
    if (!tenantId) return

    const checkOverdueRentals = async () => {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from('rentals')
        .update({ status: 'overdue' })
        .lt('end_date', now)
        .eq('status', 'active')
        .eq('tenant_id', tenantId)
        .select()

      if (data && data.length > 0) {
        // Refresh the list
        setRentals(prev => prev.map(r =>
          data.find((d: Rental) => d.id === r.id) ? { ...r, status: 'overdue' } : r
        ))
      }
    }

    checkOverdueRentals()
  }, [supabase, tenantId])

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('rentals.title')}</h1>
            <p className="text-gray-600">{t('rentals.manage')}</p>
          </div>
          <Link href="/dashboard/rentals/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              {t('rentals.add')}
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Car className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('common.total')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('rentals.active')}</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('rentals.overdue')}</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('dashboard.revenue')}</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalRevenue.toLocaleString()} MAD</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('rentals.late_fees')}</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.totalLateFees.toLocaleString()} MAD</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('rentals.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 px-4 border border-emerald-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm"
                >
                  <option value="all">{t('rentals.all_status')}</option>
                  <option value="active">{t('rentals.active')}</option>
                  <option value="completed">{t('rentals.completed')}</option>
                  <option value="overdue">{t('rentals.overdue')}</option>
                  <option value="cancelled">{t('rentals.cancelled')}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rental list */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </CardContent>
          </Card>
        ) : rentals.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('rentals.no_rentals')}</h3>
              <p className="text-gray-500 mb-4">{t('rentals.empty_state')}</p>
              <Link href="/dashboard/rentals/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Rental
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.customer')}</TableHead>
                  <TableHead>{t('common.vehicle')}</TableHead>
                  <TableHead>{t('rentals.dates')}</TableHead>
                  <TableHead>{t('common.amount')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentals.map((rental) => (
                  <TableRow key={rental.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {rental.customers?.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {rental.customers?.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {rental.vehicles?.year} {rental.vehicles?.make} {rental.vehicles?.model}
                      </div>
                      <div className="text-sm text-gray-500">
                        {rental.vehicles?.license_plate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                      </div>
                      {rental.actual_return_date && (
                        <div className="text-sm text-gray-500">
                          Returned: {new Date(rental.actual_return_date).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {rental.total_amount.toLocaleString()} MAD
                      </div>
                      {rental.late_fee > 0 && (
                        <div className="text-sm text-red-600">
                          +{rental.late_fee.toLocaleString()} MAD late
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(getStatusColor(rental.status))}
                      >
                        {rental.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/rentals/${rental.id}`}>
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                          {t('common.view')}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
