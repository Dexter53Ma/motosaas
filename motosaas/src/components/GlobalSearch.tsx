'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  type: 'customer' | 'vehicle' | 'rental' | 'payment'
  title: string
  subtitle: string
  url: string
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const debounce = setTimeout(async () => {
      setLoading(true)
      const searchTerm = `%${query}%`
      const allResults: SearchResult[] = []

      const [customers, vehicles] = await Promise.all([
        supabase.from('customers').select('id, full_name, phone').ilike('full_name', searchTerm).limit(3),
        supabase.from('vehicles').select('id, make, model, license_plate').or(`make.ilike.${searchTerm},model.ilike.${searchTerm},license_plate.ilike.${searchTerm}`).limit(3),
      ])

      if (customers.data) {
        allResults.push(...customers.data.map(c => ({
          id: c.id,
          type: 'customer' as const,
          title: c.full_name,
          subtitle: c.phone || '',
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

      setResults(allResults.slice(0, 5))
      setLoading(false)
    }, 200)

    return () => clearTimeout(debounce)
  }, [query])

  const typeIcons: Record<string, string> = {
    customer: '👤',
    vehicle: '🚗',
    rental: '📋',
    payment: '💰',
  }

  return (
    <div className="relative">
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search..."
          className="bg-transparent border-none outline-none text-sm w-32 focus:w-48 transition-all"
        />
        <kbd className="hidden md:inline-block px-1.5 py-0.5 text-xs text-gray-500 bg-gray-200 rounded">⌘K</kbd>
      </div>

      {isOpen && (query || results.length > 0) && (
        <div className="absolute top-full mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : results.length > 0 ? (
            <div className="divide-y max-h-80 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => { router.push(result.url); setIsOpen(false); setQuery('') }}
                  className="w-full p-3 hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span>{typeIcons[result.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-center text-gray-500 text-sm">No results</div>
          ) : null}
          <div className="p-2 border-t">
            <button
              onClick={() => { router.push(`/dashboard/search?q=${query}`); setIsOpen(false) }}
              className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-gray-50 rounded text-left"
            >
              View all results →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}