'use client'

import { use } from 'react'
import RentalForm from '@/components/RentalForm'

export default function EditRentalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Rental</h1>
      <RentalForm rentalId={id} />
    </div>
  )
}
