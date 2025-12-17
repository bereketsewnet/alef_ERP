import localforage from 'localforage'
import type { QueuedAction, ShiftSchedule, User } from '@/types'

// Configure localforage
localforage.config({
    name: 'AlefMemberPortal',
    storeName: 'offline_data',
})

// Keys
const KEYS = {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user',
    CACHED_ROSTER: 'cached_roster',
    QUEUED_ACTIONS: 'queued_actions',
}

// Auth Storage
export async function saveAuthToken(token: string): Promise<void> {
    await localforage.setItem(KEYS.AUTH_TOKEN, token)
}

export async function getAuthToken(): Promise<string | null> {
    return localforage.getItem(KEYS.AUTH_TOKEN)
}

export async function saveRefreshToken(token: string): Promise<void> {
    await localforage.setItem(KEYS.REFRESH_TOKEN, token)
}

export async function getRefreshToken(): Promise<string | null> {
    return localforage.getItem(KEYS.REFRESH_TOKEN)
}

export async function saveUser(user: User): Promise<void> {
    await localforage.setItem(KEYS.USER, user)
}

export async function getUser(): Promise<User | null> {
    return localforage.getItem(KEYS.USER)
}

export async function clearAuth(): Promise<void> {
    await localforage.removeItem(KEYS.AUTH_TOKEN)
    await localforage.removeItem(KEYS.REFRESH_TOKEN)
    await localforage.removeItem(KEYS.USER)
}

// Roster Cache
export async function cacheRoster(roster: ShiftSchedule[]): Promise<void> {
    await localforage.setItem(KEYS.CACHED_ROSTER, {
        data: roster,
        cachedAt: new Date().toISOString(),
    })
}

export async function getCachedRoster(): Promise<{ data: ShiftSchedule[]; cachedAt: string } | null> {
    return localforage.getItem(KEYS.CACHED_ROSTER)
}

// Offline Queue
export async function getQueuedActions(): Promise<QueuedAction[]> {
    const actions = await localforage.getItem<QueuedAction[]>(KEYS.QUEUED_ACTIONS)
    return actions || []
}

export async function addToQueue(action: QueuedAction): Promise<void> {
    const actions = await getQueuedActions()
    actions.push(action)
    await localforage.setItem(KEYS.QUEUED_ACTIONS, actions)
}

export async function updateQueueItem(id: string, updates: Partial<QueuedAction>): Promise<void> {
    const actions = await getQueuedActions()
    const index = actions.findIndex((a) => a.id === id)
    if (index !== -1) {
        actions[index] = { ...actions[index], ...updates }
        await localforage.setItem(KEYS.QUEUED_ACTIONS, actions)
    }
}

export async function removeFromQueue(id: string): Promise<void> {
    const actions = await getQueuedActions()
    const filtered = actions.filter((a) => a.id !== id)
    await localforage.setItem(KEYS.QUEUED_ACTIONS, filtered)
}

export async function clearQueue(): Promise<void> {
    await localforage.setItem(KEYS.QUEUED_ACTIONS, [])
}
