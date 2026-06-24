'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Location {
  id: string
  name: string
  address: string | null
  city: string | null
  is_main: boolean
}

interface LocationSelectorProps {
  value: string | null
  onChange: (locationId: string | null) => void
  showAll?: boolean
  label?: string
}

export default function LocationSelector({ value, onChange, showAll = false, label = 'Location' }: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { fetchLocations() }, [])

  async function fetchLocations() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) return

    const { data } = await supabase
      .from('locations')
      .select('id, name, address, city, is_main')
      .eq('tenant_id', userData.tenant_id)
      .eq('is_active', true)
      .order('is_main', { ascending: false })
      .order('name')

    if (data) setLocations(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        {showAll && <option value="">All Locations</option>}
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name} {loc.is_main ? '(Main)' : ''} {loc.city ? `- ${loc.city}` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}