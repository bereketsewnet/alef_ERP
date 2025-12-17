import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { MapPin, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useAttendanceLogs } from '@/hooks/useAttendance'

export function HistoryPage() {
    const { t } = useTranslation()
    const { data, isLoading } = useAttendanceLogs()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        )
    }

    const logs = data?.data || []

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">{t('attendance.history')}</h1>

            {logs.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                        No attendance records yet
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {logs.map((log) => (
                        <Card key={log.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center justify-between text-sm">
                                    <span>{format(new Date(log.created_at), 'EEE, MMM d yyyy')}</span>
                                    <div className="flex items-center gap-2">
                                        {log.flagged_late && (
                                            <Badge variant="warning">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                {t('attendance.late')}
                                            </Badge>
                                        )}
                                        {log.is_verified ? (
                                            <Badge variant="success">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                {t('attendance.verified')}
                                            </Badge>
                                        ) : (
                                            <Badge variant="default">
                                                <XCircle className="h-3 w-3 mr-1" />
                                                {t('attendance.pending')}
                                            </Badge>
                                        )}
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {log.schedule?.site && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span>{log.schedule.site.site_name}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-green-500" />
                                        <span>
                                            In: {log.clock_in_time ? format(new Date(log.clock_in_time), 'HH:mm') : '--'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-red-500" />
                                        <span>
                                            Out: {log.clock_out_time ? format(new Date(log.clock_out_time), 'HH:mm') : '--'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                    Method: {log.verification_method}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
