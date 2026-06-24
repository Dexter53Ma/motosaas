'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PaymentForm from '@/components/PaymentForm'

function NewPaymentContent() {
  const [rental, setRental] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const rentalId = searchParams.get('rental_id')
  const customerId = searchParams.get('customer_id')

  useEffect(() => {
    if (rentalId) {
      supabase.from('rentals').select('*, customer:customers(*), vehicle:vehicles(*)').eq('id', rentalId).single()
        .then(({ data }) => { if (data) setRental(data) })
    }
    if (customerId) {
      supabase.from('customers').select('*').eq('id', customerId).single()
        .then(({ data }) => { if (data) setCustomer(data) })
    }
  }, [rentalId, customerId])

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

      <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">&larr; Back</button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
            <p className="text-gray-600">
              {rental ? `For rental: ${rental.vehicle?.make} ${rental.vehicle?.model}` :
               customer ? `For customer: ${customer.first_name} ${customer.last_name}` :
               'New payment'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <PaymentForm
            rentalId={rentalId || undefined}
            customerId={customerId || undefined}
            amount={rental?.total_amount ? rental.total_amount - (rental.paid_amount || 0) : undefined}
            onPaymentCreated={(p) => router.push(`/dashboard/payments/${p.id}`)}
            onCancel={() => router.back()}
          />
        </div>
      </main>
    </div>
  )
}

export default function NewPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <NewPaymentContent />
    </Suspense>
  )
}