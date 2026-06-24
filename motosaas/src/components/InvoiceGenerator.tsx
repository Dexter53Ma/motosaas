'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface InvoiceGeneratorProps {
  rentalId: string
  onInvoiceCreated?: (invoice: any) => void
}

export default function InvoiceGenerator({ rentalId, onInvoiceCreated }: InvoiceGeneratorProps) {
  const [rental, setRental] = useState<any>(null)
  const [tenant, setTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const supabase = createClient()

  useEffect(() => { fetchData() }, [rentalId])

  async function fetchData() {
    const { data: rentalData } = await supabase
      .from('rentals')
      .select('*, customer:customers(*), vehicle:vehicles(*), payments(*)')
      .eq('id', rentalId).single()
    if (rentalData) setRental(rentalData)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (userData) {
        const { data: tenantData } = await supabase.from('tenants').select('*').eq('id', userData.tenant_id).single()
        if (tenantData) setTenant(tenantData)
      }
    }
    setLoading(false)
  }

  async function generateInvoice() {
    if (!rental || !tenant) return
    setGenerating(true)

    try {
      const subtotal = rental.total_amount || 0
      const taxRate = 20.00
      const taxAmount = subtotal * taxRate / 100
      const total = subtotal + taxAmount
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          tenant_id: tenant.id, rental_id: rentalId, customer_id: rental.customer_id,
          invoice_number: invoiceNumber, status: 'draft',
          subtotal, tax_rate: taxRate, tax_amount: taxAmount, total,
          notes: `Rental: ${rental.vehicle?.make} ${rental.vehicle?.model} (${rental.vehicle?.license_plate})`,
        })
        .select().single()

      if (invoiceError) throw invoiceError

      const lineItems = [
        { invoice_id: invoice.id, description: `Rental: ${rental.vehicle?.make} ${rental.vehicle?.model}`, quantity: 1, unit_price: subtotal, amount: subtotal },
      ]
      if (rental.late_fee && rental.late_fee > 0) {
        lineItems.push({ invoice_id: invoice.id, description: 'Late fee', quantity: 1, unit_price: rental.late_fee, amount: rental.late_fee })
      }

      const { error: itemsError } = await supabase.from('invoice_items').insert(lineItems)
      if (itemsError) throw itemsError

      onInvoiceCreated?.(invoice)
      alert(`Invoice ${invoiceNumber} created successfully!`)
    } catch (err: any) {
      alert(`Error creating invoice: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  function handleDownload() {
    if (!rental || !tenant) return
    const subtotal = rental.total_amount || 0
    const taxAmount = subtotal * 0.20
    const total = subtotal + taxAmount

    const receipt = `
================================
${tenant.name}
${tenant.address || ''}
${tenant.phone || ''}
${tenant.email || ''}
${tenant.tax_id ? `Tax ID: ${tenant.tax_id}` : ''}
${tenant.rc_number ? `RC: ${tenant.rc_number}` : ''}
================================

INVOICE
Date: ${new Date().toLocaleDateString('fr-FR')}
Invoice #: INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}

--------------------------------
CUSTOMER:
${rental.customer?.first_name} ${rental.customer?.last_name}
${rental.customer?.phone}
${rental.customer?.email || ''}
--------------------------------

VEHICLE:
${rental.vehicle?.make} ${rental.vehicle?.model} (${rental.vehicle?.year})
License: ${rental.vehicle?.license_plate}

RENTAL PERIOD:
${new Date(rental.start_date).toLocaleDateString('fr-FR')} - ${new Date(rental.end_date).toLocaleDateString('fr-FR')}

--------------------------------
Rental Fee:           ${subtotal.toFixed(2)} MAD
TVA (20%):           ${taxAmount.toFixed(2)} MAD
--------------------------------
TOTAL:                ${total.toFixed(2)} MAD
--------------------------------

Payments Received:    ${(rental.paid_amount || 0).toFixed(2)} MAD
Balance Due:          ${(total - (rental.paid_amount || 0)).toFixed(2)} MAD

================================
Thank you for your business!
================================`.trim()

    const blob = new Blob([receipt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${rental.customer?.last_name}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleSendWhatsApp() {
    if (!rental?.customer?.phone) { alert('No phone number available'); return }
    const subtotal = rental.total_amount || 0
    const taxAmount = subtotal * 0.20
    const total = subtotal + taxAmount
    const phone = rental.customer.phone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Invoice from ${tenant?.name}\nVehicle: ${rental.vehicle?.make} ${rental.vehicle?.model}\nPeriod: ${new Date(rental.start_date).toLocaleDateString('fr-FR')} - ${new Date(rental.end_date).toLocaleDateString('fr-FR')}\n\nSubtotal: ${subtotal.toFixed(2)} MAD\nTVA (20%): ${taxAmount.toFixed(2)} MAD\nTotal: ${total.toFixed(2)} MAD\nPaid: ${(rental.paid_amount || 0).toFixed(2)} MAD\nBalance: ${(total - (rental.paid_amount || 0)).toFixed(2)} MAD`
    )
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  if (loading) return <div className="p-4 text-center">Loading invoice data...</div>
  if (!rental || !tenant) return <div className="p-4 text-center text-red-600">Could not load rental or shop data</div>

  const subtotal = rental.total_amount || 0
  const taxAmount = subtotal * 0.20
  const total = subtotal + taxAmount

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Invoice Preview</h2>
        <div className="flex gap-2">
          <button onClick={handleDownload} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Download</button>
          <button onClick={handleSendWhatsApp} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">WhatsApp</button>
        </div>
      </div>

      <div className="border-b pb-4 mb-4">
        <h3 className="text-xl font-bold">{tenant.name}</h3>
        {tenant.address && <p className="text-gray-600">{tenant.address}</p>}
        {tenant.phone && <p className="text-gray-600">Tel: {tenant.phone}</p>}
        {tenant.email && <p className="text-gray-600">{tenant.email}</p>}
        {tenant.tax_id && <p className="text-gray-600">Tax ID: {tenant.tax_id}</p>}
        {tenant.rc_number && <p className="text-gray-600">RC: {tenant.rc_number}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div><p className="text-sm text-gray-600">Invoice Number</p><p className="font-medium">INV-{new Date().getFullYear()}-{String(Date.now()).slice(-6)}</p></div>
        <div><p className="text-sm text-gray-600">Date</p><p className="font-medium">{new Date().toLocaleDateString('fr-FR')}</p></div>
      </div>

      <div className="border-t pt-4 mb-4">
        <p className="text-sm text-gray-600 mb-1">Bill To:</p>
        <p className="font-medium">{rental.customer?.first_name} {rental.customer?.last_name}</p>
        <p className="text-gray-600">{rental.customer?.phone}</p>
        {rental.customer?.email && <p className="text-gray-600">{rental.customer.email}</p>}
      </div>

      <div className="border-t pt-4 mb-4">
        <p className="text-sm text-gray-600 mb-1">Vehicle:</p>
        <p className="font-medium">{rental.vehicle?.make} {rental.vehicle?.model} ({rental.vehicle?.year})</p>
        <p className="text-gray-600">License: {rental.vehicle?.license_plate}</p>
        <p className="text-gray-600">Period: {new Date(rental.start_date).toLocaleDateString('fr-FR')} - {new Date(rental.end_date).toLocaleDateString('fr-FR')}</p>
      </div>

      <div className="border-t pt-4 mb-4">
        <table className="w-full">
          <thead><tr className="border-b"><th className="text-left py-2">Description</th><th className="text-right py-2">Amount</th></tr></thead>
          <tbody>
            <tr className="border-b"><td className="py-2">Rental Fee</td><td className="text-right py-2">{subtotal.toFixed(2)} MAD</td></tr>
            {rental.late_fee > 0 && <tr className="border-b"><td className="py-2">Late Fee</td><td className="text-right py-2">{rental.late_fee.toFixed(2)} MAD</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between mb-2"><span>Subtotal:</span><span>{subtotal.toFixed(2)} MAD</span></div>
        <div className="flex justify-between mb-2"><span>TVA (20%):</span><span>{taxAmount.toFixed(2)} MAD</span></div>
        <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total:</span><span>{total.toFixed(2)} MAD</span></div>
        <div className="flex justify-between mt-2 text-green-600"><span>Paid:</span><span>{(rental.paid_amount || 0).toFixed(2)} MAD</span></div>
        <div className="flex justify-between font-medium text-red-600"><span>Balance Due:</span><span>{(total - (rental.paid_amount || 0)).toFixed(2)} MAD</span></div>
      </div>

      <div className="mt-6">
        <button onClick={generateInvoice} disabled={generating}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {generating ? 'Generating...' : 'Generate Official Invoice'}
        </button>
      </div>
    </div>
  )
}