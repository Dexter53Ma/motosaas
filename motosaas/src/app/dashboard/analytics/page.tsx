'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [topVehicles, setTopVehicles] = useState<any[]>([])
  const [topCustomers, setTopCustomers] = useState<any[]>([])
  const [revenueByMethod, setRevenueByMethod] = useState<any[]>([])
  const [rentalStatus, setRentalStatus] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const supabase = createClient()

  useEffect(() => { fetchAnalytics() }, [dateRange])

  async function fetchAnalytics() {
    setLoading(true)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))

    const { data: analyticsData } = await supabase.rpc('get_analytics_summary', {
      p_start_date: startDate.toISOString(),
      p_end_date: new Date().toISOString(),
    })

    if (analyticsData) setAnalytics(analyticsData)

    const { data: vehiclesData } = await supabase
      .from('top_vehicles_view')
      .select('*')
      .limit(5)

    if (vehiclesData) setTopVehicles(vehiclesData)

    const { data: customersData } = await supabase
      .from('top_customers_view')
      .select('*')
      .limit(5)

    if (customersData) setTopCustomers(customersData)

    const { data: methodData } = await supabase
      .from('revenue_by_payment_method_view')
      .select('*')

    if (methodData) setRevenueByMethod(methodData)

    const { data: statusData } = await supabase
      .from('rental_status_distribution_view')
      .select('*')

    if (statusData) setRentalStatus(statusData)

    setLoading(false)
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
              <h1 className="text-lg font-medium">Analytics</h1>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              {analytics?.revenue?.total?.toLocaleString() || 0} MAD
            </p>
            <p className="text-sm text-gray-500">
              {analytics?.revenue?.count || 0} transactions
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Active Rentals</p>
            <p className="text-2xl font-bold text-blue-600">
              {analytics?.rentals?.active || 0}
            </p>
            <p className="text-sm text-gray-500">
              {analytics?.rentals?.total || 0} total
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Vehicles</p>
            <p className="text-2xl font-bold">{analytics?.vehicles?.total || 0}</p>
            <p className="text-sm text-gray-500">
              {analytics?.vehicles?.rented || 0} currently rented
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="text-2xl font-bold">{analytics?.customers?.total || 0}</p>
            <p className="text-sm text-gray-500">
              {analytics?.customers?.new || 0} new
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue by Payment Method */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-4">Revenue by Payment Method</h3>
            <div className="space-y-3">
              {revenueByMethod.map((method) => (
                <div key={method.payment_method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="capitalize">{method.payment_method?.replace('_', ' ')}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{method.total_amount?.toLocaleString()} MAD</p>
                    <p className="text-sm text-gray-500">{method.transaction_count} transactions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rental Status Distribution */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-4">Rental Status Distribution</h3>
            <div className="space-y-3">
              {rentalStatus.map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      status.status === 'active' ? 'bg-green-500' :
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Vehicles */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-medium">Top Performing Vehicles</h3>
            </div>
            <div className="divide-y">
              {topVehicles.map((vehicle, index) => (
                <div key={vehicle.vehicle_id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">{index + 1}</span>
                      <div>
                        <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                        <p className="text-sm text-gray-500">{vehicle.license_plate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{vehicle.total_revenue?.toLocaleString()} MAD</p>
                      <p className="text-sm text-gray-500">{vehicle.rental_count} rentals</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-medium">Top Customers</h3>
            </div>
            <div className="divide-y">
              {topCustomers.map((customer, index) => (
                <div key={customer.customer_id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">{index + 1}</span>
                      <div>
                        <p className="font-medium">{customer.full_name}</p>
                        <p className="text-sm text-gray-500">{customer.email || customer.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{customer.lifetime_value?.toLocaleString()} MAD</p>
                      <p className="text-sm text-gray-500">{customer.rental_count} rentals</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}