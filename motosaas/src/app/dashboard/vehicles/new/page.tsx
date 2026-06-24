import VehicleForm from '@/components/VehicleForm'

export default function NewVehiclePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Vehicle</h1>
      <VehicleForm />
    </div>
  )
}
