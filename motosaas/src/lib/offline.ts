'use client'

import { useState, useEffect, useCallback } from 'react'

interface OfflineStorageOptions {
  dbName?: string
  version?: number
  storeName?: string
}

interface PendingOperation {
  id: string
  table: string
  operation: 'insert' | 'update' | 'delete'
  data: unknown
  timestamp: number
  synced: boolean
}

class OfflineStorage {
  private dbName: string
  private version: number
  private storeName: string
  private db: IDBDatabase | null = null

  constructor(options: OfflineStorageOptions = {}) {
    this.dbName = options.dbName || 'motosaas-offline'
    this.version = options.version || 1
    this.storeName = options.storeName || 'pending-operations'
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' })
        }
      }
    })
  }

  async addPendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'synced'>): Promise<string> {
    if (!this.db) await this.init()

    const id = crypto.randomUUID()
    const pendingOp: PendingOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      synced: false,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.add(pendingOp)

      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingOperations(): Promise<PendingOperation[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async markAsSynced(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const operation = getRequest.result
        if (operation) {
          operation.synced = true
          const putRequest = store.put(operation)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async clearSyncedOperations(): Promise<void> {
    if (!this.db) await this.init()

    const operations = await this.getPendingOperations()
    const syncedOps = operations.filter(op => op.synced)

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)

      syncedOps.forEach(op => {
        store.delete(op.id)
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async getPendingCount(): Promise<number> {
    const operations = await this.getPendingOperations()
    return operations.filter(op => !op.synced).length
  }
}

export const offlineStorage = new OfflineStorage()

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine
    }
    return true
  })
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const checkPending = async () => {
      try {
        const count = await offlineStorage.getPendingCount()
        setPendingCount(count)
      } catch (error) {
        console.error('Failed to check pending operations:', error)
      }
    }

    checkPending()
    const interval = setInterval(checkPending, 30000)

    return () => clearInterval(interval)
  }, [])

  const addPendingOperation = useCallback(async (operation: Omit<PendingOperation, 'id' | 'timestamp' | 'synced'>) => {
    const id = await offlineStorage.addPendingOperation(operation)
    setPendingCount(prev => prev + 1)
    return id
  }, [])

  return { isOnline, pendingCount, addPendingOperation }
}

export function useOfflineData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)

  const { ttl = 5 * 60 * 1000 } = options

  const stableFetcher = useCallback(fetcher, [fetcher])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        const cached = localStorage.getItem(`offline-cache-${key}`)
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < ttl) {
            setData(cachedData)
            setIsFromCache(true)
            setLoading(false)
            return
          }
        }

        const freshData = await stableFetcher()
        setData(freshData)
        setIsFromCache(false)

        localStorage.setItem(`offline-cache-${key}`, JSON.stringify({
          data: freshData,
          timestamp: Date.now(),
        }))
      } catch (err) {
        setError(err as Error)

        const cached = localStorage.getItem(`offline-cache-${key}`)
        if (cached) {
          const { data: cachedData } = JSON.parse(cached)
          setData(cachedData)
          setIsFromCache(true)
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [key, ttl, stableFetcher])

  return { data, loading, error, isFromCache }
}