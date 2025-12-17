import { useTranslation } from 'react-i18next'
import { format, isToday, isTomorrow } from 'date-fns'
import { MapPin, Clock, ChevronRight, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useRoster } from '@/hooks/useRoster'
import type { ShiftSchedule } from '@/types'

export function RosterPage() {
    const { t } = useTranslation()
    const { upcomingShifts, isLoading, isOffline } = useRoster()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t('roster.title')}</h1>
                {isOffline && (
                    <Badge variant="warning">Cached</Badge>
                )}
            </div>

            {upcomingShifts.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                        {t('roster.noUpcoming')}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {upcomingShifts.map((shift) => (
                        <ShiftCard key={shift.id} shift={shift} />
                    ))}
                </div>
            )}
        </div>
    )
}

function ShiftCard({ shift }: { shift: ShiftSchedule }) {
    const { t } = useTranslation()
    const shiftDate = new Date(shift.shift_start)

    const getDateLabel = () => {
        if (isToday(shiftDate)) return t('roster.today')
        if (isTomorrow(shiftDate)) return t('roster.tomorrow')
        return format(shiftDate, 'EEE, MMM d')
    }

    const openDirections = () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${shift.site.latitude},${shift.site.longitude}`
        window.open(url, '_blank')
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                    <span className="font-semibold">{getDateLabel()}</span>
                    <Badge
                        variant={
                            shift.status === 'COMPLETED'
                                ? 'success'
                                : shift.status === 'IN_PROGRESS'
                                    ? 'info'
                                    : 'default'
                        }
                    >
                        {shift.status}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{shift.site.site_name}</p>
                        <p className="text-sm text-gray-500 truncate">{shift.site.site_address}</p>
                    </div>
                    <button
                        onClick={openDirections}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                        <ExternalLink className="h-3 w-3" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <p className="font-medium">
                        {format(new Date(shift.shift_start), 'HH:mm')} - {format(new Date(shift.shift_end), 'HH:mm')}
                    </p>
                </div>

                {shift.job && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <Badge variant="info">{shift.job.job_name}</Badge>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                )}

                {shift.site.instructions && (
                    <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-medium mb-1">{t('roster.instructions')}</p>
                        <p className="text-sm text-gray-700">{shift.site.instructions}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
