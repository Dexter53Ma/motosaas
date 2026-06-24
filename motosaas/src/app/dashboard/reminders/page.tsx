'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getReminderSettings,
  updateReminderSettings,
  processPendingReminders,
  getOverdueRentals,
  sendBulkReminders,
  getReminderStats,
  type ReminderSettings,
} from '@/lib/reminders'

export default function RemindersPage() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null)
  const [overdueRentals, setOverdueRentals] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedRentals, setSelectedRentals] = useState<string[]>([])
  const [tenantId, setTenantId] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    setTenantId(userData.tenant_id)

    const [settingsData, overdueData, statsData] = await Promise.all([
      getReminderSettings(userData.tenant_id).catch(() => null),
      getOverdueRentals(userData.tenant_id).catch(() => []),
      getReminderStats(userData.tenant_id).catch(() => null),
    ])

    setSettings(settingsData)
    setOverdueRentals(overdueData)
    setStats(statsData)
    setLoading(false)
  }

  async function handleSaveSettings() {
    if (!settings || !tenantId) return

    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      await updateReminderSettings(tenantId, settings)
      setSuccess('Settings saved successfully')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  async function handleProcessReminders() {
    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      const results = await processPendingReminders(tenantId)
      const sent = results.filter(r => r.status === 'sent').length
      const failed = results.filter(r => r.status === 'failed').length
      setSuccess(`Processed ${results.length} reminders: ${sent} sent, ${failed} failed`)
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  async function handleSendBulkReminders() {
    if (selectedRentals.length === 0) {
      alert('Please select at least one rental')
      return
    }

    setSending(true)
    setError('')
    setSuccess('')

    try {
      const results = await sendBulkReminders(tenantId, selectedRentals)
      const sent = results.filter(r => r.status === 'sent').length
      const failed = results.filter(r => r.status === 'failed').length
      setSuccess(`Sent ${sent} reminders, ${failed} failed`)
      setSelectedRentals([])
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  function toggleRentalSelection(rentalId: string) {
    setSelectedRentals(prev =>
      prev.includes(rentalId)
        ? prev.filter(id => id !== rentalId)
        : [...prev, rentalId]
    )
  }

  function selectAllRentals() {
    if (selectedRentals.length === overdueRentals.length) {
      setSelectedRentals([])
    } else {
      setSelectedRentals(overdueRentals.map(r => r.rental_id))
    }
  }

  if (loading) {
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
          <p className="text-center text-gray-500">Loading...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
              <div className="hidden md:flex space-x-4">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Dashboard</Link>
                <Link href="/dashboard/vehicles" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Vehicles</Link>
                <Link href="/dashboard/customers" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Customers</Link>
                <Link href="/dashboard/rentals" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Rentals</Link>
                <Link href="/dashboard/payments" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Payments</Link>
                <Link href="/dashboard/whatsapp" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">WhatsApp</Link>
                <Link href="/dashboard/reminders" className="text-gray-900 font-semibold px-3 py-2 text-sm">Reminders</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Reminders</h1>
            <p className="text-gray-600">Automated payment reminders via WhatsApp</p>
          </div>
          <button
            onClick={handleProcessReminders}
            disabled={processing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Process Pending Reminders'}
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4">{success}</div>}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Total Sent</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-orange-600">{stats.overdue}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Reminder Settings</h2>
            {settings ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={settings.enabled}
                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="enabled" className="font-medium">Enable Reminders</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Send Time</label>
                  <input
                    type="time"
                    value={settings.send_time || '09:00'}
                    onChange={(e) => setSettings({ ...settings, send_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Reminders per Rental</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.max_reminders}
                    onChange={(e) => setSettings({ ...settings, max_reminders: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days Before Due Date</label>
                  <input
                    type="text"
                    value={settings.days_before_due?.join(', ') || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      days_before_due: e.target.value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
                    })}
                    placeholder="3, 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-sm text-gray-500 mt-1">Comma-separated days (e.g., 3, 1)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days After Due Date</label>
                  <input
                    type="text"
                    value={settings.days_after_due?.join(', ') || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      days_after_due: e.target.value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
                    })}
                    placeholder="1, 3, 7, 14"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-sm text-gray-500 mt-1">Comma-separated days (e.g., 1, 3, 7, 14)</p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="auto_send"
                    checked={settings.auto_send}
                    onChange={(e) => setSettings({ ...settings, auto_send: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="auto_send" className="font-medium">Auto-send Reminders</label>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={processing}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">No settings configured yet.</p>
                <button
                  onClick={() => setSettings({
                    id: '',
                    tenant_id: tenantId,
                    enabled: true,
                    days_before_due: [3, 1],
                    days_after_due: [1, 3, 7, 14],
                    send_time: '09:00',
                    max_reminders: 5,
                    auto_send: false,
                    created_at: '',
                    updated_at: '',
                  })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Initialize Settings
                </button>
              </div>
            )}
          </div>

          {/* Overdue Rentals */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Overdue Rentals ({overdueRentals.length})</h2>
              {overdueRentals.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={selectAllRentals}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedRentals.length === overdueRentals.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={handleSendBulkReminders}
                    disabled={sending || selectedRentals.length === 0}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : `Send Reminders (${selectedRentals.length})`}
                  </button>
                </div>
              )}
            </div>

            {overdueRentals.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No overdue rentals</p>
            ) : (
              <div className="space-y-3">
                {overdueRentals.map((rental) => (
                  <div
                    key={rental.rental_id}
                    className={`p-3 border rounded-lg ${selectedRentals.includes(rental.rental_id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedRentals.includes(rental.rental_id)}
                        onChange={() => toggleRentalSelection(rental.rental_id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{rental.customer_name}</p>
                        <p className="text-sm text-gray-500">{rental.vehicle_info}</p>
                        <p className="text-sm text-gray-500">{rental.customer_phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-600 font-medium">{rental.days_overdue} days late</p>
                        <p className="text-sm text-gray-500">{rental.balance} MAD due</p>
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