'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Tenant {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  tax_id: string | null
  rc_number: string | null
  logo_url: string | null
  subscription_status: string
  trial_ends_at: string | null
}

interface UserProfile {
  id: string
  full_name: string
  role: string
}

export default function SettingsPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)

        // Get tenant
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profile.tenant_id)
          .single()

        if (tenantData) {
          setTenant(tenantData)
        }
      }
      setLoading(false)
    }

    getData()
  }, [supabase])

  const handleSave = async () => {
    if (!tenant || !userProfile) return

    // Only owners can update settings
    if (userProfile.role !== 'owner') {
      setError('Only the shop owner can modify settings')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error } = await supabase
      .from('tenants')
      .update({
        name: tenant.name,
        phone: tenant.phone,
        address: tenant.address,
        tax_id: tenant.tax_id,
        rc_number: tenant.rc_number,
      })
      .eq('id', tenant.id)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const isOwner = userProfile?.role === 'owner'

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shop Settings</h1>

      {!isOwner && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
          Only the shop owner can modify these settings. You have view-only access.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          Settings saved successfully!
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
          <p className="mt-1 text-sm text-gray-500">Update your shop&apos;s basic details</p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Shop Name</label>
            <input
              type="text"
              value={tenant?.name || ''}
              onChange={(e) => setTenant({ ...tenant!, name: e.target.value })}
              disabled={!isOwner}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Shop Phone</label>
            <input
              type="tel"
              value={tenant?.phone || ''}
              onChange={(e) => setTenant({ ...tenant!, phone: e.target.value })}
              disabled={!isOwner}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="+212 5XX-XXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              value={tenant?.address || ''}
              onChange={(e) => setTenant({ ...tenant!, address: e.target.value })}
              disabled={!isOwner}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="123 Rue Mohammed V, Casablanca"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={tenant?.email || ''}
              disabled
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Business Information</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tax ID (ICE)</label>
              <input
                type="text"
                value={tenant?.tax_id || ''}
                onChange={(e) => setTenant({ ...tenant!, tax_id: e.target.value })}
                disabled={!isOwner}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="001234567000001"
              />
              <p className="mt-1 text-sm text-gray-500">Identifiant Commun de l&apos;Entreprise</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">RC Number</label>
              <input
                type="text"
                value={tenant?.rc_number || ''}
                onChange={(e) => setTenant({ ...tenant!, rc_number: e.target.value })}
                disabled={!isOwner}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="12345"
              />
              <p className="mt-1 text-sm text-gray-500">Registre Commerce number</p>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Subscription Info */}
      <div className="mt-6 bg-white shadow rounded-lg">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Subscription</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`text-sm font-medium ${
                tenant?.subscription_status === 'active' ? 'text-green-600' :
                tenant?.subscription_status === 'trial' ? 'text-blue-600' :
                'text-red-600'
              }`}>
                {tenant?.subscription_status === 'trial' ? 'Free Trial' :
                 tenant?.subscription_status === 'active' ? 'Active' :
                 tenant?.subscription_status === 'expired' ? 'Expired' : 'Suspended'}
              </span>
            </div>
            {tenant?.subscription_status === 'trial' && tenant?.trial_ends_at && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Trial ends</span>
                <span className="text-sm text-gray-900">
                  {new Date(tenant.trial_ends_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Plan</span>
              <span className="text-sm text-gray-900">Pro</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Price</span>
              <span className="text-sm text-gray-900">100 MAD/month or 500 MAD/year</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
