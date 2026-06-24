'use client'

import { use, Suspense } from 'react'
import RentalForm from '@/components/RentalForm'

function NewRentalContent({ searchParams }: { searchParams: Promise<{ customer?: string; vehicle?: string }> }) {
  const params = use(searchParams)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Rental</h1>
      <RentalForm 
        preselectedCustomerId={params.customer} 
        preselectedVehicleId={params.vehicle} 
      />
    </div>
  )
}

export default function NewRentalPage({ searchParams }: { searchParams: Promise<{ customer?: string; vehicle?: string }> }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <NewRentalContent searchParams={searchParams} />
    </Suspense>
  )
}
