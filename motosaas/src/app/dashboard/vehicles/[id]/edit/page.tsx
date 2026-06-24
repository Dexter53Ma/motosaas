'use client'

import { use } from 'react'
import VehicleForm from '@/components/VehicleForm'

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Vehicle</h1>
      <VehicleForm vehicleId={id} />
    </div>
  )
}
