import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Clock, Camera, X, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { MapPreview } from '@/components/MapPreview'
import { useRoster } from '@/hooks/useRoster'
import { useGPS } from '@/hooks/useGPS'
import { useClockIn, useClockOut } from '@/hooks/useAttendance'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'
import { haversineDistance, formatDistance } from '@/utils/haversine'
import type { ShiftSchedule, ClockInPayload } from '@/types'

export function DashboardPage() {
    const { t } = useTranslation()
    const { todayShift, isLoading: isLoadingRoster } = useRoster()
    const { position, requestPosition, requestPermission, permissionStatus, isLoading: isGPSLoading, error: gpsError } = useGPS()
    const { mutateAsync: clockIn, isPending: isClockingIn } = useClockIn()
    const { mutateAsync: clockOut, isPending: isClockingOut } = useClockOut()
    const { addClockIn, addClockOut, isOnline, checkOnlineStatus, syncAll } = useOfflineQueue()

    const [selfie, setSelfie] = useState<File | null>(null)
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
    const [hasRequestedPermission, setHasRequestedPermission] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Automatically request permission on page load if not already granted
    // Note: This only works on HTTPS or localhost (Chrome blocks location on HTTP)
    useEffect(() => {
        if (todayShift && !hasRequestedPermission && permissionStatus === 'prompt') {
            // Small delay to ensure page is fully loaded
            const timer = setTimeout(async () => {
                setHasRequestedPermission(true)
                try {
                    const granted = await requestPermission()
                    // If permission was granted, try to get position
                    if (granted) {
                        await requestPosition()
                    }
                } catch (error) {
                    console.log('Permission request failed:', error)
                }
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [todayShift, hasRequestedPermission, permissionStatus, requestPermission, requestPosition])

    const isClockedIn = todayShift?.attendance_logs?.some(log => log.clock_in_time && !log.clock_out_time)

    const handleTakeSelfie = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelfie(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setSelfiePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeSelfie = () => {
        setSelfie(null)
        setSelfiePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleClockAction = async () => {
        if (!todayShift) return

        // Request GPS position
        const pos = await requestPosition()
        if (!pos) {
            const errorMsg = gpsError?.includes('permission denied')
                ? t('attendance.locationPermissionDenied') || 'Location permission is required. Please enable location access in your browser settings and try again.'
                : t('attendance.gpsRequired') || 'GPS location is required'
            setResult({ success: false, message: errorMsg })
            return
        }

        // Re-check online status when user clicks so we don't show "Saved offline" when actually online
        const actuallyOnline = await checkOnlineStatus()

        const payload: ClockInPayload = {
            schedule_id: todayShift.id,
            latitude: pos.latitude,
            longitude: pos.longitude,
            accuracy: pos.accuracy || 0,
            selfie: (actuallyOnline && selfie) ? selfie : undefined,
        }

        const offlinePayload = {
            schedule_id: payload.schedule_id,
            latitude: payload.latitude,
            longitude: payload.longitude,
            accuracy: payload.accuracy,
        }

        try {
            if (actuallyOnline) {
                const response = isClockedIn
                    ? await clockOut(payload)
                    : await clockIn(payload)

                if (response.success) {
                    setResult({ success: true, message: isClockedIn ? t('attendance.clockOutSuccess') : t('attendance.clockInSuccess') })
                    setTimeout(() => syncAll(), 2000)
                } else {
                    setResult({ success: false, message: response.message || t('attendance.tooFar') })
                }
            } else {
                if (isClockedIn) {
                    await addClockOut(offlinePayload as ClockInPayload)
                } else {
                    await addClockIn(offlinePayload as ClockInPayload)
                }
                setResult({ success: true, message: t('attendance.queued') })
            }
        } catch (error: any) {
            console.error('Check-in error:', error)

            let errorMessage = t('attendance.clockInFailed') || 'Clock in failed'
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message
            } else if (error?.response?.data?.error) {
                errorMessage = error.response.data.error
            } else if (error?.message) {
                errorMessage = error.message
            }

            if (error?.response?.data?.distance !== undefined) {
                const distance = Math.round(error.response.data.distance)
                errorMessage = `${errorMessage} (Distance: ${distance}m)`
            }

            const isNetworkError = error?.code === 'ERR_NETWORK' || error?.code === 'ERR_INTERNET_DISCONNECTED' || error?.message?.toLowerCase?.().includes('network')
            if (!actuallyOnline || isNetworkError) {
                if (isClockedIn) {
                    await addClockOut(offlinePayload as ClockInPayload)
                } else {
                    await addClockIn(offlinePayload as ClockInPayload)
                }
                setResult({ success: true, message: t('attendance.queued') })
            } else {
                setResult({ success: false, message: errorMessage })
            }
        }

        setTimeout(() => setResult(null), 3000)
        removeSelfie()
    }

    // Always use coordinates and radius as numbers (API may return decimals as strings)
    const siteLat = todayShift?.site ? Number(todayShift.site.latitude) : null
    const siteLng = todayShift?.site ? Number(todayShift.site.longitude) : null
    const radiusMeters = todayShift?.site
        ? Number((todayShift.site as { geo_radius_meters?: number; geo_radius?: number }).geo_radius_meters
            ?? (todayShift.site as { geo_radius?: number }).geo_radius ?? 100)
        : 0

    const distance = position && siteLat != null && siteLng != null
        ? haversineDistance(position.latitude, position.longitude, siteLat, siteLng)
        : null

    const isWithinRadius = distance !== null && todayShift?.site
        ? distance <= radiusMeters
        : null

    if (isLoadingRoster) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Result Toast */}
            {result && (
                <div
                    className={`fixed top-16 left-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${result.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}
                >
                    {result.success ? (
                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    )}
                    <span className="flex-1">{result.message}</span>
                </div>
            )}

            {/* Today's Shift Card */}
            <Card variant="elevated">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{t('home.todayShift')}</span>
                        {isClockedIn && <Badge variant="success">{t('attendance.verified')}</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {todayShift ? (
                        <ShiftInfo shift={todayShift} />
                    ) : (
                        <p className="text-gray-500 text-center py-4">{t('home.noShift')}</p>
                    )}
                </CardContent>
            </Card>

            {/* Map Preview - always uses stored site coordinates (not site name / geocoding) */}
            {todayShift?.site && siteLat != null && siteLng != null && (
                <Card>
                    <CardContent className="p-0 overflow-hidden rounded-xl">
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-600">
                            <span className="font-medium">{t('home.siteCoordinates') || 'Site location (coordinates)'}:</span>{' '}
                            {siteLat.toFixed(4)}, {siteLng.toFixed(4)}
                            <span className="mx-2">•</span>
                            <span className="font-medium">{t('home.clockInRadius') || 'Clock-in radius'}:</span> {radiusMeters} m
                        </div>
                        <MapPreview
                            siteLatitude={siteLat}
                            siteLongitude={siteLng}
                            siteRadius={radiusMeters}
                            userLatitude={position?.latitude}
                            userLongitude={position?.longitude}
                            className="h-48"
                        />
                    </CardContent>
                </Card>
            )}

            {/* Distance & GPS Status */}
            {todayShift && (
                <Card>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MapPin className={`h-5 w-5 ${isWithinRadius ? 'text-success' : 'text-warning'}`} />
                                <div>
                                    <p className="text-sm font-medium">
                                        {distance !== null ? formatDistance(distance) : '--'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {isWithinRadius === null
                                            ? t('home.gpsAccuracy')
                                            : isWithinRadius
                                                ? t('home.within')
                                                : t('home.outside')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => requestPosition()}
                                isLoading={isGPSLoading}
                            >
                                Refresh GPS
                            </Button>
                        </div>
                        {gpsError && (
                            <div className="mt-2">
                                <p className="text-xs text-error">
                                    {gpsError.includes('permission denied') || permissionStatus === 'denied'
                                        ? t('attendance.locationPermissionDenied') || 'Location permission denied.'
                                        : gpsError}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Selfie Capture (Optional) */}
            {todayShift && (
                <Card>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-3">{t('attendance.selfieOptional')}</p>
                        <input
                            type="file"
                            accept="image/*"
                            capture="user"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {selfiePreview ? (
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                                <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
                                <button
                                    onClick={removeSelfie}
                                    className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                                >
                                    <X className="h-4 w-4 text-white" />
                                </button>
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" onClick={handleTakeSelfie}>
                                <Camera className="h-4 w-4 mr-2" />
                                {t('attendance.takeSelfie')}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Clock In/Out Button */}
            {todayShift && (
                <div className="pt-4">
                    <Button
                        size="xl"
                        className={`w-full h-20 text-xl font-bold ${isClockedIn ? 'bg-accent text-primary-800 hover:bg-accent-600' : 'bg-primary'
                            }`}
                        onClick={handleClockAction}
                        isLoading={isClockingIn || isClockingOut || isGPSLoading}
                    >
                        {isClockedIn ? t('home.clockOut') : t('home.clockIn')}
                    </Button>
                </div>
            )}
        </div>
    )
}

function ShiftInfo({ shift }: { shift: ShiftSchedule }) {
    return (
        <div className="space-y-3">
            <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                    <p className="font-medium">{shift.site.site_name}</p>
                    <p className="text-sm text-gray-500">{shift.site.site_address}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <p className="font-medium">
                    {format(new Date(shift.shift_start), 'HH:mm')} - {format(new Date(shift.shift_end), 'HH:mm')}
                </p>
            </div>
            {shift.job && (
                <Badge variant="info">{shift.job.job_name}</Badge>
            )}
        </div>
    )
}
