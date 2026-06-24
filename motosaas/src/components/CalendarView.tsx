'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  type: 'rental' | 'maintenance' | 'inspection'
  status: string
  vehicle?: string
  customer?: string
}

interface CalendarViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export default function CalendarView({ events, onEventClick, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDay = firstDay.getDay()

  const days = []
  for (let i = 0; i < startingDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  function getEventsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      const date = new Date(dateStr)
      return date >= eventStart && date <= eventEnd
    })
  }

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  function goToToday() {
    setCurrentDate(new Date())
  }

  function handleDayClick(day: number) {
    if (!day) return
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
    onDateClick?.(dateStr)
  }

  const getEventColor = (type: string, status: string) => {
    if (type === 'rental') {
      if (status === 'active') return 'bg-green-100 text-green-800 border-green-200'
      if (status === 'overdue') return 'bg-red-100 text-red-800 border-red-200'
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }
    if (type === 'maintenance') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-purple-100 text-purple-800 border-purple-200'
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold">
            {currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            →
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {/* Weekday headers */}
        {WEEKDAYS_FR.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="min-h-[100px] border-b border-r bg-gray-50" />
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
          const isSelected = selectedDate === dateStr
          const dayEvents = getEventsForDay(day)

          return (
            <div
              key={day}
              onClick={() => handleDayClick(day)}
              className={`min-h-[100px] border-b border-r p-1 cursor-pointer hover:bg-gray-50 ${
                isToday ? 'bg-blue-50' : ''
              } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                {day}
              </div>
              <div className="space-y-1 mt-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick?.(event) }}
                    className={`text-xs p-1 rounded border cursor-pointer truncate ${getEventColor(event.type, event.status)}`}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}