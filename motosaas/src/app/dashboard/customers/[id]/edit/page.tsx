'use client'

import { use } from 'react'
import CustomerForm from '@/components/CustomerForm'

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Customer</h1>
      <CustomerForm customerId={id} />
    </div>
  )
}
