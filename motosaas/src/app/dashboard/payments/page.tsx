'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { Search, Plus, CreditCard, TrendingUp, Calendar, Hash } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  payment_method: string
  created_at: string
  reference_number?: string
  notes?: string
  rental?: {
    id: string
    vehicle?: { make: string; model: string; year: number }
  }
  customer?: {
    id: string
    full_name: string
    phone: string
  }
}

const METHOD_BADGE: Record<string, string> = {
  cash: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  card: 'bg-blue-100 text-blue-700 border-blue-200',
  bank_transfer: 'bg-purple-100 text-purple-700 border-purple-200',
  mobile_money: 'bg-orange-100 text-orange-700 border-orange-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
}

export default function PaymentsPage() {
  const { t } = useI18n()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [stats, setStats] = useState({ totalRevenue: 0, todayRevenue: 0, monthRevenue: 0 })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { fetchPayments() }, [])

  async function fetchPayments() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*, rental:rentals(id, vehicle:vehicles(make, model, year)), customer:customers(id, full_name, phone)')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false })

    if (paymentsData) {
      setPayments(paymentsData)
      const today = new Date().toISOString().split('T')[0]
      const thisMonth = new Date().toISOString().slice(0, 7)
      setStats({
        totalRevenue: paymentsData.reduce((s, p) => s + (p.amount || 0), 0),
        todayRevenue: paymentsData.filter(p => p.created_at?.startsWith(today)).reduce((s, p) => s + (p.amount || 0), 0),
        monthRevenue: paymentsData.filter(p => p.created_at?.startsWith(thisMonth)).reduce((s, p) => s + (p.amount || 0), 0),
      })
    }
    setLoading(false)
  }

  const filtered = payments.filter(p => {
    const matchSearch = !searchQuery ||
      p.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchMethod = methodFilter === 'all' || p.payment_method === methodFilter
    return matchSearch && matchMethod
  })

  return (
    <PageTransition>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('payments.title')}</h1>
            <p className="text-gray-600">{t('payments.track')}</p>
          </div>
          <Link href="/dashboard/payments/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              {t('payments.record')}
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('payments.total_revenue')}</p>
                  <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} MAD</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('payments.today')}</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.todayRevenue.toLocaleString()} MAD</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('payments.this_month')}</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.monthRevenue.toLocaleString()} MAD</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Hash className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('payments.transactions')}</p>
                  <p className="text-2xl font-bold">{payments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('payments.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="flex h-10 w-auto items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <option value="all">{t('payments.all_methods')}</option>
            <option value="cash">{t('payments.cash')}</option>
            <option value="card">{t('payments.card')}</option>
            <option value="bank_transfer">{t('payments.bank_transfer')}</option>
            <option value="mobile_money">{t('payments.mobile_money')}</option>
          </select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500">{t('payments.loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t('payments.no_payments')}</div>
            ) : (
              <div className="divide-y">
                {filtered.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors"
                    onClick={() => router.push(`/dashboard/payments/${payment.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <CreditCard className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={cn('text-xs capitalize', METHOD_BADGE[payment.payment_method] || 'bg-gray-100 text-gray-700 border-gray-200')}
                          >
                            {payment.payment_method.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="font-medium">{payment.customer?.full_name}</p>
                        <p className="text-sm text-gray-500">
                          {payment.rental?.vehicle?.make} {payment.rental?.vehicle?.model}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">+{payment.amount?.toLocaleString()} MAD</p>
                      <p className="text-sm text-gray-500">{new Date(payment.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </PageTransition>
  )
}
