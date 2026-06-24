'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const getRentals = async () => {
      let query = supabase
        .from('rentals')
        .select('*, customers(full_name, phone), vehicles(make, model, year, license_plate)')

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
  }, [supabase, search, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
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
    const checkOverdueRentals = async () => {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from('rentals')
        .update({ status: 'overdue' })
        .lt('end_date', now)
        .eq('status', 'active')
        .select()

      if (data && data.length > 0) {
        // Refresh the list
        setRentals(prev => prev.map(r => 
          data.find((d: Rental) => d.id === r.id) ? { ...r, status: 'overdue' } : r
        ))
      }
    }

    checkOverdueRentals()
  }, [supabase])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rentals</h1>
          <p className="text-gray-600">Manage your rental bookings</p>
        </div>
        <Link
          href="/dashboard/rentals/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          New Rental
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalRevenue.toLocaleString()} MAD</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Late Fees</p>
          <p className="text-2xl font-bold text-orange-600">{stats.totalLateFees.toLocaleString()} MAD</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by customer name or plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rental list */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : rentals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rentals yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first rental</p>
          <Link
            href="/dashboard/rentals/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            New Rental
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rentals.map((rental) => (
                <tr key={rental.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {rental.customers?.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {rental.customers?.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {rental.vehicles?.year} {rental.vehicles?.make} {rental.vehicles?.model}
                    </div>
                    <div className="text-sm text-gray-500">
                      {rental.vehicles?.license_plate}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                    </div>
                    {rental.actual_return_date && (
                      <div className="text-sm text-gray-500">
                        Returned: {new Date(rental.actual_return_date).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {rental.total_amount.toLocaleString()} MAD
                    </div>
                    {rental.late_fee > 0 && (
                      <div className="text-sm text-red-600">
                        +{rental.late_fee.toLocaleString()} MAD late
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                      {rental.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/rentals/${rental.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
