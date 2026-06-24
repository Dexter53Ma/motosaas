'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string | null
  license_plate: string
  color: string | null
  mileage: number
  purchase_price: number | null
  daily_rate: number
  weekly_rate: number | null
  monthly_rate: number | null
  fuel_type: string
  status: string
  notes: string | null
  created_at: string
}

interface Maintenance {
  id: string
  type: string
  description: string | null
  cost: number
  odometer_reading: number | null
  performed_at: string
}

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [maintenance, setMaintenance] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getVehicle = async () => {
      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setVehicle(data)
      }

      // Get maintenance history
      const { data: maintenanceData } = await supabase
        .from('vehicle_maintenance')
        .select('*')
        .eq('vehicle_id', id)
        .order('performed_at', { ascending: false })

      if (maintenanceData) {
        setMaintenance(maintenanceData)
      }

      setLoading(false)
    }

    getVehicle()
  }, [id, supabase])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting vehicle: ' + error.message)
    } else {
      router.push('/dashboard/vehicles')
      router.refresh()
    }
    setDeleting(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'rented': return 'bg-blue-100 text-blue-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'retired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFuelTypeLabel = (fuelType: string) => {
    switch (fuelType) {
      case 'gasoline': return 'Gasoline'
      case 'diesel': return 'Diesel'
      case 'electric': return 'Electric'
      case 'hybrid': return 'Hybrid'
      default: return fuelType
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Vehicle not found</h2>
        <Link href="/dashboard/vehicles" className="text-blue-600 hover:underline mt-4 block">
          Back to vehicles
        </Link>
      </div>
    )
  }

  const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + (m.cost || 0), 0)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link href="/dashboard/vehicles" className="text-blue-600 hover:underline text-sm mb-2 block">
            ← Back to vehicles
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-gray-600">{vehicle.license_plate}</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/vehicles/${id}/edit`}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Image */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Vehicle Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Make</dt>
                <dd className="text-sm font-medium text-gray-900">{vehicle.make}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Model</dt>
                <dd className="text-sm font-medium text-gray-900">{vehicle.model}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Year</dt>
                <dd className="text-sm font-medium text-gray-900">{vehicle.year}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Color</dt>
                <dd className="text-sm font-medium text-gray-900">{vehicle.color || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">VIN</dt>
                <dd className="text-sm font-medium text-gray-900">{vehicle.vin || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">License Plate</dt>
                <dd className="text-sm font-medium text-gray-900">{vehicle.license_plate}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Mileage</dt>
                <dd className="text-sm font-medium text-gray-900">{vehicle.mileage.toLocaleString()} km</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Fuel Type</dt>
                <dd className="text-sm font-medium text-gray-900">{getFuelTypeLabel(vehicle.fuel_type)}</dd>
              </div>
            </dl>
            {vehicle.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <dt className="text-sm text-gray-500">Notes</dt>
                <dd className="text-sm text-gray-900 mt-1">{vehicle.notes}</dd>
              </div>
            )}
          </div>

          {/* Maintenance History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Maintenance History</h2>
            {maintenance.length === 0 ? (
              <p className="text-gray-500">No maintenance records yet</p>
            ) : (
              <div className="space-y-4">
                {maintenance.map((record) => (
                  <div key={record.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{record.type}</p>
                        {record.description && (
                          <p className="text-sm text-gray-500">{record.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{record.cost.toLocaleString()} MAD</p>
                        <p className="text-sm text-gray-500">
                          {new Date(record.performed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {record.odometer_reading && (
                      <p className="text-sm text-gray-500 mt-1">
                        Odometer: {record.odometer_reading.toLocaleString()} km
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Status</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vehicle.status)}`}>
              {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
            </span>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Daily</span>
                <span className="font-medium">{vehicle.daily_rate.toLocaleString()} MAD</span>
              </div>
              {vehicle.weekly_rate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Weekly</span>
                  <span className="font-medium">{vehicle.weekly_rate.toLocaleString()} MAD</span>
                </div>
              )}
              {vehicle.monthly_rate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly</span>
                  <span className="font-medium">{vehicle.monthly_rate.toLocaleString()} MAD</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Financial</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Purchase Price</span>
                <span className="font-medium">
                  {vehicle.purchase_price ? `${vehicle.purchase_price.toLocaleString()} MAD` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Maintenance Cost</span>
                <span className="font-medium">{totalMaintenanceCost.toLocaleString()} MAD</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href={`/dashboard/rentals/new?vehicle=${id}`}
                className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
              >
                Create Rental
              </Link>
              <Link
                href={`/dashboard/maintenance/new?vehicle=${id}`}
                className="block w-full text-center px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700"
              >
                Add Maintenance
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
