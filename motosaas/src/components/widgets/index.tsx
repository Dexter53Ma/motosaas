'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WidgetProps {
  title: string
  children: React.ReactNode
  onRefresh?: () => void
  className?: string
}

export function Widget({ title, children, onRefresh, className = '' }: WidgetProps) {
  const [loading, setLoading] = useState(false)

  async function handleRefresh() {
    if (!onRefresh) return
    setLoading(true)
    await onRefresh()
    setLoading(false)
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{title}</h3>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

interface StatWidgetProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: string
}

export function StatWidget({ title, value, change, changeLabel, icon }: StatWidgetProps) {
  return (
    <Widget title={title}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% {changeLabel || 'vs last period'}
            </p>
          )}
        </div>
        {icon && <span className="text-3xl">{icon}</span>}
      </div>
    </Widget>
  )
}

interface ListWidgetProps<T> {
  title: string
  items: T[]
  renderItem: (item: T) => React.ReactNode
  emptyMessage?: string
  viewAllUrl?: string
}

export function ListWidget<T>({ title, items, renderItem, emptyMessage = 'No items', viewAllUrl }: ListWidgetProps<T>) {
  return (
    <Widget title={title}>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      ) : (
        <div className="divide-y">
          {items.slice(0, 5).map((item, i) => (
            <div key={i} className="py-2 first:pt-0 last:pb-0">
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
      {viewAllUrl && items.length > 0 && (
        <a href={viewAllUrl} className="block mt-3 text-sm text-blue-600 hover:text-blue-800">
          View all →
        </a>
      )}
    </Widget>
  )
}

interface ChartWidgetProps {
  title: string
  data: { label: string; value: number }[]
  maxValue?: number
}

export function ChartWidget({ title, data, maxValue }: ChartWidgetProps) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1)

  return (
    <Widget title={title}>
      <div className="space-y-2">
        {data.slice(0, 6).map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-20 truncate">{item.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 w-16 text-right">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </Widget>
  )
}