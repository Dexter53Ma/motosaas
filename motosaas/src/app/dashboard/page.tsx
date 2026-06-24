import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardContent from '@/components/DashboardContent'

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
    <DashboardContent
      user={user}
      userProfile={userProfile}
      tenant={tenant}
      trialDaysRemaining={trialDaysRemaining}
    />
  )
}