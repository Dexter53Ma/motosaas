'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Customer {
  id: string
  full_name: string
  phone: string
}

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  license_plate: string
  daily_rate: number
  status: string
}

interface RentalFormProps {
  rentalId?: string
  preselectedCustomerId?: string
  preselectedVehicleId?: string
}

export default function RentalForm({ rentalId, preselectedCustomerId, preselectedVehicleId }: RentalFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [formData, setFormData] = useState({
    customer_id: preselectedCustomerId || '',
    vehicle_id: preselectedVehicleId || '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    daily_rate: '',
    deposit_amount: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!!rentalId)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      // Get user and tenant
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData?.tenant_id) return
      const tid = userData.tenant_id

      // Get available vehicles
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('tenant_id', tid)
        .eq('status', 'available')
        .order('make')

      if (vehicleData) {
        setVehicles(vehicleData)
      }

      // Get customers
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, full_name, phone')
        .eq('tenant_id', tid)
        .order('full_name')

      if (customerData) {
        setCustomers(customerData)
      }

      // If editing, get rental data
      if (rentalId) {
        const { data: rentalData } = await supabase
          .from('rentals')
          .select('*')
          .eq('id', rentalId)
          .single()

        if (rentalData) {
          setFormData({
            customer_id: rentalData.customer_id,
            vehicle_id: rentalData.vehicle_id,
            start_date: new Date(rentalData.start_date).toISOString().split('T')[0],
            end_date: new Date(rentalData.end_date).toISOString().split('T')[0],
            daily_rate: rentalData.daily_rate.toString(),
            deposit_amount: rentalData.deposit_amount?.toString() || '',
            notes: rentalData.notes || '',
          })
        }
      }

      setFetching(false)
    }

    getData()
  }, [supabase, rentalId])

  // Auto-fill daily rate when vehicle is selected
  useEffect(() => {
    if (formData.vehicle_id) {
      const vehicle = vehicles.find(v => v.id === formData.vehicle_id)
      if (vehicle) {
        setFormData(prev => ({ ...prev, daily_rate: vehicle.daily_rate.toString() }))
      }
    }
  }, [formData.vehicle_id, vehicles])

  // Calculate total amount
  const calculateTotal = () => {
    if (!formData.start_date || !formData.end_date || !formData.daily_rate) return 0
    const start = new Date(formData.start_date)
    const end = new Date(formData.end_date)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return days * parseFloat(formData.daily_rate)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate dates
    const start = new Date(formData.start_date)
    const end = new Date(formData.end_date)
    if (end <= start) {
      setError('End date must be after start date')
      setLoading(false)
      return
    }

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

    const totalAmount = calculateTotal()

    const rentalData = {
      tenant_id: userProfile.tenant_id,
      customer_id: formData.customer_id,
      vehicle_id: formData.vehicle_id,
      start_date: formData.start_date,
      end_date: formData.end_date,
      daily_rate: parseFloat(formData.daily_rate),
      total_amount: totalAmount,
      deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : 0,
      status: 'active',
      notes: formData.notes || null,
    }

    let result
    if (rentalId) {
      result = await supabase
        .from('rentals')
        .update(rentalData)
        .eq('id', rentalId)
    } else {
      result = await supabase
        .from('rentals')
        .insert(rentalData)

      // Update vehicle status to rented
      if (!result.error) {
        await supabase
          .from('vehicles')
          .update({ status: 'rented' })
          .eq('id', formData.vehicle_id)
      }
    }

    if (result.error) {
      setError(result.error.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/rentals')
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

  const totalAmount = calculateTotal()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Rental {rentalId ? 'updated' : 'created'} successfully!
        </div>
      )}

      {/* Customer Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Customer</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Customer *</label>
          <select
            name="customer_id"
            value={formData.customer_id}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.full_name} - {customer.phone}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicle Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Vehicle</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Vehicle *</label>
          <select
            name="vehicle_id"
            value={formData.vehicle_id}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.license_plate} ({vehicle.daily_rate} MAD/day)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rental Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Rental Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date *</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date *</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
              min={formData.start_date}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
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
            <label className="block text-sm font-medium text-gray-700">Deposit Amount (MAD)</label>
            <input
              type="number"
              name="deposit_amount"
              value={formData.deposit_amount}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Total Amount */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-900">Total Amount</span>
            <span className="text-2xl font-bold text-blue-600">{totalAmount.toLocaleString()} MAD</span>
          </div>
          {formData.start_date && formData.end_date && (
            <p className="text-sm text-gray-500 mt-1">
              {Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24))} days × {formData.daily_rate || 0} MAD/day
            </p>
          )}
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
          placeholder="Additional notes about this rental..."
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
          {loading ? 'Saving...' : rentalId ? 'Update Rental' : 'Create Rental'}
        </button>
      </div>
    </form>
  )
}
