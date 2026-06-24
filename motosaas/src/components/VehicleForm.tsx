'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface VehicleFormProps {
  vehicleId?: string
}

export default function VehicleForm({ vehicleId }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    license_plate: '',
    color: '',
    mileage: 0,
    purchase_price: '',
    daily_rate: '100',
    weekly_rate: '',
    monthly_rate: '',
    fuel_type: 'gasoline',
    status: 'available',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!!vehicleId)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (vehicleId) {
      const getVehicle = async () => {
        const { data } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', vehicleId)
          .single()

        if (data) {
          setFormData({
            make: data.make,
            model: data.model,
            year: data.year,
            vin: data.vin || '',
            license_plate: data.license_plate,
            color: data.color || '',
            mileage: data.mileage || 0,
            purchase_price: data.purchase_price?.toString() || '',
            daily_rate: data.daily_rate?.toString() || '100',
            weekly_rate: data.weekly_rate?.toString() || '',
            monthly_rate: data.monthly_rate?.toString() || '',
            fuel_type: data.fuel_type,
            status: data.status,
            notes: data.notes || '',
          })
        }
        setFetching(false)
      }
      getVehicle()
    }
  }, [vehicleId, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Get tenant_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      setError('User profile not found')
      setLoading(false)
      return
    }

    const vehicleData = {
      tenant_id: userProfile.tenant_id,
      make: formData.make,
      model: formData.model,
      year: formData.year,
      vin: formData.vin || null,
      license_plate: formData.license_plate,
      color: formData.color || null,
      mileage: formData.mileage || 0,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
      daily_rate: parseFloat(formData.daily_rate),
      weekly_rate: formData.weekly_rate ? parseFloat(formData.weekly_rate) : null,
      monthly_rate: formData.monthly_rate ? parseFloat(formData.monthly_rate) : null,
      fuel_type: formData.fuel_type,
      status: formData.status,
      notes: formData.notes || null,
    }

    let result
    if (vehicleId) {
      result = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', vehicleId)
    } else {
      result = await supabase
        .from('vehicles')
        .insert(vehicleData)
    }

    if (result.error) {
      setError(result.error.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/vehicles')
        router.refresh()
      }, 1000)
    }
    setLoading(false)
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Vehicle {vehicleId ? 'updated' : 'added'} successfully!
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Vehicle Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Make *</label>
            <input
              type="text"
              name="make"
              value={formData.make}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Toyota"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Model *</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Corolla"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Year *</label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              min="1900"
              max={new Date().getFullYear() + 1}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="White"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">License Plate *</label>
            <input
              type="text"
              name="license_plate"
              value={formData.license_plate}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="12345-A-12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">VIN</label>
            <input
              type="text"
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Vehicle Identification Number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mileage (km)</label>
            <input
              type="number"
              name="mileage"
              value={formData.mileage}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fuel Type</label>
            <select
              name="fuel_type"
              value={formData.fuel_type}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="gasoline">Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Daily Rate (MAD) *</label>
            <input
              type="number"
              name="daily_rate"
              value={formData.daily_rate}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Weekly Rate (MAD)</label>
            <input
              type="number"
              name="weekly_rate"
              value={formData.weekly_rate}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Rate (MAD)</label>
            <input
              type="number"
              name="monthly_rate"
              value={formData.monthly_rate}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Purchase Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Purchase Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Purchase Price (MAD)</label>
            <input
              type="number"
              name="purchase_price"
              value={formData.purchase_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Additional notes about this vehicle..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : vehicleId ? 'Update Vehicle' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  )
}
