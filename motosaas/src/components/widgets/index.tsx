'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

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
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-gray-400 hover:text-emerald-600 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
      <div className="p-5">
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
    <Widget title={title} className="hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums tracking-tight mb-1.5">
            {value}
          </p>
          {change !== undefined && (
            <p className={`text-xs font-medium flex items-center gap-1 ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% <span className="text-gray-400 font-normal">{changeLabel || 'vs last period'}</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
            <span className="text-xl">{icon}</span>
          </div>
        )}
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
    <Widget title={title} className="hover:shadow-md transition-shadow duration-200">
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm py-4">{emptyMessage}</p>
      ) : (
        <div className="divide-y divide-gray-50 -mx-5 -mt-2 -mb-5">
          {items.slice(0, 5).map((item, i) => (
            <div key={i} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
      {viewAllUrl && items.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <a href={viewAllUrl} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            View all <span>→</span>
          </a>
        </div>
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
    <Widget title={title} className="hover:shadow-md transition-shadow duration-200">
      <div className="space-y-2.5">
        {data.slice(0, 6).map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-20 truncate font-medium">{item.label}</span>
            <div className="flex-1 bg-gray-50 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-800 w-14 text-right tabular-nums">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </Widget>
  )
}
