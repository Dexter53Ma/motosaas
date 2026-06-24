'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { Search, Plus, Users, Crown, Ban } from 'lucide-react'

interface Customer {
  id: string
  full_name: string
  phone: string
  email: string | null
  id_number: string | null
  tags: string[]
  loyalty_score: number
  created_at: string
}

export default function CustomersPage() {
  const { t } = useI18n()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('all')
  const [tenantId, setTenantId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (userData) setTenantId(userData.tenant_id)
    }
    init()
  }, [supabase])

  useEffect(() => {
    if (!tenantId) return

    const getCustomers = async () => {
      let query = supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId)

      // Apply tag filter
      if (tagFilter !== 'all') {
        query = query.contains('tags', [tagFilter])
      }

      // Apply search
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
      }

      query = query.order('created_at', { ascending: false })

      const { data } = await query
      if (data) {
        setCustomers(data)
      }
      setLoading(false)
    }

    getCustomers()
  }, [supabase, search, tagFilter, tenantId])

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'vip': return 'bg-purple-100 text-purple-800 hover:bg-purple-200'
      case 'blacklisted': return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'regular': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const getCustomerStats = () => {
    const total = customers.length
    const vip = customers.filter(c => c.tags?.includes('vip')).length
    const blacklisted = customers.filter(c => c.tags?.includes('blacklisted')).length
    return { total, vip, blacklisted }
  }

  const stats = getCustomerStats()

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('customers.title')}</h1>
            <p className="text-gray-600">{t('customers.manage')}</p>
          </div>
          <Link href="/dashboard/customers/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              {t('customers.add')}
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('customers.total')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Crown className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('customers.vip_count')}</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.vip}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Ban className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('customers.blacklisted_count')}</p>
                  <p className="text-2xl font-bold text-red-600">{stats.blacklisted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('customers.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="h-10 px-4 border border-emerald-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm"
                >
                  <option value="all">{t('customers.all')}</option>
                  <option value="vip">{t('customers.vip')}</option>
                  <option value="regular">{t('customers.regular')}</option>
                  <option value="blacklisted">{t('customers.blacklisted')}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer list */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </CardContent>
          </Card>
        ) : customers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('customers.no_customers')}</h3>
              <p className="text-gray-500 mb-4">{t('customers.empty_state')}</p>
              <Link href="/dashboard/customers/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.customer')}</TableHead>
                  <TableHead>{t('customers.contact')}</TableHead>
                  <TableHead>{t('customers.tags')}</TableHead>
                  <TableHead>{t('customers.since')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-emerald-600 font-medium">
                            {customer.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {customer.full_name}
                          </div>
                          {customer.id_number && (
                            <div className="text-sm text-gray-500">
                              ID: {customer.id_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{customer.phone}</div>
                      {customer.email && (
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {customer.tags?.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className={cn(getTagColor(tag))}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/customers/${customer.id}`}>
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                          {t('common.view')}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
