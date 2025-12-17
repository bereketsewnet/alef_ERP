import { useState, useCallback, useEffect } from 'react'
import type { GPSPosition } from '@/types'

interface UseGPSOptions {
    enableHighAccuracy?: boolean
    timeout?: number
    maximumAge?: number
}

interface UseGPSReturn {
    position: GPSPosition | null
    error: string | null
    isLoading: boolean
    isSupported: boolean
    permissionStatus: PermissionState | null
    requestPosition: () => Promise<GPSPosition | null>
    watchPosition: () => void
    stopWatching: () => void
}

export function useGPS(options: UseGPSOptions = {}): UseGPSReturn {
    const [position, setPosition] = useState<GPSPosition | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null)
    const [watchId, setWatchId] = useState<number | null>(null)

    const isSupported = 'geolocation' in navigator

    const {
        enableHighAccuracy = true,
        timeout = 30000,
        maximumAge = 0,
    } = options

    // Check permission status
    useEffect(() => {
        if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setPermissionStatus(result.state)
                result.addEventListener('change', () => {
                    setPermissionStatus(result.state)
                })
            })
        }
    }, [])

    const requestPosition = useCallback(async (): Promise<GPSPosition | null> => {
        if (!isSupported) {
            setError('Geolocation is not supported by your browser')
            return null
        }

        setIsLoading(true)
        setError(null)

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const gpsPosition: GPSPosition = {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        timestamp: pos.timestamp,
                    }
                    setPosition(gpsPosition)
                    setIsLoading(false)
                    resolve(gpsPosition)
                },
                (err) => {
                    let errorMessage = 'Failed to get location'
                    switch (err.code) {
                        case err.PERMISSION_DENIED:
                            errorMessage = 'Location permission denied'
                            break
                        case err.POSITION_UNAVAILABLE:
                            errorMessage = 'Location unavailable'
                            break
                        case err.TIMEOUT:
                            errorMessage = 'Location request timed out'
                            break
                    }
                    setError(errorMessage)
                    setIsLoading(false)
                    resolve(null)
                },
                {
                    enableHighAccuracy,
                    timeout,
                    maximumAge,
                }
            )
        })
    }, [isSupported, enableHighAccuracy, timeout, maximumAge])

    const watchPosition = useCallback(() => {
        if (!isSupported) {
            setError('Geolocation is not supported by your browser')
            return
        }

        const id = navigator.geolocation.watchPosition(
            (pos) => {
                setPosition({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: pos.timestamp,
                })
                setError(null)
            },
            (err) => {
                setError(err.message)
            },
            {
                enableHighAccuracy,
                timeout,
                maximumAge,
            }
        )
        setWatchId(id)
    }, [isSupported, enableHighAccuracy, timeout, maximumAge])

    const stopWatching = useCallback(() => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId)
            setWatchId(null)
        }
    }, [watchId])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId)
            }
        }
    }, [watchId])

    return {
        position,
        error,
        isLoading,
        isSupported,
        permissionStatus,
        requestPosition,
        watchPosition,
        stopWatching,
    }
}
