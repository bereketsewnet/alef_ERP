import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Bell } from "lucide-react"
import { employeesApi, type EmployeeAlert } from "@/api/endpoints/employees"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

interface EmployeeAlertsPanelProps {
    employeeId: number
}

export function EmployeeAlertsPanel({ employeeId }: EmployeeAlertsPanelProps) {
    const { data, isLoading, error } = useQuery<EmployeeAlert[]>({
        queryKey: ['employee-alerts', employeeId],
        queryFn: () => employeesApi.getAlerts(employeeId, { type: 'panic' }),
    })

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-center p-6">
                        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-red-500 text-sm">
                        Failed to load alerts
                    </p>
                </CardContent>
            </Card>
        )
    }

    const alerts = data || []
    const hasAlerts = alerts.length > 0

    return (
        <div className="space-y-3">
            {/* Top banner if there are alerts */}
            {hasAlerts && (
                <Card className="border-amber-400 bg-amber-50">
                    <CardContent className="pt-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                            <p className="font-semibold text-amber-800">
                                This employee has active panic alerts
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                                Total alerts: {alerts.length}. Please review the alert history below and ensure follow-up actions are taken.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Bell className="h-4 w-4" />
                        Alert History
                    </CardTitle>
                    {hasAlerts ? (
                        <Badge variant="destructive" className="text-xs">
                            {alerts.length} Panic Alerts
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-xs">
                            No Alerts
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                    {alerts.length === 0 ? (
                        <p className="text-sm text-neutral-500">
                            No panic alerts recorded for this employee.
                        </p>
                    ) : (
                        alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="border border-amber-100 rounded-md p-3 bg-amber-50/60"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-neutral-600">
                                        {format(new Date(alert.created_at), 'MMM d, yyyy HH:mm')}
                                    </div>
                                    <Badge variant="destructive" className="text-[10px]">
                                        {alert.report_type}
                                    </Badge>
                                </div>
                                {alert.site?.site_name && (
                                    <div className="mt-1 text-xs text-neutral-700">
                                        <span className="font-medium">Site: </span>
                                        {alert.site.site_name}
                                    </div>
                                )}
                                <p className="mt-1 text-sm text-neutral-800">
                                    {alert.description}
                                </p>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

