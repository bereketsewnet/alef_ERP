import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock } from "lucide-react"
import { useRosterReport } from "@/services/useReports"
import type { ShiftSchedule } from "@/api/endpoints/roster"

export function RecentRoster() {
    // Get upcoming shifts (next 7 days)
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const { data: rosterData, isLoading } = useRosterReport({ 
        start_date: today,
        end_date: nextWeek
    })

    // Get upcoming shifts from roster
    const upcomingShifts = (rosterData?.data || [])
        .filter((shift: ShiftSchedule) => {
            const shiftDate = new Date(shift.shift_start)
            const now = new Date()
            return shiftDate >= now
        })
        .sort((a: ShiftSchedule, b: ShiftSchedule) => new Date(a.shift_start).getTime() - new Date(b.shift_start).getTime())
        .slice(0, 10)

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = date.getTime() - now.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffHours / 24)
        
        let relative = ''
        if (diffDays > 0) {
            relative = `in ${diffDays} day${diffDays > 1 ? 's' : ''}`
        } else if (diffHours > 0) {
            relative = `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`
        } else {
            relative = 'soon'
        }
        
        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            relative
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upcoming Roster</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center py-8 text-neutral-500">Loading upcoming shifts...</div>
                ) : upcomingShifts.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">No upcoming shifts scheduled</div>
                ) : (
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                            {upcomingShifts.map((shift: ShiftSchedule) => {
                                const { date, time, relative } = formatDateTime(shift.shift_start)
                                const endTime = new Date(shift.shift_end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                
                                return (
                                    <div
                                        key={shift.id}
                                        className="flex gap-4 pb-4 border-b border-neutral-200 last:border-0"
                                    >
                                        <div className="mt-1">
                                            <div className="p-2 rounded-lg bg-blue-100">
                                                <Calendar className="h-4 w-4 text-blue-600" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-900">
                                                        {shift.employee ? `${shift.employee.first_name} ${shift.employee.last_name}` : 'Unassigned'}
                                                    </p>
                                                    {shift.site && (
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <MapPin className="h-3 w-3 text-neutral-500" />
                                                            <p className="text-xs text-neutral-500">
                                                                {shift.site.site_name}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <Badge variant={shift.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                                                    {shift.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                <Clock className="h-3 w-3" />
                                                <span>{date} • {time} - {endTime}</span>
                                            </div>
                                            {shift.job && (
                                                <p className="text-xs text-neutral-500">
                                                    {shift.job.job_name}
                                                </p>
                                            )}
                                            <p className="text-xs text-neutral-400">
                                                {relative}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}

