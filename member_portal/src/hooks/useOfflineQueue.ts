import { useState, useEffect, useCallback } from 'react'
import { getQueuedActions, addToQueue, updateQueueItem, removeFromQueue } from '@/utils/storage'
import { attendanceApi } from '@/api/endpoints/attendance'
import { incidentApi } from '@/api/endpoints/incidents'
import type { QueuedAction, ClockInPayload, IncidentPayload } from '@/types'

interface UseOfflineQueueReturn {
    queue: QueuedAction[]
    pendingCount: number
    failedCount: number
    isOnline: boolean
    checkOnlineStatus: () => Promise<boolean>
    syncAll: () => Promise<void>
    isSyncing: boolean
    addClockIn: (payload: ClockInPayload) => Promise<void>
    addClockOut: (payload: ClockInPayload) => Promise<void>
    addIncident: (payload: IncidentPayload) => Promise<void>
    clearFailed: () => Promise<void>
    clearAllPending: () => Promise<void>
}

export function useOfflineQueue(): UseOfflineQueueReturn {
    const [queue, setQueue] = useState<QueuedAction[]>([])
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [isSyncing, setIsSyncing] = useState(false)

    // Test actual API connectivity, not just navigator.onLine
    const checkOnlineStatus = useCallback(async () => {
        // First check navigator.onLine
        if (!navigator.onLine) {
            setIsOnline(false)
            return false
        }

        // Then test actual API connectivity
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
            
            const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
            const healthUrl = base.includes('/api') ? `${base}/health` : `${base}/api/health`
            const response = await fetch(healthUrl, {
                method: 'GET',
                signal: controller.signal,
                cache: 'no-cache',
            })
            
            clearTimeout(timeoutId)
            const isActuallyOnline = response.ok
            setIsOnline(isActuallyOnline)
            return isActuallyOnline
        } catch {
            setIsOnline(false)
            return false
        }
    }, [])

    // Load queue from storage
    const loadQueue = useCallback(async () => {
        const actions = await getQueuedActions()
        setQueue(actions)
    }, [])

    useEffect(() => {
        loadQueue()
    }, [loadQueue])

    // Check online status on mount and periodically
    useEffect(() => {
        checkOnlineStatus()
        const interval = setInterval(checkOnlineStatus, 10000) // Check every 10 seconds
        return () => clearInterval(interval)
    }, [checkOnlineStatus])

    // Listen for online/offline events
    useEffect(() => {
        const handleOnline = async () => {
            // Wait a bit then check actual connectivity
            setTimeout(async () => {
                const isActuallyOnline = await checkOnlineStatus()
                if (isActuallyOnline) {
                    // Auto-sync when back online
                    syncAll()
                }
            }, 1000)
        }
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const addClockIn = useCallback(async (payload: ClockInPayload) => {
        const action: QueuedAction = {
            id: generateId(),
            type: 'CLOCK_IN',
            payload,
            timestamp: new Date().toISOString(),
            status: 'PENDING',
            retryCount: 0,
        }
        await addToQueue(action)
        await loadQueue()
    }, [loadQueue])

    const addClockOut = useCallback(async (payload: ClockInPayload) => {
        const action: QueuedAction = {
            id: generateId(),
            type: 'CLOCK_OUT',
            payload,
            timestamp: new Date().toISOString(),
            status: 'PENDING',
            retryCount: 0,
        }
        await addToQueue(action)
        await loadQueue()
    }, [loadQueue])

    const addIncident = useCallback(async (payload: IncidentPayload) => {
        const action: QueuedAction = {
            id: generateId(),
            type: 'INCIDENT',
            payload,
            timestamp: new Date().toISOString(),
            status: 'PENDING',
            retryCount: 0,
        }
        await addToQueue(action)
        await loadQueue()
    }, [loadQueue])

    const syncAll = useCallback(async () => {
        // Check online status before syncing
        const actuallyOnline = await checkOnlineStatus()
        if (isSyncing || !actuallyOnline) {
            if (!actuallyOnline) {
                console.log('[OfflineQueue] Not online, skipping sync')
            }
            return
        }

        setIsSyncing(true)
        const currentQueue = await getQueuedActions()
        const pendingActions = currentQueue.filter((a) => a.status === 'PENDING')

        console.log(`[OfflineQueue] Syncing ${pendingActions.length} pending actions`)

        for (const action of pendingActions) {
            try {
                await updateQueueItem(action.id, { status: 'SYNCING' })

                switch (action.type) {
                    case 'CLOCK_IN': {
                        const payload = action.payload as any
                        // Validate payload has required fields
                        if (!payload || !payload.schedule_id || payload.latitude === undefined || payload.longitude === undefined) {
                            throw new Error(`Missing required fields: schedule_id=${payload?.schedule_id}, latitude=${payload?.latitude}, longitude=${payload?.longitude}`)
                        }
                        // Ensure all values are numbers (IndexedDB might store them as strings)
                        const syncPayload: ClockInPayload = {
                            schedule_id: Number(payload.schedule_id),
                            latitude: Number(payload.latitude),
                            longitude: Number(payload.longitude),
                            accuracy: payload.accuracy ? Number(payload.accuracy) : 0,
                            // Don't include selfie when syncing from offline queue (File objects can't be stored in IndexedDB)
                        }
                        console.log('[OfflineQueue] Syncing CLOCK_IN with payload:', syncPayload)
                        await attendanceApi.clockIn(syncPayload)
                        break
                    }
                    case 'CLOCK_OUT': {
                        const payload = action.payload as any
                        // Validate payload has required fields
                        if (!payload || !payload.schedule_id || payload.latitude === undefined || payload.longitude === undefined) {
                            throw new Error(`Missing required fields: schedule_id=${payload?.schedule_id}, latitude=${payload?.latitude}, longitude=${payload?.longitude}`)
                        }
                        // Ensure all values are numbers
                        const syncPayload: ClockInPayload = {
                            schedule_id: Number(payload.schedule_id),
                            latitude: Number(payload.latitude),
                            longitude: Number(payload.longitude),
                            accuracy: payload.accuracy ? Number(payload.accuracy) : 0,
                        }
                        console.log('[OfflineQueue] Syncing CLOCK_OUT with payload:', syncPayload)
                        await attendanceApi.clockOut(syncPayload)
                        break
                    }
                    case 'INCIDENT':
                        await incidentApi.create(action.payload as IncidentPayload)
                        break
                }

                // Success - remove from queue
                await removeFromQueue(action.id)
                console.log(`[OfflineQueue] Synced ${action.type} successfully`)
            } catch (error) {
                // Failed - mark as failed
                const errorMessage = error instanceof Error ? error.message : 'Sync failed'
                const errorDetails = error instanceof Error && 'response' in error 
                    ? (error as any).response?.data?.message || errorMessage
                    : errorMessage
                await updateQueueItem(action.id, {
                    status: 'FAILED',
                    retryCount: action.retryCount + 1,
                    error: errorDetails,
                })
                console.error(`[OfflineQueue] Failed to sync ${action.type}:`, errorDetails, action.payload)
            }
        }

        await loadQueue()
        setIsSyncing(false)
    }, [isOnline, isSyncing, loadQueue, checkOnlineStatus])

    const clearFailed = useCallback(async () => {
        const currentQueue = await getQueuedActions()
        for (const action of currentQueue) {
            if (action.status === 'FAILED') {
                await removeFromQueue(action.id)
            }
        }
        await loadQueue()
    }, [loadQueue])

    const clearAllPending = useCallback(async () => {
        const currentQueue = await getQueuedActions()
        for (const action of currentQueue) {
            if (action.status === 'PENDING') {
                await removeFromQueue(action.id)
            }
        }
        await loadQueue()
    }, [loadQueue])

    const pendingCount = queue.filter((a) => a.status === 'PENDING').length
    const failedCount = queue.filter((a) => a.status === 'FAILED').length

    return {
        queue,
        pendingCount,
        failedCount,
        isOnline,
        checkOnlineStatus,
        syncAll,
        isSyncing,
        addClockIn,
        addClockOut,
        addIncident,
        clearFailed,
        clearAllPending,
    }
}
