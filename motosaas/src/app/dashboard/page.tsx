import { createClient } from '@/lib/supabase/server'
import DashboardContent from '@/components/DashboardContent'
import { PageTransition } from '@/components/PageTransition'

import { useI18n } from '@/lib/i18n'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">
          Not authenticated. <a href="/login" className="text-emerald-600 underline">Go to login</a>
        </p>
      </div>
    )
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  let tenant = null
  if (userProfile?.tenant_id) {
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', userProfile.tenant_id)
      .single()
    tenant = data
  }

  // Fetch stats
  const [vehiclesResult, rentalsResult, customersResult, paymentsResult] = await Promise.all([
    supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('tenant_id', userProfile?.tenant_id),
    supabase.from('rentals').select('id, status, total_amount, created_at', { count: 'exact' }).eq('tenant_id', userProfile?.tenant_id),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', userProfile?.tenant_id),
    supabase.from('payments').select('amount, created_at').eq('tenant_id', userProfile?.tenant_id),
  ])

  const totalVehicles = vehiclesResult.count ?? 0
  const allRentals = rentalsResult.data ?? []
  const activeRentals = allRentals.filter((r: any) => r.status === 'active').length
  const totalCustomers = customersResult.count ?? 0
  const totalPayments = (paymentsResult.data ?? []).reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0)
  const totalRentalValue = allRentals.reduce((sum: number, r: any) => sum + (r.total_amount ?? 0), 0)
  const outstanding = Math.max(0, totalRentalValue - totalPayments)

  // Rental status distribution for pie chart
  const rentalStatusCounts = {
    active: allRentals.filter((r: any) => r.status === 'active').length,
    completed: allRentals.filter((r: any) => r.status === 'completed').length,
    overdue: allRentals.filter((r: any) => r.status === 'overdue').length,
  }

  // Monthly revenue for the last 6 months
  const monthlyRevenue: { month: string; revenue: number }[] = []
  const allPayments = paymentsResult.data ?? []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthLabel = d.toLocaleString('en', { month: 'short' })
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const revenue = allPayments
      .filter((p: any) => p.created_at && p.created_at.startsWith(monthKey))
      .reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0)
    monthlyRevenue.push({ month: monthLabel, revenue })
  }

  // Fetch recent rentals with joined customer and vehicle data
  const { data: recentRentalsRaw } = await supabase
    .from('rentals')
    .select('id, status, start_date, end_date, total_amount, customer_id, vehicle_id, customers(full_name), vehicles(make, model)')
    .eq('tenant_id', userProfile?.tenant_id)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentRentals = (recentRentalsRaw ?? []).map((rental: any) => ({
    ...rental,
    customer_name: rental.customers?.full_name ?? '—',
    vehicle_name: rental.vehicles ? `${rental.vehicles.make} ${rental.vehicles.model}` : '—',
  }))

  const trialEndsAt = tenant?.trial_ends_at ? new Date(tenant.trial_ends_at) : null
  const trialDaysRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <PageTransition>
      <DashboardContent
        user={user}
        userProfile={userProfile}
        tenant={tenant}
        trialDaysRemaining={trialDaysRemaining}
        stats={{
          totalVehicles,
          activeRentals,
          outstanding,
          totalCustomers,
        }}
        rentalStatusCounts={rentalStatusCounts}
        monthlyRevenue={monthlyRevenue}
        recentRentals={recentRentals}
      />
    </PageTransition>
  )
}
