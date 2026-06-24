'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  license_plate: string
  color: string | null
  mileage: number
  purchase_price: number | null
  daily_rate: number
  status: string
  fuel_type: string
  photo_url?: string
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const supabase = createClient()

  useEffect(() => {
    const getVehicles = async () => {
      let query = supabase
        .from('vehicles')
        .select('*')

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // Apply search
      if (search) {
        query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%,license_plate.ilike.%${search}%`)
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data } = await query
      if (data) {
        setVehicles(data)
      }
      setLoading(false)
    }

    getVehicles()
  }, [supabase, search, statusFilter, sortBy, sortOrder])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'rented': return 'bg-blue-100 text-blue-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'retired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFleetStats = () => {
    const total = vehicles.length
    const available = vehicles.filter(v => v.status === 'available').length
    const rented = vehicles.filter(v => v.status === 'rented').length
    const maintenance = vehicles.filter(v => v.status === 'maintenance').length
    const totalValue = vehicles.reduce((sum, v) => sum + (v.purchase_price || 0), 0)

    return { total, available, rented, maintenance, totalValue }
  }

  const stats = getFleetStats()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-600">Manage your fleet</p>
        </div>
        <Link
          href="/dashboard/vehicles/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          Add Vehicle
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Available</p>
          <p className="text-2xl font-bold text-green-600">{stats.available}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Rented</p>
          <p className="text-2xl font-bold text-blue-600">{stats.rented}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Maintenance</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Fleet Value</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalValue.toLocaleString()} MAD</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by make, model, or plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created_at">Date Added</option>
              <option value="make">Make</option>
              <option value="model">Model</option>
              <option value="year">Year</option>
              <option value="daily_rate">Daily Rate</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Vehicle list */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles yet</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first vehicle</p>
          <Link
            href="/dashboard/vehicles/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Add Vehicle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Link
              key={vehicle.id}
              href={`/dashboard/vehicles/${vehicle.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                    <p className="text-sm text-gray-500">{vehicle.license_plate}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{vehicle.mileage.toLocaleString()} km</span>
                  <span className="font-medium text-blue-600">{vehicle.daily_rate} MAD/day</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
