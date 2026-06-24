'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PaymentFormProps {
  rentalId?: string
  customerId?: string
  amount?: number
  onPaymentCreated?: (payment: any) => void
  onCancel?: () => void
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'other', label: 'Other' },
]

export default function PaymentForm({ rentalId, customerId, amount, onPaymentCreated, onCancel }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    amount: amount || 0,
    payment_method: 'cash',
    reference_number: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rental, setRental] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    if (rentalId) fetchRentalDetails()
    if (customerId) fetchCustomerDetails()
  }, [rentalId, customerId])

  useEffect(() => {
    if (amount) setFormData(prev => ({ ...prev, amount }))
  }, [amount])

  async function fetchRentalDetails() {
    const { data } = await supabase
      .from('rentals')
      .select('*, customer:customers(*), vehicle:vehicles(*)')
      .eq('id', rentalId)
      .single()
    if (data) {
      setRental(data)
      if (!amount) setFormData(prev => ({ ...prev, amount: data.total_amount || 0 }))
    }
  }

  async function fetchCustomerDetails() {
    const { data } = await supabase.from('customers').select('*').eq('id', customerId).single()
    if (data) setCustomer(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) throw new Error('No tenant found')

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          tenant_id: userData.tenant_id,
          rental_id: rentalId || null,
          customer_id: customer?.id || customerId || null,
          amount: formData.amount,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number || null,
          notes: formData.notes || null,
          payment_date: new Date().toISOString(),
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      if (rentalId && rental) {
        const newPaidAmount = (rental.paid_amount || 0) + formData.amount
        const newBalance = rental.total_amount - newPaidAmount
        await supabase.from('rentals').update({
          paid_amount: newPaidAmount,
          payment_status: newBalance <= 0 ? 'paid' : newPaidAmount > 0 ? 'partial' : 'pending',
          updated_at: new Date().toISOString(),
        }).eq('id', rentalId)
      }

      onPaymentCreated?.(payment)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {rental && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800">Rental: {rental.vehicle?.make} {rental.vehicle?.model}</p>
          <p className="text-sm text-blue-600">Customer: {rental.customer?.full_name}</p>
          <p className="text-sm text-blue-600">Total: {rental.total_amount} MAD | Paid: {rental.paid_amount || 0} MAD | Balance: {(rental.total_amount - (rental.paid_amount || 0))} MAD</p>
        </div>
      )}

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount (MAD) *</label>
        <input
          id="amount" type="number" step="0.01" min="0" required
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
        <select
          id="payment_method" required
          value={formData.payment_method}
          onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="reference_number" className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
        <input
          id="reference_number" value={formData.reference_number}
          onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
          placeholder="Transaction ID, check number, etc."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          id="notes" value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about this payment"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Recording...' : 'Record Payment'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}