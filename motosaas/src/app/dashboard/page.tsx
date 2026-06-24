import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile with tenant info
  const { data: userProfile } = await supabase
    .from('users')
    .select('*, tenants(*)')
    .eq('id', user.id)
    .single()

  const tenant = userProfile?.tenants

  // Calculate trial days remaining
  const trialEndsAt = tenant?.trial_ends_at
    ? new Date(tenant.trial_ends_at)
    : null
  const trialDaysRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">MotoRent</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {userProfile?.full_name || user.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to {tenant?.name || 'MotoRent'}!
            </h2>

            {tenant?.subscription_status === 'trial' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800">
                  <span className="font-semibold">Free Trial:</span> You have{' '}
                  <span className="font-bold">{trialDaysRemaining}</span> days
                  remaining. After your trial, the Pro plan is 100 MAD/month or
                  500 MAD/year.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Vehicle Inventory
                </h3>
                <p className="mt-2 text-3xl font-bold text-blue-600">0</p>
                <p className="text-sm text-gray-500">Vehicles registered</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Active Rentals
                </h3>
                <p className="mt-2 text-3xl font-bold text-green-600">0</p>
                <p className="text-sm text-gray-500">Currently rented out</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Outstanding Payments
                </h3>
                <p className="mt-2 text-3xl font-bold text-orange-600">0 MAD</p>
                <p className="text-sm text-gray-500">To be collected</p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition">
                  Add Vehicle
                </button>
                <button className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition">
                  New Rental
                </button>
                <button className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition">
                  Add Customer
                </button>
                <button className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition">
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
