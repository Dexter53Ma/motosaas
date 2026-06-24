'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Tenant {
  id: string
  name: string
  email: string
  phone: string
  subscription_status: string
  subscription_ends_at: string
  created_at: string
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showModal, setShowModal] = useState(false)
  const supabase = createClient()

  useEffect(() => { fetchTenants() }, [])

  async function fetchTenants() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setTenants(data)
    setLoading(false)
  }

  async function handleActivateTenant(tenantId: string) {
    const { error } = await supabase
      .from('tenants')
      .update({
        subscription_status: 'active',
        subscription_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', tenantId)

    if (!error) {
      await fetchTenants()
      setShowModal(false)
    }
  }

  async function handleDeactivateTenant(tenantId: string) {
    const { error } = await supabase
      .from('tenants')
      .update({ subscription_status: 'cancelled' })
      .eq('id', tenantId)

    if (!error) {
      await fetchTenants()
      setShowModal(false)
    }
  }

  async function handleExtendTrial(tenantId: string, days: number) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('trial_ends_at')
      .eq('id', tenantId)
      .single()

    const currentEnd = tenant?.trial_ends_at ? new Date(tenant.trial_ends_at) : new Date()
    const newEnd = new Date(Math.max(currentEnd.getTime(), Date.now()) + days * 24 * 60 * 60 * 1000)

    const { error } = await supabase
      .from('tenants')
      .update({ trial_ends_at: newEnd.toISOString() })
      .eq('id', tenantId)

    if (!error) {
      await fetchTenants()
      setShowModal(false)
    }
  }

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = !searchQuery ||
      tenant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tenant.subscription_status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600">Manage all registered shops and businesses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Status</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Tenants List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading tenants...</div>
        ) : filteredTenants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No tenants found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Phone</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Created</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{tenant.name}</td>
                    <td className="py-3 px-4 text-gray-600">{tenant.email}</td>
                    <td className="py-3 px-4 text-gray-600">{tenant.phone}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        tenant.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                        tenant.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tenant.subscription_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => { setSelectedTenant(tenant); setShowModal(true) }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tenant Detail Modal */}
      {showModal && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Manage Tenant</h2>
              <div className="space-y-3 mb-6">
                <p><span className="font-medium">Name:</span> {selectedTenant.name}</p>
                <p><span className="font-medium">Email:</span> {selectedTenant.email}</p>
                <p><span className="font-medium">Phone:</span> {selectedTenant.phone}</p>
                <p><span className="font-medium">Status:</span> {selectedTenant.subscription_status}</p>
                {selectedTenant.subscription_ends_at && (
                  <p><span className="font-medium">Ends:</span> {new Date(selectedTenant.subscription_ends_at).toLocaleDateString('fr-FR')}</p>
                )}
              </div>

              <div className="space-y-2">
                {selectedTenant.subscription_status !== 'active' && (
                  <button
                    onClick={() => handleActivateTenant(selectedTenant.id)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Activate Subscription
                  </button>
                )}
                {selectedTenant.subscription_status === 'active' && (
                  <button
                    onClick={() => handleDeactivateTenant(selectedTenant.id)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Deactivate Subscription
                  </button>
                )}
                {selectedTenant.subscription_status === 'trial' && (
                  <>
                    <button
                      onClick={() => handleExtendTrial(selectedTenant.id, 7)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Extend Trial +7 Days
                    </button>
                    <button
                      onClick={() => handleExtendTrial(selectedTenant.id, 30)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Extend Trial +30 Days
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="border-t px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}