'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronUp, ChevronDown, Send, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

const TYPE_ICONS: Record<string, string> = {
  bug: '🐛',
  feature: '💡',
  improvement: '⚡',
  question: '❓',
  other: '💬',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'default',
  reviewing: 'secondary',
  planned: 'outline',
  implemented: 'default',
  declined: 'secondary',
}

export default function FeedbackPage() {
  const { t } = useI18n()
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
  const [tenantId, setTenantId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (userData?.tenant_id) {
        setTenantId(userData.tenant_id)
        await fetchFeedback(userData.tenant_id)
      } else {
        setLoading(false)
      }
    }
    init()
  }, [filter])

  async function fetchFeedback(tid?: string) {
    setLoading(true)
    setError('')

    const id = tid || tenantId
    if (!id) { setLoading(false); return }

    try {
      let query = supabase
        .from('feedback')
        .select('*, user:users(full_name), votes:feedback_votes(vote)')
        .eq('tenant_id', id)

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      if (data) {
        const feedbackWithScore = data.map(f => ({
          ...f,
          score: (f.votes || []).reduce((sum: number, v: any) => sum + v.vote, 0),
        }))
        setFeedback(feedbackWithScore.sort((a, b) => b.score - a.score))
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load feedback')
    } finally {
      setLoading(false)
    }
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
          category: newFeedback.type,
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
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) return

      const { error } = await supabase
        .from('feedback_votes')
        .upsert({
          feedback_id: feedbackId,
          user_id: user.id,
          tenant_id: userData.tenant_id,
          vote,
        })

      if (!error) await fetchFeedback()
    } catch (err: any) {
      setError(err.message || 'Failed to vote')
    }
  }

  return (
    <PageTransition>
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('feedback.title')}</h1>
            <p className="text-gray-600">{t('feedback.description')}</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Send className="h-4 w-4 mr-2" />
            {t('feedback.submit')}
          </Button>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-4 border-b">
                <h3 className="font-medium">{t('feedback.title')}</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <Label>Type</Label>
                  <select
                    value={newFeedback.type}
                    onChange={(e) => setNewFeedback({ ...newFeedback, type: e.target.value })}
                    className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm"
                  >
                    <option value="feature">{t('feedback.feature_request')}</option>
                    <option value="bug">{t('feedback.bug_report')}</option>
                    <option value="improvement">{t('feedback.improvement')}</option>
                    <option value="question">{t('feedback.question')}</option>
                    <option value="other">{t('feedback.other')}</option>
                  </select>
                </div>
                <div>
                  <Label>{t('feedback.title_label')}</Label>
                  <Input
                    type="text"
                    value={newFeedback.title}
                    onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
                    required
                    placeholder={t('feedback.brief_summary')}
                  />
                </div>
                <div>
                  <Label>{t('feedback.description')}</Label>
                  <textarea
                    value={newFeedback.description}
                    onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                    placeholder={t('feedback.detail_desc')}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={submitFeedback}
                    disabled={saving || !newFeedback.title || !newFeedback.description}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {saving ? t('common.loading') : t('feedback.submit')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setShowForm(false); setError('') }}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['all', 'new', 'reviewing', 'planned', 'implemented', 'declined'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className={cn(
                'whitespace-nowrap',
                filter === status && 'bg-emerald-600 hover:bg-emerald-700 text-white'
              )}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
          ) : feedback.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t('feedback.no_feedback')}</div>
          ) : (
            feedback.map((item) => (
              <Card key={item.id}>
                <CardContent>
                  <div className="flex gap-4">
                    {/* Vote buttons */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => vote(item.id, 1)}
                        className="text-gray-400 hover:text-emerald-600"
                      >
                        <ChevronUp className="h-5 w-5" />
                      </button>
                      <span className={cn(
                        'font-medium',
                        item.score > 0 ? 'text-emerald-600' : item.score < 0 ? 'text-red-600' : 'text-gray-500'
                      )}>
                        {item.score}
                      </span>
                      <button
                        onClick={() => vote(item.id, -1)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <ChevronDown className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{TYPE_ICONS[item.type]}</span>
                        <h3 className="font-medium">{item.title}</h3>
                        <Badge variant={STATUS_VARIANTS[item.status] || 'outline'}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>By {item.user?.full_name || 'Unknown'}</span>
                        <span>{new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {item.admin_response && (
                        <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                          <p className="text-sm font-medium text-emerald-800">Admin Response:</p>
                          <p className="text-sm text-emerald-700">{item.admin_response}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </PageTransition>
  )
}
