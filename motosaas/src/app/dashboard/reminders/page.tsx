'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, AlertTriangle, Send, CheckCircle, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getReminderSettings,
  updateReminderSettings,
  processPendingReminders,
  getOverdueRentals,
  sendBulkReminders,
  getReminderStats,
  type ReminderSettings,
} from '@/lib/reminders'
import { useI18n } from '@/lib/i18n'

const statColors = [
  { border: 'border-l-blue-500', icon: Clock },
  { border: 'border-l-emerald-500', icon: CheckCircle },
  { border: 'border-l-red-500', icon: XCircle },
  { border: 'border-l-amber-500', icon: AlertTriangle },
]

export default function RemindersPage() {
  const { t } = useI18n()
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
      toast.success('Reminder settings saved!')
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
      toast.success(`Sent ${sent} reminders`)
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
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-gray-500">Loading...</p>
      </main>
    )
  }

  return (
    <PageTransition>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("reminders.title")}</h1>
            <p className="text-gray-600">{t("reminders.desc")}</p>
          </div>
          <Button onClick={handleProcessReminders} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700">
            {processing ? 'Processing...' : 'Process Pending Reminders'}
          </Button>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg mb-4">{success}</div>}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Sent', value: stats.total, colorClass: statColors[0].border, Icon: statColors[0].icon },
              { label: 'Delivered', value: stats.delivered, colorClass: statColors[1].border, Icon: statColors[1].icon },
              { label: 'Failed', value: stats.failed, colorClass: statColors[2].border, Icon: statColors[2].icon },
              { label: 'Overdue', value: stats.overdue, colorClass: statColors[3].border, Icon: statColors[3].icon },
            ].map((stat, i) => (
              <Card key={i} className={cn('border-l-4', stat.colorClass)}>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <stat.Icon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className={cn(
                        'text-2xl font-bold',
                        i === 1 && 'text-emerald-600',
                        i === 2 && 'text-red-600',
                        i === 3 && 'text-amber-600'
                      )}>
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Reminder Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settings ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enabled"
                      checked={settings.enabled}
                      onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <Label htmlFor="enabled">{t("reminders.enable")}</Label>
                  </div>

                  <div>
                    <Label>{t("reminders.send_time")}</Label>
                    <Input
                      type="time"
                      value={settings.send_time || '09:00'}
                      onChange={(e) => setSettings({ ...settings, send_time: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>{t("reminders.max_per_rental")}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={settings.max_reminders}
                      onChange={(e) => setSettings({ ...settings, max_reminders: parseInt(e.target.value) || 5 })}
                    />
                  </div>

                  <div>
                    <Label>{t("reminders.days_before")}</Label>
                    <Input
                      type="text"
                      value={settings.days_before_due?.join(', ') || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        days_before_due: e.target.value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
                      })}
                      placeholder="3, 1"
                    />
                    <p className="text-sm text-gray-500 mt-1">Comma-separated days (e.g., 3, 1)</p>
                  </div>

                  <div>
                    <Label>{t("reminders.days_after")}</Label>
                    <Input
                      type="text"
                      value={settings.days_after_due?.join(', ') || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        days_after_due: e.target.value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
                      })}
                      placeholder="1, 3, 7, 14"
                    />
                    <p className="text-sm text-gray-500 mt-1">Comma-separated days (e.g., 1, 3, 7, 14)</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="auto_send"
                      checked={settings.auto_send}
                      onChange={(e) => setSettings({ ...settings, auto_send: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <Label htmlFor="auto_send">{t("reminders.auto_send")}</Label>
                  </div>

                  <Button onClick={handleSaveSettings} disabled={processing} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {processing ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">{t("reminders.no_settings")}</p>
                  <Button
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
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Initialize Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overdue Rentals */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Overdue Rentals ({overdueRentals.length})
                </CardTitle>
                {overdueRentals.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAllRentals} className="text-emerald-600 hover:text-emerald-700">
                      {selectedRentals.length === overdueRentals.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSendBulkReminders}
                      disabled={sending || selectedRentals.length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      {sending ? 'Sending...' : `Send Reminders (${selectedRentals.length})`}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {overdueRentals.length === 0 ? (
                <p className="text-gray-500 text-center py-4">{t("reminders.no_overdue")}</p>
              ) : (
                <div className="space-y-3">
                  {overdueRentals.map((rental) => (
                    <div
                      key={rental.rental_id}
                      className={cn(
                        'p-3 border rounded-lg transition-colors',
                        selectedRentals.includes(rental.rental_id)
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedRentals.includes(rental.rental_id)}
                          onChange={() => toggleRentalSelection(rental.rental_id)}
                          className="w-4 h-4 text-emerald-600 rounded"
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
            </CardContent>
          </Card>
        </div>
      </main>
    </PageTransition>
  )
}
