import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Clock, AlertCircle, CheckCircle, XCircle, Trash2, RefreshCw, Cloud } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'

export function PendingActionsPage() {
    const { t } = useTranslation()
    const { queue, pendingCount, failedCount, isOnline, syncAll, isSyncing, clearFailed, clearAllPending } = useOfflineQueue()

    const pendingActions = queue.filter(a => a.status === 'PENDING')
    const failedActions = queue.filter(a => a.status === 'FAILED')
    const syncingActions = queue.filter(a => a.status === 'SYNCING')

    const getActionTypeLabel = (type: string) => {
        switch (type) {
            case 'CLOCK_IN':
                return t('attendance.clockIn') || 'Clock In'
            case 'CLOCK_OUT':
                return t('attendance.clockOut') || 'Clock Out'
            case 'INCIDENT':
                return t('incidents.report') || 'Report Incident'
            default:
                return type
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />{t('attendance.pending') || 'Pending'}</Badge>
            case 'SYNCING':
                return <Badge variant="info"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Syncing...</Badge>
            case 'FAILED':
                return <Badge variant="error"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
            default:
                return null
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t('home.pendingActions') || 'Pending Actions'}</h1>
                <div className="flex items-center gap-2">
                    {!isOnline && (
                        <Badge variant="error">
                            <Cloud className="h-3 w-3 mr-1" />
                            Offline
                        </Badge>
                    )}
                    {isOnline && (
                        <Badge variant="success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Online
                        </Badge>
                    )}
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                        <div className="text-xs text-gray-500">Pending</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                        <div className="text-xs text-gray-500">Failed</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{syncingActions.length}</div>
                        <div className="text-xs text-gray-500">Syncing</div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                {isOnline && pendingCount > 0 && (
                    <Button
                        onClick={syncAll}
                        disabled={isSyncing}
                        className="flex-1"
                        variant="primary"
                    >
                        {isSyncing ? (
                            <>
                                <Spinner className="mr-2" size="sm" />
                                Syncing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Sync All ({pendingCount})
                            </>
                        )}
                    </Button>
                )}
                {pendingCount > 0 && (
                    <Button
                        onClick={clearAllPending}
                        variant="outline"
                        className="flex-1"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Pending
                    </Button>
                )}
                {failedCount > 0 && (
                    <Button
                        onClick={clearFailed}
                        variant="outline"
                        className="flex-1"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Failed
                    </Button>
                )}
            </div>

            {/* Pending Actions */}
            {pendingActions.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold">Pending Actions ({pendingActions.length})</h2>
                    {pendingActions.map((action) => (
                        <Card key={action.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center justify-between text-sm">
                                    <span>{getActionTypeLabel(action.type)}</span>
                                    {getStatusBadge(action.status)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-xs text-gray-500">
                                    {format(new Date(action.timestamp), 'MMM d, yyyy HH:mm')}
                                </div>
                                {action.type === 'CLOCK_IN' || action.type === 'CLOCK_OUT' ? (
                                    <div className="text-xs">
                                        <div>Lat: {(action.payload as any)?.latitude?.toFixed(6)}</div>
                                        <div>Lng: {(action.payload as any)?.longitude?.toFixed(6)}</div>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Failed Actions */}
            {failedActions.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-red-600">Failed Actions ({failedActions.length})</h2>
                    {failedActions.map((action) => (
                        <Card key={action.id} className="border-red-300">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center justify-between text-sm">
                                    <span>{getActionTypeLabel(action.type)}</span>
                                    {getStatusBadge(action.status)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-xs text-gray-500">
                                    {format(new Date(action.timestamp), 'MMM d, yyyy HH:mm')}
                                </div>
                                {action.error && (
                                    <div className="text-xs text-error bg-red-50 p-2 rounded">
                                        <AlertCircle className="h-3 w-3 inline mr-1" />
                                        {action.error}
                                    </div>
                                )}
                                <div className="text-xs text-gray-400">
                                    Retries: {action.retryCount}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {queue.length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                        <Cloud className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>{t('home.noItems') || 'No pending items'}</p>
                        <p className="text-xs mt-2">All actions have been synced successfully</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

