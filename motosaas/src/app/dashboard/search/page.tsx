'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Users, Car, FileText, DollarSign } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import Link from 'next/link'

interface SearchResult {
  id: string
  type: 'customer' | 'vehicle' | 'rental' | 'payment'
  title: string
  subtitle: string
  url: string
}

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  customer: { icon: Users, color: 'bg-emerald-100 text-emerald-700' },
  vehicle: { icon: Car, color: 'bg-blue-100 text-blue-700' },
  rental: { icon: FileText, color: 'bg-purple-100 text-purple-700' },
  payment: { icon: DollarSign, color: 'bg-orange-100 text-orange-700' },
}

export default function SearchPage() {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) setRecentSearches(JSON.parse(saved))
  }, [])

  const saveSearch = useCallback((search: string) => {
    if (!search.trim()) return
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 10)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }, [recentSearches])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    const searchTerm = `%${q}%`
    const allResults: SearchResult[] = []

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData?.tenant_id) { setLoading(false); return }

    const [customers, vehicles, rentals, payments] = await Promise.all([
      supabase.from('customers').select('id, full_name, phone, email').eq('tenant_id', userData.tenant_id).ilike('full_name', searchTerm).limit(5),
      supabase.from('vehicles').select('id, make, model, license_plate').eq('tenant_id', userData.tenant_id).or(`make.ilike.${searchTerm},model.ilike.${searchTerm},license_plate.ilike.${searchTerm}`).limit(5),
      supabase.from('rentals').select('id, status, start_date, customer:customers(full_name), vehicle:vehicles(make, model, license_plate)').eq('tenant_id', userData.tenant_id).limit(5),
      supabase.from('payments').select('id, amount, payment_method, customer:customers(full_name)').eq('tenant_id', userData.tenant_id).ilike('reference_number', searchTerm).limit(5),
    ])

    if (customers.data) {
      allResults.push(...customers.data.map(c => ({
        id: c.id,
        type: 'customer' as const,
        title: c.full_name,
        subtitle: [c.phone, c.email].filter(Boolean).join(' • '),
        url: `/dashboard/customers/${c.id}`,
      })))
    }

    if (vehicles.data) {
      allResults.push(...vehicles.data.map(v => ({
        id: v.id,
        type: 'vehicle' as const,
        title: `${v.make} ${v.model}`,
        subtitle: v.license_plate,
        url: `/dashboard/vehicles/${v.id}`,
      })))
    }

    if (rentals.data) {
      allResults.push(...rentals.data.map(r => ({
        id: r.id,
        type: 'rental' as const,
        title: `Rental - ${(r.customer as any)?.full_name || 'Unknown'}`,
        subtitle: `${(r.vehicle as any)?.make} ${(r.vehicle as any)?.model} • ${r.status}`,
        url: `/dashboard/rentals/${r.id}`,
      })))
    }

    if (payments.data) {
      allResults.push(...payments.data.map(p => ({
        id: p.id,
        type: 'payment' as const,
        title: `${p.amount} MAD - ${(p.customer as any)?.full_name || 'Unknown'}`,
        subtitle: p.payment_method?.replace('_', ' ') || '',
        url: `/dashboard/payments/${p.id}`,
      })))
    }

    setResults(allResults)
    setLoading(false)
    saveSearch(q)
  }, [saveSearch])

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query) search(query)
    }, 300)

    return () => clearTimeout(debounce)
  }, [query])

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="pl-12 py-3 text-lg"
            autoFocus
          />
          {loading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {!query && recentSearches.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-500 mb-3">{t('search.recent')}</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, i) => (
                  <Button
                    key={i}
                    variant="secondary"
                    size="sm"
                    onClick={() => setQuery(search)}
                    className="rounded-full"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {results.length > 0 && (
          <Card>
            <CardContent className="p-0 divide-y">
              {results.map((result) => {
                const config = TYPE_CONFIG[result.type]
                const Icon = config.icon
                return (
                  <Link
                    key={result.id}
                    href={result.url}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{result.title}</p>
                        <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{result.type}</Badge>
                    </div>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        )}

        {query && !loading && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('search.no_results')} &quot;{query}&quot;</p>
          </div>
        )}

        {!query && recentSearches.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">{t('search.start_typing')}</p>
            <div className="flex justify-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Users className="size-4" /> Customers</span>
              <span className="flex items-center gap-1"><Car className="size-4" /> Vehicles</span>
              <span className="flex items-center gap-1"><FileText className="size-4" /> Rentals</span>
              <span className="flex items-center gap-1"><DollarSign className="size-4" /> Payments</span>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
