'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewKey, setShowNewKey] = useState(false)
  const [showNewWebhook, setShowNewWebhook] = useState(false)
  const [newKey, setNewKey] = useState({ name: '', permissions: ['read'] })
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', events: [] as string[] })
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const AVAILABLE_EVENTS = [
    'rental.created', 'rental.completed', 'rental.overdue',
    'payment.created', 'payment.completed',
    'customer.created', 'customer.updated',
    'vehicle.added', 'vehicle.updated',
    'damage.reported',
  ]

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)

    const { data: keysData } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false })

    if (keysData) setApiKeys(keysData)

    const { data: webhooksData } = await supabase
      .from('webhooks')
      .select('*')
      .order('created_at', { ascending: false })

    if (webhooksData) setWebhooks(webhooksData)

    setLoading(false)
  }

  async function createApiKey() {
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) throw new Error('No tenant found')

      const { data: keyData } = await supabase.rpc('generate_api_key')
      if (!keyData) throw new Error('Failed to generate key')

      const keyPrefix = keyData.substring(0, 7)

      const { error: insertError } = await supabase
        .from('api_keys')
        .insert({
          tenant_id: userData.tenant_id,
          name: newKey.name,
          key_hash: keyData,
          key_prefix: keyPrefix,
          permissions: newKey.permissions,
          created_by: user.id,
        })

      if (insertError) throw insertError

      setGeneratedKey(keyData)
      setShowNewKey(false)
      setNewKey({ name: '', permissions: ['read'] })
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function createWebhook() {
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) throw new Error('No tenant found')

      const { error: insertError } = await supabase
        .from('webhooks')
        .insert({
          tenant_id: userData.tenant_id,
          name: newWebhook.name,
          url: newWebhook.url,
          events: newWebhook.events,
          created_by: user.id,
        })

      if (insertError) throw insertError

      setShowNewWebhook(false)
      setNewWebhook({ name: '', url: '', events: [] })
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function revokeKey(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)

    if (!error) await fetchData()
  }

  async function deleteWebhook(id: string) {
    if (!confirm('Delete this webhook?')) return

    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', id)

    if (!error) await fetchData()
  }

  async function toggleWebhook(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('webhooks')
      .update({ is_active: !currentStatus })
      .eq('id', id)

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
              <h1 className="text-lg font-medium">API Keys & Webhooks</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Generated Key Modal */}
        {generatedKey && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <h3 className="font-medium mb-4">API Key Created</h3>
              <p className="text-sm text-gray-600 mb-4">
                Copy this key now. It won't be shown again.
              </p>
              <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm break-all mb-4">
                {generatedKey}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(generatedKey); alert('Copied!') }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setGeneratedKey(null)}
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* API Keys Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">API Keys</h2>
            <button
              onClick={() => setShowNewKey(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create API Key
            </button>
          </div>

          {showNewKey && (
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h3 className="font-medium mb-4">New API Key</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newKey.name}
                    onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Integration Key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="flex gap-4">
                    {['read', 'write', 'admin'].map((perm) => (
                      <label key={perm} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newKey.permissions.includes(perm)}
                          onChange={(e) => {
                            const perms = e.target.checked
                              ? [...newKey.permissions, perm]
                              : newKey.permissions.filter(p => p !== perm)
                            setNewKey({ ...newKey, permissions: perms })
                          }}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="text-sm capitalize">{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={createApiKey}
                    disabled={saving || !newKey.name}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Key'}
                  </button>
                  <button
                    onClick={() => { setShowNewKey(false); setError('') }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            {apiKeys.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No API keys</div>
            ) : (
              <div className="divide-y">
                {apiKeys.map((key) => (
                  <div key={key.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <p className="text-sm text-gray-500 font-mono">{key.key_prefix}...</p>
                      <p className="text-sm text-gray-500">
                        Permissions: {key.permissions?.join(', ')}
                      </p>
                      {key.last_used_at && (
                        <p className="text-sm text-gray-500">
                          Last used: {new Date(key.last_used_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => revokeKey(key.id)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Webhooks Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Webhooks</h2>
            <button
              onClick={() => setShowNewWebhook(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Webhook
            </button>
          </div>

          {showNewWebhook && (
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h3 className="font-medium mb-4">New Webhook</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Rental Notifications"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                  <input
                    type="url"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://your-server.com/webhook"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_EVENTS.map((event) => (
                      <label key={event} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newWebhook.events.includes(event)}
                          onChange={(e) => {
                            const events = e.target.checked
                              ? [...newWebhook.events, event]
                              : newWebhook.events.filter(ev => ev !== event)
                            setNewWebhook({ ...newWebhook, events })
                          }}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={createWebhook}
                    disabled={saving || !newWebhook.name || !newWebhook.url}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Webhook'}
                  </button>
                  <button
                    onClick={() => { setShowNewWebhook(false); setError('') }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            {webhooks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No webhooks configured</div>
            ) : (
              <div className="divide-y">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{webhook.name}</p>
                        <p className="text-sm text-gray-500 font-mono">{webhook.url}</p>
                        <p className="text-sm text-gray-500">
                          Events: {webhook.events?.join(', ') || 'None'}
                        </p>
                        {webhook.last_triggered_at && (
                          <p className="text-sm text-gray-500">
                            Last triggered: {new Date(webhook.last_triggered_at).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleWebhook(webhook.id, webhook.is_active)}
                          className={`px-3 py-1 text-sm rounded ${
                            webhook.is_active
                              ? 'text-green-600 border border-green-300 hover:bg-green-50'
                              : 'text-gray-600 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {webhook.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => deleteWebhook(webhook.id)}
                          className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}