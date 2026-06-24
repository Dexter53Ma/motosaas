'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const METHOD_COLORS: Record<string, string> = {
  cash: 'bg-green-100 text-green-800',
  card: 'bg-blue-100 text-blue-800',
  bank_transfer: 'bg-purple-100 text-purple-800',
  mobile_money: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
}

export default function PaymentDetailPage() {
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => { fetchPayment() }, [params.id])

  async function fetchPayment() {
    const { data, error } = await supabase
      .from('payments')
      .select('*, rental:rentals(id, vehicle:vehicles(make, model, year, license_plate), customer:customers(first_name, last_name, phone)), customer:customers(id, first_name, last_name, phone, email)')
      .eq('id', params.id).single()
    if (error) setError(error.message)
    else setPayment(data)
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this payment?')) return
    const { error } = await supabase.from('payments').delete().eq('id', params.id)
    if (error) setError(error.message)
    else router.push('/dashboard/payments')
  }

  function handleSendWhatsApp() {
    if (!payment?.customer?.phone) { alert('No phone number available'); return }
    const phone = payment.customer.phone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Payment Receipt\nAmount: ${payment.amount} MAD\nMethod: ${payment.payment_method.replace('_', ' ')}\nDate: ${new Date(payment.payment_date).toLocaleDateString('fr-FR')}\nReference: ${payment.reference_number || 'N/A'}\nThank you!`
    )
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-red-600">Error: {error}</p></div>
  if (!payment) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Payment not found</p></div>

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
                <Link href="/dashboard/payments" className="text-gray-900 font-semibold px-3 py-2 text-sm">Payments</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">&larr; Back</button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
              <p className="text-gray-600">Payment #{payment.id.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSendWhatsApp}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
              Send via WhatsApp
            </button>
            <button onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Payment Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${METHOD_COLORS[payment.payment_method] || 'bg-gray-100 text-gray-800'}`}>
                  {payment.payment_method.replace('_', ' ')}
                </span>
              </div>
              <p className="text-3xl font-bold text-green-600">+{payment.amount?.toLocaleString()} MAD</p>
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">{new Date(payment.payment_date).toLocaleDateString('fr-FR')}</span>
                </div>
                {payment.reference_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference</span>
                    <span className="font-medium">{payment.reference_number}</span>
                  </div>
                )}
                {payment.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Notes</span>
                    <span className="font-medium">{payment.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Related Information</h2>
            <div className="space-y-4">
              {payment.customer && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Customer</p>
                  <p className="font-medium">{payment.customer.first_name} {payment.customer.last_name}</p>
                  <p className="text-sm text-gray-500">{payment.customer.phone}</p>
                  {payment.customer.email && <p className="text-sm text-gray-500">{payment.customer.email}</p>}
                </div>
              )}
              {payment.rental && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Rental</p>
                  <p className="font-medium">{payment.rental.vehicle?.make} {payment.rental.vehicle?.model}</p>
                  <p className="text-sm text-gray-500">{payment.rental.vehicle?.license_plate}</p>
                  <button onClick={() => router.push(`/dashboard/rentals/${payment.rental.id}`)}
                    className="text-blue-600 hover:underline text-sm mt-1">View Rental</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}