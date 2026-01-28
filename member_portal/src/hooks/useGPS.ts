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
    requestPermission: () => Promise<boolean>
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
        const checkPermission = async () => {
            if ('permissions' in navigator) {
                try {
                    const result = await navigator.permissions.query({ name: 'geolocation' })
                    setPermissionStatus(result.state)
                    result.addEventListener('change', () => {
                        setPermissionStatus(result.state)
                    })
                } catch (error) {
                    // If query fails, try to get position to trigger permission prompt
                    console.log('Permission query failed, will request on first use')
                    setPermissionStatus('prompt')
                }
            } else {
                // Fallback: try to detect permission state by attempting to get position
                // This will trigger the permission prompt if not already set
                setPermissionStatus('prompt')
            }
        }
        checkPermission()
    }, [])

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            setError('Geolocation is not supported by your browser')
            return false
        }

        return new Promise((resolve) => {
            // Use a longer timeout to give the browser time to show the permission prompt
            const timeoutId = setTimeout(() => {
                // If timeout, check if permission was actually denied or just taking time
                if (permissionStatus === 'denied') {
                    setError('Location permission denied. Please enable it in browser settings.')
                    resolve(false)
                } else {
                    // Permission might be granted but location unavailable
                    resolve(true)
                }
            }, 5000) // Increased timeout to 5 seconds

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    clearTimeout(timeoutId)
                    setError(null)
                    setPermissionStatus('granted')
                    // Update position immediately
                    setPosition({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        timestamp: pos.timestamp,
                    })
                    resolve(true)
                },
                (err) => {
                    clearTimeout(timeoutId)
                    if (err.code === err.PERMISSION_DENIED) {
                        setError('Location permission denied. Please enable it in browser settings.')
                        setPermissionStatus('denied')
                        resolve(false)
                    } else {
                        // Other errors (timeout, unavailable) - permission might be granted
                        // Update permission status if we can query it
                        if ('permissions' in navigator) {
                            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                                setPermissionStatus(result.state)
                            }).catch(() => {
                                // If query fails, assume it might be granted but location unavailable
                                setPermissionStatus('prompt')
                            })
                        }
                        resolve(true) // Permission granted, but location unavailable
                    }
                },
                { 
                    timeout: 5000, // Increased timeout
                    maximumAge: 0,
                    enableHighAccuracy: true
                }
            )
        })
    }, [isSupported, permissionStatus])

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
                    setError(null)
                    resolve(gpsPosition)
                },
                (err) => {
                    let errorMessage = 'Failed to get location'
                    switch (err.code) {
                        case err.PERMISSION_DENIED:
                            errorMessage = 'Location permission denied. Please enable location access in your browser settings and try again.'
                            // Update permission status
                            if ('permissions' in navigator) {
                                navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                                    setPermissionStatus(result.state)
                                }).catch(() => {
                                    // If query fails, assume denied
                                    setPermissionStatus('denied')
                                })
                            }
                            break
                        case err.POSITION_UNAVAILABLE:
                            errorMessage = 'Location unavailable. Please check your GPS settings.'
                            break
                        case err.TIMEOUT:
                            errorMessage = 'Location request timed out. Please try again.'
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
        requestPermission,
        watchPosition,
        stopWatching,
    }
}
