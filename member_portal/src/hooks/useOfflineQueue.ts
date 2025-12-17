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
    syncAll: () => Promise<void>
    isSyncing: boolean
    addClockIn: (payload: ClockInPayload) => Promise<void>
    addClockOut: (payload: ClockInPayload) => Promise<void>
    addIncident: (payload: IncidentPayload) => Promise<void>
    clearFailed: () => Promise<void>
}

export function useOfflineQueue(): UseOfflineQueueReturn {
    const [queue, setQueue] = useState<QueuedAction[]>([])
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [isSyncing, setIsSyncing] = useState(false)

    // Load queue from storage
    const loadQueue = useCallback(async () => {
        const actions = await getQueuedActions()
        setQueue(actions)
    }, [])

    useEffect(() => {
        loadQueue()
    }, [loadQueue])

    // Listen for online/offline events
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            // Auto-sync when back online
            syncAll()
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
        if (isSyncing || !isOnline) return

        setIsSyncing(true)
        const currentQueue = await getQueuedActions()
        const pendingActions = currentQueue.filter((a) => a.status === 'PENDING')

        for (const action of pendingActions) {
            try {
                await updateQueueItem(action.id, { status: 'SYNCING' })

                switch (action.type) {
                    case 'CLOCK_IN':
                        await attendanceApi.clockIn(action.payload as ClockInPayload)
                        break
                    case 'CLOCK_OUT':
                        await attendanceApi.clockOut(action.payload as ClockInPayload)
                        break
                    case 'INCIDENT':
                        await incidentApi.create(action.payload as IncidentPayload)
                        break
                }

                // Success - remove from queue
                await removeFromQueue(action.id)
            } catch (error) {
                // Failed - mark as failed
                const errorMessage = error instanceof Error ? error.message : 'Sync failed'
                await updateQueueItem(action.id, {
                    status: 'FAILED',
                    retryCount: action.retryCount + 1,
                    error: errorMessage,
                })
            }
        }

        await loadQueue()
        setIsSyncing(false)
    }, [isOnline, isSyncing, loadQueue])

    const clearFailed = useCallback(async () => {
        const currentQueue = await getQueuedActions()
        for (const action of currentQueue) {
            if (action.status === 'FAILED') {
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
        syncAll,
        isSyncing,
        addClockIn,
        addClockOut,
        addIncident,
        clearFailed,
    }
}
