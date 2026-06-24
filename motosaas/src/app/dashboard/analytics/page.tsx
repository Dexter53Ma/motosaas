'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { DollarSign, Car, Users, TrendingUp } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function AnalyticsPage() {
  const { t } = useI18n()
  const [analytics, setAnalytics] = useState<any>(null)
  const [topVehicles, setTopVehicles] = useState<any[]>([])
  const [topCustomers, setTopCustomers] = useState<any[]>([])
  const [revenueByMethod, setRevenueByMethod] = useState<any[]>([])
  const [rentalStatus, setRentalStatus] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData?.tenant_id) { setLoading(false); return }
      await fetchAnalytics(userData.tenant_id)
    }
    init()
  }, [dateRange])

  async function fetchAnalytics(tid: string) {
    setLoading(true)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))

    const { data: analyticsData } = await supabase.rpc('get_analytics_summary', {
      p_tenant_id: tid,
      p_start_date: startDate.toISOString(),
      p_end_date: new Date().toISOString(),
    })

    if (analyticsData) setAnalytics(analyticsData)

    const { data: vehiclesData } = await supabase
      .from('top_vehicles_view')
      .select('*')
      .eq('tenant_id', tid)
      .limit(5)

    if (vehiclesData) setTopVehicles(vehiclesData)

    const { data: customersData } = await supabase
      .from('top_customers_view')
      .select('*')
      .eq('tenant_id', tid)
      .limit(5)

    if (customersData) setTopCustomers(customersData)

    const { data: methodData } = await supabase
      .from('revenue_by_payment_method_view')
      .select('*')
      .eq('tenant_id', tid)

    if (methodData) setRevenueByMethod(methodData)

    const { data: statusData } = await supabase
      .from('rental_status_distribution_view')
      .select('*')
      .eq('tenant_id', tid)

    if (statusData) setRentalStatus(statusData)

    setLoading(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">{t('common.loading')}</div>
  }

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.analytics')}</h1>
          <p className="text-gray-600">{t('reports.desc')}</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <DollarSign className="size-4" />
              <p className="text-sm">{t('reports.total_revenue')}</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {analytics?.revenue?.total?.toLocaleString() || 0} MAD
            </p>
            <p className="text-sm text-gray-500">
              {analytics?.revenue?.count || 0} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <TrendingUp className="size-4" />
              <p className="text-sm">{t('dashboard.active_rentals')}</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {analytics?.rentals?.active || 0}
            </p>
            <p className="text-sm text-gray-500">
              {analytics?.rentals?.total || 0} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Car className="size-4" />
              <p className="text-sm">{t('dashboard.total_vehicles')}</p>
            </div>
            <p className="text-2xl font-bold">{analytics?.vehicles?.total || 0}</p>
            <p className="text-sm text-gray-500">
              {analytics?.vehicles?.rented || 0} currently rented
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users className="size-4" />
              <p className="text-sm">{t('dashboard.customers_count')}</p>
            </div>
            <p className="text-2xl font-bold">{analytics?.customers?.total || 0}</p>
            <p className="text-sm text-gray-500">
              {analytics?.customers?.new || 0} new
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.payment_methods')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenueByMethod.map((method) => (
                <div key={method.payment_method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="capitalize">{method.payment_method?.replace('_', ' ')}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{method.total_amount?.toLocaleString()} MAD</p>
                    <p className="text-sm text-gray-500">{method.transaction_count} transactions</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('reports.rental_status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rentalStatus.map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      status.status === 'active' ? 'bg-emerald-500' :
                      status.status === 'completed' ? 'bg-blue-500' :
                      status.status === 'overdue' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="capitalize">{status.status}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{status.count}</p>
                    <p className="text-sm text-gray-500">{status.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.top_5_vehicles')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topVehicles.map((vehicle, index) => (
                <div key={vehicle.vehicle_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">{index + 1}</span>
                    <div>
                      <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                      <p className="text-sm text-gray-500">{vehicle.license_plate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-emerald-600">{vehicle.total_revenue?.toLocaleString()} MAD</p>
                    <p className="text-sm text-gray-500">{vehicle.rental_count} rentals</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('reports.customer_analytics')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={customer.customer_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">{index + 1}</span>
                    <div>
                      <p className="font-medium">{customer.full_name}</p>
                      <p className="text-sm text-gray-500">{customer.email || customer.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-emerald-600">{customer.lifetime_value?.toLocaleString()} MAD</p>
                    <p className="text-sm text-gray-500">{customer.rental_count} rentals</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
