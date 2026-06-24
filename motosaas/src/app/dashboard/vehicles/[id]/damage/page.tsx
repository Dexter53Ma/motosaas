'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const SEVERITY_COLORS: Record<string, string> = {
  minor: 'bg-yellow-100 text-yellow-800',
  moderate: 'bg-orange-100 text-orange-800',
  major: 'bg-red-100 text-red-800',
  total: 'bg-red-600 text-white',
}

const STATUS_COLORS: Record<string, string> = {
  reported: 'bg-blue-100 text-blue-800',
  assessed: 'bg-purple-100 text-purple-800',
  repaired: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

export default function VehicleDamagePage() {
  const [damages, setDamages] = useState<any[]>([])
  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    totalCost: 0,
    bySeverity: {} as Record<string, number>,
  })
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => { fetchData() }, [params.id])

  async function fetchData() {
    setLoading(true)

    const { data: vehicleData } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', params.id)
      .single()

    if (vehicleData) setVehicle(vehicleData)

    const { data: damagesData } = await supabase
      .from('damage_reports')
      .select('*, customer:customers(first_name, last_name), reported_by_user:users(full_name)')
      .eq('vehicle_id', params.id)
      .order('created_at', { ascending: false })

    if (damagesData) {
      setDamages(damagesData)
      const totalCost = damagesData.reduce((sum, d) => sum + (d.actual_cost || d.estimated_cost || 0), 0)
      const bySeverity: Record<string, number> = {}
      damagesData.forEach(d => {
        bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1
      })
      setStats({ total: damagesData.length, totalCost, bySeverity })
    }

    setLoading(false)
  }

  async function handleUpdateStatus(damageId: string, status: string) {
    const { error } = await supabase
      .from('damage_reports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', damageId)

    if (!error) await fetchData()
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">&larr; Back</button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Damage History</h1>
              <p className="text-gray-600">{vehicle?.make} {vehicle?.model} ({vehicle?.license_plate})</p>
            </div>
          </div>
          <Link
            href={`/dashboard/vehicles/${params.id}`}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            View Vehicle
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Reports</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Cost</p>
            <p className="text-2xl font-bold text-red-600">{stats.totalCost.toLocaleString()} MAD</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Minor</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.bySeverity.minor || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Major/Total</p>
            <p className="text-2xl font-bold text-red-600">
              {(stats.bySeverity.major || 0) + (stats.bySeverity.total || 0)}
            </p>
          </div>
        </div>

        {/* Damage List */}
        <div className="bg-white rounded-lg shadow">
          {damages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No damage reports found</div>
          ) : (
            <div className="divide-y">
              {damages.map((damage) => (
                <div key={damage.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${SEVERITY_COLORS[damage.severity]}`}>
                          {damage.severity}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[damage.status]}`}>
                          {damage.status}
                        </span>
                        <span className="text-sm text-gray-500">{damage.damage_type}</span>
                      </div>
                      <p className="font-medium">{damage.location}</p>
                      <p className="text-sm text-gray-600 mt-1">{damage.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Customer: {damage.customer?.first_name} {damage.customer?.last_name}</span>
                        <span>Reported by: {damage.reported_by_user?.full_name}</span>
                        <span>{new Date(damage.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {damage.estimated_cost > 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          Estimated: {damage.estimated_cost.toLocaleString()} MAD
                          {damage.actual_cost > 0 && ` | Actual: ${damage.actual_cost.toLocaleString()} MAD`}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {damage.status === 'reported' && (
                        <button
                          onClick={() => handleUpdateStatus(damage.id, 'assessed')}
                          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                        >
                          Assess
                        </button>
                      )}
                      {damage.status === 'assessed' && (
                        <button
                          onClick={() => handleUpdateStatus(damage.id, 'repaired')}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Mark Repaired
                        </button>
                      )}
                      {damage.status === 'repaired' && (
                        <button
                          onClick={() => handleUpdateStatus(damage.id, 'closed')}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}