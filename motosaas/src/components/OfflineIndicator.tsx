'use client'

import { useOfflineStatus } from '@/lib/offline'

export default function OfflineIndicator() {
  const { isOnline, pendingCount } = useOfflineStatus()

  if (isOnline && pendingCount === 0) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
      isOnline ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-yellow-200' : 'bg-red-200'} animate-pulse`} />
        <span className="text-sm font-medium">
          {isOnline ? (
            pendingCount > 0 ? `${pendingCount} pending sync${pendingCount > 1 ? 's' : ''}` : 'Online'
          ) : (
            'Offline - Changes will sync when connected'
          )}
        </span>
      </div>
    </div>
  )
}