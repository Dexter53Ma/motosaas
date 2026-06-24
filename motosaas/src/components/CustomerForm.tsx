'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface CustomerFormProps {
  customerId?: string
}

export default function CustomerForm({ customerId }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    id_number: '',
    address: '',
    tags: [] as string[],
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!!customerId)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (customerId) {
      const getCustomer = async () => {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .single()

        if (data) {
          setFormData({
            full_name: data.full_name,
            phone: data.phone,
            email: data.email || '',
            id_number: data.id_number || '',
            address: data.address || '',
            tags: data.tags || [],
            notes: data.notes || '',
          })
        }
        setFetching(false)
      }
      getCustomer()
    }
  }, [customerId, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleTagToggle = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.includes(tag)
        ? formData.tags.filter(t => t !== tag)
        : [...formData.tags, tag],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Get tenant_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      setError('User profile not found')
      setLoading(false)
      return
    }

    const customerData = {
      tenant_id: userProfile.tenant_id,
      full_name: formData.full_name,
      phone: formData.phone,
      email: formData.email || null,
      id_number: formData.id_number || null,
      address: formData.address || null,
      tags: formData.tags,
      notes: formData.notes || null,
    }

    let result
    if (customerId) {
      result = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', customerId)
    } else {
      result = await supabase
        .from('customers')
        .insert(customerData)
    }

    if (result.error) {
      setError(result.error.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/customers')
        router.refresh()
      }, 1000)
    }
    setLoading(false)
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Customer {customerId ? 'updated' : 'added'} successfully!
        </div>
      )}

      {/* Personal Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mohamed Benali"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="+212 6XX-XXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ID Number</label>
            <input
              type="text"
              name="id_number"
              value={formData.id_number}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="ID or Passport number"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="123 Rue Mohammed V, Casablanca"
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Tags</h2>
        <p className="text-sm text-gray-500 mb-4">Select all that apply</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleTagToggle('vip')}
            className={`px-4 py-2 rounded-lg border-2 transition ${
              formData.tags.includes('vip')
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            VIP
          </button>
          <button
            type="button"
            onClick={() => handleTagToggle('regular')}
            className={`px-4 py-2 rounded-lg border-2 transition ${
              formData.tags.includes('regular')
                ? 'border-gray-500 bg-gray-50 text-gray-700'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            Regular
          </button>
          <button
            type="button"
            onClick={() => handleTagToggle('blacklisted')}
            className={`px-4 py-2 rounded-lg border-2 transition ${
              formData.tags.includes('blacklisted')
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            Blacklisted
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
        <p className="text-sm text-gray-500 mb-2">Internal notes (not visible to customer)</p>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add any internal notes about this customer..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : customerId ? 'Update Customer' : 'Add Customer'}
        </button>
      </div>
    </form>
  )
}
