'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RatingFormProps {
  customerId: string
  rentalId: string
  onRatingSubmitted?: (rating: any) => void
  onCancel?: () => void
}

const CATEGORIES = [
  { value: 'overall', label: 'Overall Experience' },
  { value: 'payment', label: 'Payment Behavior' },
  { value: 'vehicle_care', label: 'Vehicle Care' },
  { value: 'communication', label: 'Communication' },
  { value: 'punctuality', label: 'Punctuality' },
]

export default function RatingForm({ customerId, rentalId, onRatingSubmitted, onCancel }: RatingFormProps) {
  const [formData, setFormData] = useState({
    rating: 0,
    category: 'overall',
    comment: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hoveredStar, setHoveredStar] = useState(0)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (formData.rating === 0) {
      setError('Please select a rating')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) throw new Error('No tenant found')

      const { data: rating, error: ratingError } = await supabase
        .from('customer_ratings')
        .insert({
          tenant_id: userData.tenant_id,
          customer_id: customerId,
          rental_id: rentalId,
          rated_by: user.id,
          rating: formData.rating,
          category: formData.category,
          comment: formData.comment || null,
        })
        .select()
        .single()

      if (ratingError) throw ratingError

      onRatingSubmitted?.(rating)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setFormData({ ...formData, rating: star })}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="text-3xl focus:outline-none"
            >
              <span className={
                star <= (hoveredStar || formData.rating)
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }>
                ★
              </span>
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600 self-center">
            {formData.rating > 0 && `${formData.rating}/5`}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          rows={3}
          placeholder="Optional feedback about this customer..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || formData.rating === 0}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Rating'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}