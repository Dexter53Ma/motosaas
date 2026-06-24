'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  getRevenueReport,
  getVehicleUtilizationReport,
  getCustomerAnalyticsReport,
  getMonthlyRevenue,
  getRentalStatusDistribution,
  downloadCSV,
  formatCurrency,
  type RevenueReport,
  type VehicleUtilization,
  type CustomerAnalytics,
} from '@/lib/reports'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'vehicles' | 'customers' | 'rentals'>('revenue')
  const [revenueData, setRevenueData] = useState<RevenueReport[]>([])
  const [vehicleData, setVehicleData] = useState<VehicleUtilization[]>([])
  const [customerData, setCustomerData] = useState<CustomerAnalytics[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([])
  const [rentalStatus, setRentalStatus] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [tenantId, setTenantId] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    setTenantId(userData.tenant_id)

    const [revenue, vehicles, customers, monthly, status] = await Promise.all([
      getRevenueReport(userData.tenant_id).catch(() => []),
      getVehicleUtilizationReport(userData.tenant_id).catch(() => []),
      getCustomerAnalyticsReport(userData.tenant_id).catch(() => []),
      getMonthlyRevenue(userData.tenant_id).catch(() => []),
      getRentalStatusDistribution(userData.tenant_id).catch(() => []),
    ])

    setRevenueData(revenue)
    setVehicleData(vehicles)
    setCustomerData(customers)
    setMonthlyRevenue(monthly)
    setRentalStatus(status)
    setLoading(false)
  }

  async function handleFilter() {
    if (!tenantId) return
    setLoading(true)
    const revenue = await getRevenueReport(tenantId, startDate || undefined, endDate || undefined).catch(() => [])
    setRevenueData(revenue)
    setLoading(false)
  }

  function handleExport() {
    switch (activeTab) {
      case 'revenue':
        downloadCSV(revenueData, 'revenue_report')
        break
      case 'vehicles':
        downloadCSV(vehicleData, 'vehicle_utilization')
        break
      case 'customers':
        downloadCSV(customerData, 'customer_analytics')
        break
    }
  }

  const totalRevenue = revenueData.reduce((sum, r) => sum + (r.total_revenue || 0), 0)
  const totalTransactions = revenueData.reduce((sum, r) => sum + (r.transaction_count || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
              <div className="hidden md:flex space-x-4">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Dashboard</Link>
                <Link href="/dashboard/vehicles" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Vehicles</Link>
                <Link href="/dashboard/customers" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Customers</Link>
                <Link href="/dashboard/rentals" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Rentals</Link>
                <Link href="/dashboard/payments" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Payments</Link>
                <Link href="/dashboard/reports" className="text-gray-900 font-semibold px-3 py-2 text-sm">Reports</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Business intelligence and performance metrics</p>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Export CSV
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          {(['revenue', 'vehicles', 'customers', 'rentals'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'vehicles' ? 'Vehicle Utilization' : tab === 'customers' ? 'Customer Analytics' : tab === 'rentals' ? 'Rental Stats' : 'Revenue'}
            </button>
          ))}
        </div>

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Transactions</p>
                <p className="text-2xl font-bold">{totalTransactions}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Avg Transaction</p>
                <p className="text-2xl font-bold">
                  {totalTransactions > 0 ? formatCurrency(totalRevenue / totalTransactions) : '0 MAD'}
                </p>
              </div>
            </div>

            {/* Date Filter */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <button
                  onClick={handleFilter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Monthly Revenue Chart (text-based) */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Monthly Revenue</h2>
              {monthlyRevenue.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No data available</p>
              ) : (
                <div className="space-y-2">
                  {monthlyRevenue.map((item) => {
                    const maxRevenue = Math.max(...monthlyRevenue.map(m => m.total_revenue || 0))
                    const width = maxRevenue > 0 ? ((item.total_revenue || 0) / maxRevenue) * 100 : 0
                    return (
                      <div key={item.month} className="flex items-center gap-4">
                        <span className="w-20 text-sm text-gray-600">
                          {new Date(item.month).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded h-6">
                          <div
                            className="bg-blue-500 h-6 rounded"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <span className="w-24 text-sm text-right font-medium">
                          {formatCurrency(item.total_revenue || 0)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Revenue by Day */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Daily Revenue</h2>
              {revenueData.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Date</th>
                        <th className="text-right py-2">Transactions</th>
                        <th className="text-right py-2">Cash</th>
                        <th className="text-right py-2">Card</th>
                        <th className="text-right py-2">Bank</th>
                        <th className="text-right py-2">Mobile</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueData.slice(0, 30).map((item) => (
                        <tr key={item.report_date} className="border-b hover:bg-gray-50">
                          <td className="py-2">{new Date(item.report_date).toLocaleDateString('fr-FR')}</td>
                          <td className="text-right py-2">{item.transaction_count}</td>
                          <td className="text-right py-2">{formatCurrency(item.cash_revenue || 0)}</td>
                          <td className="text-right py-2">{formatCurrency(item.card_revenue || 0)}</td>
                          <td className="text-right py-2">{formatCurrency(item.bank_transfer_revenue || 0)}</td>
                          <td className="text-right py-2">{formatCurrency(item.mobile_money_revenue || 0)}</td>
                          <td className="text-right py-2 font-medium">{formatCurrency(item.total_revenue || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vehicles Tab */}
        {activeTab === 'vehicles' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Total Vehicles</p>
                <p className="text-2xl font-bold">{vehicleData.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Avg Utilization</p>
                <p className="text-2xl font-bold">
                  {vehicleData.length > 0
                    ? `${(vehicleData.reduce((s, v) => s + (v.utilization_rate || 0), 0) / vehicleData.length).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Total Vehicle Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(vehicleData.reduce((s, v) => s + (v.total_revenue || 0), 0))}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Vehicle Utilization</h2>
              {vehicleData.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No vehicles found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Vehicle</th>
                        <th className="text-left py-2">Plate</th>
                        <th className="text-right py-2">Rentals</th>
                        <th className="text-right py-2">Days Rented</th>
                        <th className="text-right py-2">Utilization</th>
                        <th className="text-right py-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicleData.map((vehicle) => (
                        <tr key={vehicle.vehicle_id} className="border-b hover:bg-gray-50">
                          <td className="py-2">{vehicle.make} {vehicle.model} ({vehicle.year})</td>
                          <td className="py-2 text-gray-600">{vehicle.license_plate}</td>
                          <td className="text-right py-2">{vehicle.total_rentals}</td>
                          <td className="text-right py-2">{vehicle.days_rented?.toFixed(0) || 0}</td>
                          <td className="text-right py-2">
                            <span className={`px-2 py-1 rounded text-sm ${
                              (vehicle.utilization_rate || 0) > 70 ? 'bg-green-100 text-green-800' :
                              (vehicle.utilization_rate || 0) > 30 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {vehicle.utilization_rate?.toFixed(1) || 0}%
                            </span>
                          </td>
                          <td className="text-right py-2 font-medium">{formatCurrency(vehicle.total_revenue || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold">{customerData.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">VIP Customers</p>
                <p className="text-2xl font-bold text-purple-600">
                  {customerData.filter(c => c.customer_segment === 'VIP').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Avg Customer Value</p>
                <p className="text-2xl font-bold">
                  {customerData.length > 0
                    ? formatCurrency(customerData.reduce((s, c) => s + (c.total_spent || 0), 0) / customerData.length)
                    : '0 MAD'}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Total Customer Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(customerData.reduce((s, c) => s + (c.total_spent || 0), 0))}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Customer Analytics</h2>
              {customerData.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No customers found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Customer</th>
                        <th className="text-left py-2">Phone</th>
                        <th className="text-right py-2">Rentals</th>
                        <th className="text-right py-2">Total Spent</th>
                        <th className="text-right py-2">Avg Value</th>
                        <th className="text-left py-2">Segment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerData.slice(0, 50).map((customer) => (
                        <tr key={customer.customer_id} className="border-b hover:bg-gray-50">
                          <td className="py-2">{customer.full_name}</td>
                          <td className="py-2 text-gray-600">{customer.phone}</td>
                          <td className="text-right py-2">{customer.total_rentals}</td>
                          <td className="text-right py-2 font-medium">{formatCurrency(customer.total_spent || 0)}</td>
                          <td className="text-right py-2">{formatCurrency(customer.avg_rental_value || 0)}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-sm ${
                              customer.customer_segment === 'VIP' ? 'bg-purple-100 text-purple-800' :
                              customer.customer_segment === 'Regular' ? 'bg-blue-100 text-blue-800' :
                              customer.customer_segment === 'New' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {customer.customer_segment}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rentals Tab */}
        {activeTab === 'rentals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Rental Status Distribution</h2>
              {rentalStatus.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No data available</p>
              ) : (
                <div className="space-y-3">
                  {rentalStatus.map((status) => {
                    const total = rentalStatus.reduce((s, r) => s + (r.count || 0), 0)
                    const percentage = total > 0 ? ((status.count || 0) / total) * 100 : 0
                    return (
                      <div key={status.status} className="flex items-center gap-4">
                        <span className="w-24 text-sm font-medium capitalize">{status.status}</span>
                        <div className="flex-1 bg-gray-200 rounded h-6">
                          <div
                            className={`h-6 rounded ${
                              status.status === 'active' ? 'bg-green-500' :
                              status.status === 'completed' ? 'bg-blue-500' :
                              status.status === 'overdue' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-16 text-sm text-right">{status.count}</span>
                        <span className="w-24 text-sm text-right text-gray-600">
                          {formatCurrency(status.total_value || 0)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Rental Statistics</h2>
              {rentalStatus.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No data available</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {rentalStatus.map((status) => (
                    <div key={status.status} className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{status.count}</p>
                      <p className="text-sm text-gray-600 capitalize">{status.status}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(status.avg_value || 0)} avg</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}