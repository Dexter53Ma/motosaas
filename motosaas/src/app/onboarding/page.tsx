'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getTenant = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setTenant(data)
      }
      setLoading(false)
    }

    getTenant()
  }, [supabase, router])

  const handleUpdateTenant = async (updates: Partial<Tenant>) => {
    if (!tenant) return

    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', tenant.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return false
    }

    setTenant({ ...tenant, ...updates })
    setSaving(false)
    return true
  }

  const completeOnboarding = async () => {
    await handleUpdateTenant({/* mark onboarding complete if needed */})
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to MotoRent!</h1>
          <p className="mt-2 text-gray-600">Let&apos;s set up your shop in a few steps</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">Step {step} of 3</span>
            <span className="text-sm text-gray-500">{Math.round((step / 3) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Shop Details */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Shop Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shop Name</label>
                  <input
                    type="text"
                    value={tenant?.name || ''}
                    onChange={(e) => setTenant({ ...tenant!, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shop Phone</label>
                  <input
                    type="tel"
                    value={tenant?.phone || ''}
                    onChange={(e) => setTenant({ ...tenant!, phone: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+212 5XX-XXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    value={tenant?.address || ''}
                    onChange={(e) => setTenant({ ...tenant!, address: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123 Rue Mohammed V, Casablanca"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Info */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Business Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tax ID (ICE)</label>
                  <input
                    type="text"
                    value={tenant?.tax_id || ''}
                    onChange={(e) => setTenant({ ...tenant!, tax_id: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="12345"
                  />
                  <p className="mt-1 text-sm text-gray-500">Registre Commerce number</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">You&apos;re all set!</h2>
              <p className="text-gray-600 mb-6">
                Your shop <span className="font-medium">{tenant?.name}</span> is ready.
                <br />You have 30 days of free trial.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-medium text-blue-900 mb-2">Next steps:</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Add your first vehicles to the inventory</li>
                  <li>• Connect your WhatsApp for reminders</li>
                  <li>• Start creating rentals</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={async () => {
                  const success = await handleUpdateTenant({
                    name: tenant?.name,
                    phone: tenant?.phone,
                    address: tenant?.address,
                    tax_id: tenant?.tax_id,
                    rc_number: tenant?.rc_number,
                  })
                  if (success) setStep(step + 1)
                }}
                disabled={saving}
                className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Continue'}
              </button>
            ) : (
              <button
                type="button"
                onClick={completeOnboarding}
                className="ml-auto px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
