'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const TYPE_ICONS: Record<string, string> = {
  bug: '🐛',
  feature: '💡',
  improvement: '⚡',
  question: '❓',
  other: '💬',
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  reviewing: 'bg-yellow-100 text-yellow-800',
  planned: 'bg-purple-100 text-purple-800',
  implemented: 'bg-green-100 text-green-800',
  declined: 'bg-gray-100 text-gray-800',
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [newFeedback, setNewFeedback] = useState({
    type: 'feature',
    title: '',
    description: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchFeedback() }, [filter])

  async function fetchFeedback() {
    setLoading(true)

    let query = supabase
      .from('feedback')
      .select('*, user:users(full_name), votes:feedback_votes(vote)')

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query.order('created_at', { ascending: false })

    if (data) {
      const feedbackWithScore = data.map(f => ({
        ...f,
        score: (f.votes || []).reduce((sum: number, v: any) => sum + v.vote, 0),
      }))
      setFeedback(feedbackWithScore.sort((a, b) => b.score - a.score))
    }

    setLoading(false)
  }

  async function submitFeedback() {
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) throw new Error('No tenant found')

      const { error: insertError } = await supabase
        .from('feedback')
        .insert({
          tenant_id: userData.tenant_id,
          user_id: user.id,
          type: newFeedback.type,
          title: newFeedback.title,
          description: newFeedback.description,
        })

      if (insertError) throw insertError

      setShowForm(false)
      setNewFeedback({ type: 'feature', title: '', description: '' })
      await fetchFeedback()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function vote(feedbackId: string, vote: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('feedback_votes')
      .upsert({
        feedback_id: feedbackId,
        user_id: user.id,
        vote,
      })

    if (!error) await fetchFeedback()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
              <h1 className="text-lg font-medium">Feedback</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-4 border-b">
                <h3 className="font-medium">Submit Feedback</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newFeedback.type}
                    onChange={(e) => setNewFeedback({ ...newFeedback, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="feature">Feature Request</option>
                    <option value="bug">Bug Report</option>
                    <option value="improvement">Improvement</option>
                    <option value="question">Question</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newFeedback.title}
                    onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief summary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newFeedback.description}
                    onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Please describe in detail..."
                  />
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={submitFeedback}
                    disabled={saving || !newFeedback.title || !newFeedback.description}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Submitting...' : 'Submit'}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setError('') }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['all', 'new', 'reviewing', 'planned', 'implemented', 'declined'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : feedback.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No feedback found</div>
          ) : (
            feedback.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex gap-4">
                  {/* Vote buttons */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => vote(item.id, 1)}
                      className="text-gray-400 hover:text-green-600"
                    >
                      ▲
                    </button>
                    <span className={`font-medium ${item.score > 0 ? 'text-green-600' : item.score < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {item.score}
                    </span>
                    <button
                      onClick={() => vote(item.id, -1)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{TYPE_ICONS[item.type]}</span>
                      <h3 className="font-medium">{item.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded ${STATUS_COLORS[item.status]}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>By {item.user?.full_name || 'Unknown'}</span>
                      <span>{new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {item.admin_response && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">Admin Response:</p>
                        <p className="text-sm text-blue-700">{item.admin_response}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}