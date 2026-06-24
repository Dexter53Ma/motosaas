'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  deposit_amount: number
  fuel_level_out: number | null
  fuel_level_in: number | null
  mileage_out: number | null
  mileage_in: number | null
  checkout_checklist_json: any
  return_checklist_json: any
  status: string
  notes: string | null
  created_at: string
  customers: {
    full_name: string
    phone: string
    email: string
  }
  vehicles: {
    make: string
    model: string
    year: number
    license_plate: string
    mileage: number
  }
}

export default function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [rental, setRental] = useState<Rental | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [returnData, setReturnData] = useState({
    fuel_level_in: 100,
    mileage_in: 0,
    notes: '',
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getRental = async () => {
      const { data } = await supabase
        .from('rentals')
        .select('*, customers(full_name, phone, email), vehicles(make, model, year, license_plate, mileage)')
        .eq('id', id)
        .single()

      if (data) {
        setRental(data as Rental)
        // Pre-fill mileage
        if (data.vehicles?.mileage) {
          setReturnData(prev => ({ ...prev, mileage_in: data.vehicles.mileage }))
        }
      }
      setLoading(false)
    }

    getRental()
  }, [id, supabase])

  const handleCheckout = async () => {
    if (!rental) return

    const checklist = {
      fuel_level: 100,
      mileage: rental.vehicles?.mileage || 0,
      exterior_condition: 'Good',
      interior_condition: 'Good',
      accessories: 'All present',
      timestamp: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('rentals')
      .update({
        fuel_level_out: 100,
        mileage_out: rental.vehicles?.mileage || 0,
        checkout_checklist_json: checklist,
      })
      .eq('id', id)

    if (!error) {
      setRental({ ...rental, fuel_level_out: 100, mileage_out: rental.vehicles?.mileage || 0, checkout_checklist_json: checklist })
    }
  }

  const handleReturn = async () => {
    if (!rental) return

    setCompleting(true)

    // Calculate late fee
    const endDate = new Date(rental.end_date)
    const returnDate = new Date()
    let lateFee = 0
    if (returnDate > endDate) {
      const daysLate = Math.ceil((returnDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
      lateFee = daysLate * rental.daily_rate * 1.5
    }

    const checklist = {
      fuel_level: returnData.fuel_level_in,
      mileage: returnData.mileage_in,
      exterior_condition: 'Good',
      interior_condition: 'Good',
      notes: returnData.notes,
      timestamp: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('rentals')
      .update({
        actual_return_date: returnDate.toISOString(),
        fuel_level_in: returnData.fuel_level_in,
        mileage_in: returnData.mileage_in,
        return_checklist_json: checklist,
        late_fee: lateFee,
        total_amount: rental.total_amount + lateFee,
        status: 'completed',
      })
      .eq('id', id)

    if (!error) {
      // Update vehicle status back to available
      await supabase
        .from('vehicles')
        .update({ status: 'available', mileage: returnData.mileage_in })
        .eq('id', rental.vehicle_id)

      router.push('/dashboard/rentals')
      router.refresh()
    }
    setCompleting(false)
  }

  const calculateDays = () => {
    if (!rental) return 0
    const start = new Date(rental.start_date)
    const end = rental.actual_return_date ? new Date(rental.actual_return_date) : new Date(rental.end_date)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  const calculateLateFee = () => {
    if (!rental) return 0
    const endDate = new Date(rental.end_date)
    const returnDate = rental.actual_return_date ? new Date(rental.actual_return_date) : new Date()
    if (returnDate <= endDate) return 0
    const daysLate = Math.ceil((returnDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysLate * rental.daily_rate * 1.5
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!rental) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Rental not found</h2>
        <Link href="/dashboard/rentals" className="text-blue-600 hover:underline mt-4 block">
          Back to rentals
        </Link>
      </div>
    )
  }

  const days = calculateDays()
  const lateFee = calculateLateFee()
  const totalWithLateFee = rental.total_amount + lateFee

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link href="/dashboard/rentals" className="text-blue-600 hover:underline text-sm mb-2 block">
            ← Back to rentals
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Rental Details</h1>
          <p className="text-gray-600">ID: {rental.id.slice(0, 8)}...</p>
        </div>
        <div className="flex space-x-3">
          {rental.status === 'active' && (
            <>
              <button
                onClick={() => setShowReturnForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
              >
                Process Return
              </button>
              <a
                href={`https://wa.me/${rental.customers?.phone?.replace(/[^0-9]/g, '')}?text=Your rental for ${rental.vehicles?.year} ${rental.vehicles?.make} ${rental.vehicles?.model} is confirmed. Pick-up date: ${new Date(rental.start_date).toLocaleDateString()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600"
              >
                WhatsApp
              </a>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rental Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Rental Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                  {rental.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(rental.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(rental.start_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(rental.end_date).toLocaleDateString()}
                </p>
              </div>
              {rental.actual_return_date && (
                <div>
                  <p className="text-sm text-gray-500">Actual Return</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(rental.actual_return_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-sm font-medium text-gray-900">{days} days</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Customer</h2>
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium text-lg">
                  {rental.customers?.full_name?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{rental.customers?.full_name}</p>
                <p className="text-sm text-gray-500">{rental.customers?.phone}</p>
                {rental.customers?.email && (
                  <p className="text-sm text-gray-500">{rental.customers.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Vehicle</h2>
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {rental.vehicles?.year} {rental.vehicles?.make} {rental.vehicles?.model}
                </p>
                <p className="text-sm text-gray-500">{rental.vehicles?.license_plate}</p>
              </div>
            </div>
          </div>

          {/* Checkout Checklist */}
          {rental.checkout_checklist_json && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Checkout Checklist</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Fuel Level</dt>
                  <dd className="text-sm font-medium text-gray-900">{rental.fuel_level_out}%</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Mileage</dt>
                  <dd className="text-sm font-medium text-gray-900">{rental.mileage_out?.toLocaleString()} km</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Exterior</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {rental.checkout_checklist_json.exterior_condition || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Interior</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {rental.checkout_checklist_json.interior_condition || 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Return Checklist */}
          {rental.return_checklist_json && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Return Checklist</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Fuel Level</dt>
                  <dd className="text-sm font-medium text-gray-900">{rental.fuel_level_in}%</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Mileage</dt>
                  <dd className="text-sm font-medium text-gray-900">{rental.mileage_in?.toLocaleString()} km</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Exterior</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {rental.return_checklist_json.exterior_condition || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Interior</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {rental.return_checklist_json.interior_condition || 'N/A'}
                  </dd>
                </div>
              </dl>
              {rental.return_checklist_json.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <dt className="text-sm text-gray-500">Notes</dt>
                  <dd className="text-sm text-gray-900 mt-1">{rental.return_checklist_json.notes}</dd>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Daily Rate</span>
                <span className="font-medium">{rental.daily_rate.toLocaleString()} MAD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">{days} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{rental.total_amount.toLocaleString()} MAD</span>
              </div>
              {lateFee > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Late Fee</span>
                  <span className="font-medium">{lateFee.toLocaleString()} MAD</span>
                </div>
              )}
              {rental.deposit_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Deposit</span>
                  <span className="font-medium">{rental.deposit_amount.toLocaleString()} MAD</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-lg font-medium text-gray-900">Total</span>
                  <span className="text-lg font-bold text-blue-600">{totalWithLateFee.toLocaleString()} MAD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {rental.status === 'active' && (
                <button
                  onClick={handleCheckout}
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Complete Checkout
                </button>
              )}
              <Link
                href={`/dashboard/customers/${rental.customer_id}`}
                className="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
              >
                View Customer
              </Link>
              <Link
                href={`/dashboard/vehicles/${rental.vehicle_id}`}
                className="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
              >
                View Vehicle
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Return Modal */}
      {showReturnForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Process Return</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fuel Level (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={returnData.fuel_level_in}
                    onChange={(e) => setReturnData({ ...returnData, fuel_level_in: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mileage (km)</label>
                  <input
                    type="number"
                    min="0"
                    value={returnData.mileage_in}
                    onChange={(e) => setReturnData({ ...returnData, mileage_in: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={returnData.notes}
                    onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any issues or notes..."
                  />
                </div>
                {lateFee > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">
                      <span className="font-medium">Late Fee:</span> {lateFee.toLocaleString()} MAD
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
              <button
                onClick={() => setShowReturnForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReturn}
                disabled={completing}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {completing ? 'Processing...' : 'Complete Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
