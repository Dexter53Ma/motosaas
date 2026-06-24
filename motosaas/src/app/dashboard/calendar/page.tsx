'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import CalendarView from '@/components/CalendarView'
import { useI18n } from '@/lib/i18n'

export default function CalendarPage() {
  const { t } = useI18n()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (userData) setTenantId(userData.tenant_id)
    }
    init()
  }, [supabase])

  useEffect(() => {
    if (tenantId) fetchEvents()
  }, [tenantId])

  async function fetchEvents() {
    setLoading(true)

    const { data: rentals } = await supabase
      .from('rentals')
      .select('*, vehicle:vehicles(make, model, license_plate), customer:customers(full_name)')
      .eq('tenant_id', tenantId!)
      .gte('start_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('end_date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString())

    const calendarEvents = (rentals || []).map((rental) => ({
      id: rental.id,
      title: `${rental.customer?.full_name || 'Unknown'} - ${rental.vehicle?.make || ''} ${rental.vehicle?.model || ''}`,
      start: rental.start_date,
      end: rental.end_date,
      type: 'rental',
      status: rental.status,
      vehicle: rental.vehicle,
      customer: rental.customer,
      rental,
    }))

    setEvents(calendarEvents)
    setLoading(false)
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">{t('common.loading')}</div>
  }

  return (
    <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CalendarView
              events={events}
              onEventClick={setSelectedEvent}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-4">{t('calendar.event_details')}</h3>
            {selectedEvent ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">{t('calendar.type')}</p>
                  <p className="font-medium capitalize">{selectedEvent.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('calendar.customer')}</p>
                  <p className="font-medium">{selectedEvent.customer?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('calendar.vehicle')}</p>
                  <p className="font-medium">
                    {selectedEvent.vehicle?.make} {selectedEvent.vehicle?.model}
                  </p>
                  <p className="text-sm text-gray-500">{selectedEvent.vehicle?.license_plate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('calendar.period')}</p>
                  <p className="font-medium">
                    {new Date(selectedEvent.start).toLocaleDateString('fr-FR')} - {new Date(selectedEvent.end).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('calendar.status')}</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedEvent.status === 'active' ? 'bg-green-100 text-green-800' :
                    selectedEvent.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedEvent.status}
                  </span>
                </div>
                <Link
                  href={`/dashboard/rentals/${selectedEvent.id}`}
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('calendar.view_rental')}
                </Link>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{t('calendar.click_event')}</p>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="font-medium">{t('calendar.upcoming')}</h3>
          </div>
          <div className="divide-y">
            {events
              .filter((e) => new Date(e.start) > new Date())
              .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
              .slice(0, 5)
              .map((event) => (
                <Link
                  key={event.id}
                  href={`/dashboard/rentals/${event.id}`}
                  className="block p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{event.customer?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">
                        {event.vehicle?.make} {event.vehicle?.model} ({event.vehicle?.license_plate})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(event.start).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.end).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            {events.filter((e) => new Date(e.start) > new Date()).length === 0 && (
              <div className="p-4 text-center text-gray-500">{t('calendar.no_upcoming')}</div>
            )}
          </div>
        </div>
      </main>
  )
}
