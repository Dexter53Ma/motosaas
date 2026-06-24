'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  type: 'customer' | 'vehicle' | 'rental' | 'payment'
  title: string
  subtitle: string
  url: string
}

export default function SearchPage() {
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

    const [customers, vehicles, rentals, payments] = await Promise.all([
      supabase.from('customers').select('id, full_name, phone, email').ilike('full_name', searchTerm).limit(5),
      supabase.from('vehicles').select('id, make, model, license_plate').or(`make.ilike.${searchTerm},model.ilike.${searchTerm},license_plate.ilike.${searchTerm}`).limit(5),
      supabase.from('rentals').select('id, status, start_date, customer:customers(full_name), vehicle:vehicles(make, model, license_plate)').limit(5),
      supabase.from('payments').select('id, amount, payment_method, customer:customers(full_name)').ilike('reference', searchTerm).limit(5),
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

  const typeIcons: Record<string, string> = {
    customer: '👤',
    vehicle: '🚗',
    rental: '📋',
    payment: '💰',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
              <h1 className="text-lg font-medium">Search</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Search Input */}
        <div className="relative mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, vehicles, rentals, payments..."
            className="w-full px-4 py-3 pl-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {loading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Recent Searches */}
        {!query && recentSearches.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Searches</h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(search)}
                  className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow divide-y">
            {results.map((result) => (
              <Link
                key={result.id}
                href={result.url}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeIcons[result.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{result.title}</p>
                    <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{result.type}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* No Results */}
        {query && !loading && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No results found for &quot;{query}&quot;</p>
          </div>
        )}

        {/* Empty State */}
        {!query && recentSearches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Start typing to search across all your data</p>
            <div className="flex justify-center gap-4 text-sm text-gray-400">
              <span>👤 Customers</span>
              <span>🚗 Vehicles</span>
              <span>📋 Rentals</span>
              <span>💰 Payments</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}