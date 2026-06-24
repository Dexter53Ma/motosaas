'use client'

import { useRef } from 'react'

interface PrintInvoiceProps {
  invoice: {
    invoice_number: string
    created_at: string
    subtotal: number
    tax_rate: number
    tax_amount: number
    total: number
    notes?: string
  }
  customer: {
    full_name: string
    phone?: string
    email?: string
    address?: string
  }
  rental?: {
    start_date: string
    end_date: string
    vehicle?: {
      make: string
      model: string
      license_plate: string
    }
  }
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    amount: number
  }>
  shopName?: string
  shopAddress?: string
  shopPhone?: string
}

export default function PrintInvoice({ invoice, customer, rental, items, shopName = 'MotoRent', shopAddress, shopPhone }: PrintInvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    const content = printRef.current
    if (!content) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .shop-info { text-align: left; }
          .invoice-info { text-align: right; }
          .customer-info { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; }
          .totals { text-align: right; }
          .total-row { font-weight: bold; font-size: 1.1em; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Invoice
        </button>
      </div>

      <div ref={printRef} className="bg-white p-8 border">
        <div className="flex justify-between mb-8">
          <div className="shop-info">
            <h1 className="text-2xl font-bold">{shopName}</h1>
            {shopAddress && <p className="text-gray-600">{shopAddress}</p>}
            {shopPhone && <p className="text-gray-600">{shopPhone}</p>}
          </div>
          <div className="invoice-info text-right">
            <h2 className="text-xl font-bold">INVOICE</h2>
            <p className="text-gray-600">#{invoice.invoice_number}</p>
            <p className="text-gray-600">{new Date(invoice.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <div className="customer-info mb-8">
          <h3 className="font-bold mb-2">Bill To:</h3>
          <p className="font-medium">{customer.full_name}</p>
          {customer.address && <p className="text-gray-600">{customer.address}</p>}
          {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
          {customer.email && <p className="text-gray-600">{customer.email}</p>}
        </div>

        {rental && (
          <div className="mb-8 p-4 bg-gray-50 rounded">
            <h3 className="font-bold mb-2">Rental Details:</h3>
            {rental.vehicle && (
              <p className="text-gray-600">
                Vehicle: {rental.vehicle.make} {rental.vehicle.model} ({rental.vehicle.license_plate})
              </p>
            )}
            <p className="text-gray-600">
              Period: {new Date(rental.start_date).toLocaleDateString('fr-FR')} - {new Date(rental.end_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
        )}

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b">
              <th className="text-left">Description</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Unit Price</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b">
                <td>{item.description}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{item.unit_price.toLocaleString()} MAD</td>
                <td className="text-right">{item.amount.toLocaleString()} MAD</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <p>Subtotal: {invoice.subtotal.toLocaleString()} MAD</p>
          <p>TVA ({invoice.tax_rate}%): {invoice.tax_amount.toLocaleString()} MAD</p>
          <p className="total-row mt-2">Total: {invoice.total.toLocaleString()} MAD</p>
        </div>

        {invoice.notes && (
          <div className="mt-8 p-4 bg-gray-50 rounded">
            <h4 className="font-bold mb-1">Notes:</h4>
            <p className="text-gray-600">{invoice.notes}</p>
          </div>
        )}

        <div className="footer mt-8">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  )
}