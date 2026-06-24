'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Save, Building2, CreditCard } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

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
  const { t } = useI18n()
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

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)

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

    if (userProfile.role !== 'owner') {
      setError(t('settings.owner_only'))
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
      toast.error(t('settings.saved'))
    } else {
      setSuccess(true)
      toast.success(t('settings.saved'))
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
      </div>
    )
  }

  const isOwner = userProfile?.role === 'owner'

  const statusConfig: Record<string, { label: string; className: string }> = {
    trial: { label: t('settings.free_trial'), className: 'bg-blue-100 text-blue-700 border-blue-200' },
    active: { label: t('settings.active'), className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    expired: { label: t('settings.expired'), className: 'bg-red-100 text-red-700 border-red-200' },
    suspended: { label: t('settings.suspended'), className: 'bg-gray-100 text-gray-700 border-gray-200' },
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('settings.title')}</h1>

        {!isOwner && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
            {t('settings.owner_only')}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded mb-6">
            {t('settings.saved')}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              <div>
                <CardTitle>{t('settings.basic_info')}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{t('settings.basic_info_desc')}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.shop_name')}</label>
              <Input
                type="text"
                value={tenant?.name || ''}
                onChange={(e) => setTenant({ ...tenant!, name: e.target.value })}
                disabled={!isOwner}
                className="focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.shop_phone')}</label>
              <Input
                type="tel"
                value={tenant?.phone || ''}
                onChange={(e) => setTenant({ ...tenant!, phone: e.target.value })}
                disabled={!isOwner}
                placeholder="+212 5XX-XXXXXX"
                className="focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.address')}</label>
              <Input
                type="text"
                value={tenant?.address || ''}
                onChange={(e) => setTenant({ ...tenant!, address: e.target.value })}
                disabled={!isOwner}
                placeholder="123 Rue Mohammed V, Casablanca"
                className="focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.email')}</label>
              <Input
                type="email"
                value={tenant?.email || ''}
                disabled
                className="bg-gray-50 text-gray-500"
              />
              <p className="mt-1 text-sm text-gray-500">{t('settings.email_cannot_change')}</p>
            </div>
          </CardContent>

          <div className="px-6 pb-6">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-base">{t('settings.business_info')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.tax_id')}</label>
                  <Input
                    type="text"
                    value={tenant?.tax_id || ''}
                    onChange={(e) => setTenant({ ...tenant!, tax_id: e.target.value })}
                    disabled={!isOwner}
                    placeholder="001234567000001"
                    className="focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">Identifiant Commun de l&apos;Entreprise</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.rc_number')}</label>
                  <Input
                    type="text"
                    value={tenant?.rc_number || ''}
                    onChange={(e) => setTenant({ ...tenant!, rc_number: e.target.value })}
                    disabled={!isOwner}
                    placeholder="12345"
                    className="focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">Registre Commerce number</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {isOwner && (
            <div className="px-6 pb-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('settings.save_changes')}
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              <CardTitle>{t('settings.subscription')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('common.status')}</span>
              <Badge
                variant="outline"
                className={statusConfig[tenant?.subscription_status || '']?.className || 'bg-gray-100 text-gray-700 border-gray-200'}
              >
                {statusConfig[tenant?.subscription_status || '']?.label || tenant?.subscription_status}
              </Badge>
            </div>
            {tenant?.subscription_status === 'trial' && tenant?.trial_ends_at && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('settings.trial_ends')}</span>
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
              <span className="text-sm text-gray-600">{t('settings.plan')}</span>
              <span className="text-sm text-gray-900">{t('settings.pro')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t('settings.price')}</span>
              <span className="text-sm text-gray-900">100 MAD/month or 500 MAD/year</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
