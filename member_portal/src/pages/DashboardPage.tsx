import { useState, useRef } from 'react'
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
    const { position, requestPosition, isLoading: isGPSLoading, error: gpsError } = useGPS()
    const { mutateAsync: clockIn, isPending: isClockingIn } = useClockIn()
    const { mutateAsync: clockOut, isPending: isClockingOut } = useClockOut()
    const { addClockIn, addClockOut, isOnline, syncAll } = useOfflineQueue()

    const [selfie, setSelfie] = useState<File | null>(null)
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

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
            setResult({ success: false, message: t('attendance.gpsRequired') })
            return
        }

        // Prepare payload - exclude selfie when storing offline (File objects can't be serialized)
        const payload: ClockInPayload = {
            schedule_id: todayShift.id,
            latitude: pos.latitude,
            longitude: pos.longitude,
            accuracy: pos.accuracy || 0,
            // Only include selfie when online and sending immediately
            // File objects can't be stored in IndexedDB, so exclude for offline queue
            selfie: (isOnline && selfie) ? selfie : undefined,
        }
        
        // For offline storage, create a clean payload without File objects
        const offlinePayload = {
            schedule_id: payload.schedule_id,
            latitude: payload.latitude,
            longitude: payload.longitude,
            accuracy: payload.accuracy,
            // No selfie - File objects can't be stored
        }

        try {
            if (isOnline) {
                // Try online
                const response = isClockedIn
                    ? await clockOut(payload)
                    : await clockIn(payload)

                if (response.success) {
                    setResult({ success: true, message: isClockedIn ? t('attendance.clockOutSuccess') : t('attendance.clockInSuccess') })
                    // Try to sync any pending actions after successful check-in/out
                    setTimeout(() => syncAll(), 2000)
                } else {
                    setResult({ success: false, message: response.message || t('attendance.tooFar') })
                }
            } else {
                // Queue for offline - use clean payload without File objects
                if (isClockedIn) {
                    await addClockOut(offlinePayload as ClockInPayload)
                } else {
                    await addClockIn(offlinePayload as ClockInPayload)
                }
                setResult({ success: true, message: t('attendance.queued') })
            }
        } catch (error: any) {
            // Network error or API error - show error message
            console.error('Check-in error:', error)
            
            // Extract error message from response
            let errorMessage = t('attendance.clockInFailed') || 'Clock in failed'
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message
            } else if (error?.response?.data?.error) {
                errorMessage = error.response.data.error
            } else if (error?.message) {
                errorMessage = error.message
            }
            
            // If it's a GPS/distance error, show it
            if (error?.response?.data?.distance !== undefined) {
                const distance = Math.round(error.response.data.distance)
                errorMessage = `${errorMessage} (Distance: ${distance}m)`
            }
            
            // If offline or network error, queue for later
            if (!isOnline || error?.code === 'ERR_NETWORK' || error?.code === 'ERR_INTERNET_DISCONNECTED') {
                if (isClockedIn) {
                    await addClockOut(offlinePayload as ClockInPayload)
                } else {
                    await addClockIn(offlinePayload as ClockInPayload)
                }
                setResult({ success: true, message: t('attendance.queued') })
            } else {
                // Show the actual error message
                setResult({ success: false, message: errorMessage })
            }
        }

        // Clear result after 3 seconds
        setTimeout(() => setResult(null), 3000)
        removeSelfie()
    }

    // Calculate distance if we have position and shift
    const distance = position && todayShift?.site
        ? haversineDistance(
            position.latitude,
            position.longitude,
            todayShift.site.latitude,
            todayShift.site.longitude
        )
        : null

    const isWithinRadius = distance !== null && todayShift?.site
        ? distance <= todayShift.site.geo_radius
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

            {/* Map Preview */}
            {todayShift?.site && (
                <Card>
                    <CardContent className="p-0 overflow-hidden rounded-xl">
                        <MapPreview
                            siteLatitude={todayShift.site.latitude}
                            siteLongitude={todayShift.site.longitude}
                            siteRadius={todayShift.site.geo_radius}
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
                            <p className="text-xs text-error mt-2">{gpsError}</p>
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
                        className={`w-full h-20 text-xl font-bold ${isClockedIn ? 'bg-accent hover:bg-accent-600' : 'bg-primary'
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
