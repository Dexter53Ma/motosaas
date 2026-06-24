'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  overall: 'Overall Experience',
  payment: 'Payment Behavior',
  vehicle_care: 'Vehicle Care',
  communication: 'Communication',
  punctuality: 'Punctuality',
}

export default function CustomerRatingsPage() {
  const [ratings, setRatings] = useState<any[]>([])
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    byCategory: {} as Record<string, { count: number; sum: number }>,
  })
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => { fetchData() }, [params.id])

  async function fetchData() {
    setLoading(true)

    const { data: customerData } = await supabase
      .from('customers')
      .select('*')
      .eq('id', params.id)
      .single()

    if (customerData) setCustomer(customerData)

    const { data: ratingsData } = await supabase
      .from('customer_ratings')
      .select('*, rated_by_user:users(full_name), rental:rentals(start_date, end_date)')
      .eq('customer_id', params.id)
      .order('created_at', { ascending: false })

    if (ratingsData) {
      setRatings(ratingsData)

      const byCategory: Record<string, { count: number; sum: number }> = {}
      ratingsData.forEach((r) => {
        if (!byCategory[r.category]) byCategory[r.category] = { count: 0, sum: 0 }
        byCategory[r.category].count++
        byCategory[r.category].sum += r.rating
      })

      const total = ratingsData.length
      const sum = ratingsData.reduce((acc, r) => acc + r.rating, 0)
      setStats({
        total,
        average: total > 0 ? sum / total : 0,
        byCategory,
      })
    }

    setLoading(false)
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
              <h1 className="text-2xl font-bold text-gray-900">Customer Ratings</h1>
              <p className="text-gray-600">{customer?.full_name}</p>
            </div>
          </div>
          <Link
            href={`/dashboard/customers/${params.id}`}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            View Customer
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Ratings</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{stats.average.toFixed(1)}</p>
              <span className="text-yellow-400 text-xl">★</span>
            </div>
          </div>
          {Object.entries(stats.byCategory).slice(0, 3).map(([category, data]) => (
            <div key={category} className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">{CATEGORY_LABELS[category] || category}</p>
              <p className="text-2xl font-bold">{(data.sum / data.count).toFixed(1)}</p>
            </div>
          ))}
        </div>

        {/* Ratings List */}
        <div className="bg-white rounded-lg shadow">
          {ratings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No ratings found</div>
          ) : (
            <div className="divide-y">
              {ratings.map((rating) => (
                <div key={rating.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= rating.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">{rating.rating}/5</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                          {CATEGORY_LABELS[rating.category] || rating.category}
                        </span>
                      </div>
                      {rating.comment && (
                        <p className="text-gray-700 mt-1">{rating.comment}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>By: {rating.rated_by_user?.full_name}</span>
                        <span>
                          Rental: {rating.rental?.start_date && new Date(rating.rental.start_date).toLocaleDateString('fr-FR')}
                          {' - '}
                          {rating.rental?.end_date && new Date(rating.rental.end_date).toLocaleDateString('fr-FR')}
                        </span>
                        <span>{new Date(rating.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
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