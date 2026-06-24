import CustomerForm from '@/components/CustomerForm'

export default function NewCustomerPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Customer</h1>
      <CustomerForm />
    </div>
  )
}
