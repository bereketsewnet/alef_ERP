import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Clock, User, MapPin, FileText } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type { ShiftWithAttendance, AttendanceStatusFull } from '@/api/endpoints/attendance'
import { useManualAttendanceEntry, useUpdateManualAttendance } from '@/services/useAttendance'

interface Props {
    open: boolean
    onClose: () => void
    shift: ShiftWithAttendance | null
}

const STATUS_OPTIONS: { value: AttendanceStatusFull; label: string; color: string }[] = [
    { value: 'PRESENT',                 label: 'Present',                   color: 'bg-green-100 text-green-800 border-green-300' },
    { value: 'LATE',                    label: 'Late (No Permission)',       color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { value: 'LATE_WITH_PERMISSION',    label: 'Late (With Permission)',     color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { value: 'ABSENT',                  label: 'Absent (No Permission)',     color: 'bg-red-100 text-red-800 border-red-300' },
    { value: 'ABSENT_WITH_PERMISSION',  label: 'Absent (With Permission)',   color: 'bg-orange-100 text-orange-800 border-orange-300' },
]

function toLocalDatetimeValue(isoString: string): string {
    try {
        return format(parseISO(isoString), "yyyy-MM-dd'T'HH:mm")
    } catch {
        return ''
    }
}

export function ManualAttendanceModal({ open, onClose, shift }: Props) {
    const isEdit = !!shift?.attendance_log?.manual_entry

    const [status, setStatus] = useState<AttendanceStatusFull>('PRESENT')
    const [clockIn, setClockIn]   = useState('')
    const [clockOut, setClockOut] = useState('')
    const [note, setNote]         = useState('')

    const { mutate: createEntry, isPending: isCreating } = useManualAttendanceEntry()
    const { mutate: updateEntry, isPending: isUpdating } = useUpdateManualAttendance()

    const isPending = isCreating || isUpdating
    const isAbsent  = status === 'ABSENT' || status === 'ABSENT_WITH_PERMISSION'

    // Populate form when a shift is loaded or when switching between shifts
    useEffect(() => {
        if (!shift) return

        if (isEdit && shift.attendance_log) {
            const log = shift.attendance_log
            // Reconstruct full status from stored status + with_permission
            const raw = log.attendance_status
            const perm = log.with_permission
            let fullStatus: AttendanceStatusFull = 'PRESENT'
            if (raw === 'ABSENT') fullStatus = perm ? 'ABSENT_WITH_PERMISSION' : 'ABSENT'
            else if (raw === 'LATE') fullStatus = perm ? 'LATE_WITH_PERMISSION' : 'LATE'
            setStatus(fullStatus)
            setClockIn(log.clock_in_time  ? toLocalDatetimeValue(log.clock_in_time)  : '')
            setClockOut(log.clock_out_time ? toLocalDatetimeValue(log.clock_out_time) : '')
            setNote(log.manual_note ?? '')
        } else {
            // Default PRESENT → auto-fill from shift times
            setStatus('PRESENT')
            setClockIn(toLocalDatetimeValue(shift.shift_start))
            setClockOut(toLocalDatetimeValue(shift.shift_end))
            setNote('')
        }
    }, [shift, isEdit])

    // When status changes, update times accordingly
    const handleStatusChange = (newStatus: AttendanceStatusFull) => {
        setStatus(newStatus)
        if (!shift) return

        const absent = newStatus === 'ABSENT' || newStatus === 'ABSENT_WITH_PERMISSION'
        if (absent) {
            setClockIn('')
            setClockOut('')
        } else {
            // Restore to shift times if fields are empty
            if (!clockIn)  setClockIn(toLocalDatetimeValue(shift.shift_start))
            if (!clockOut) setClockOut(toLocalDatetimeValue(shift.shift_end))
        }
    }

    const handleSubmit = () => {
        if (!shift) return

        const payload = {
            attendance_status: status,
            clock_in_time:  !isAbsent && clockIn  ? new Date(clockIn).toISOString()  : null,
            clock_out_time: !isAbsent && clockOut ? new Date(clockOut).toISOString() : null,
            manual_note: note || null,
        }

        if (isEdit && shift.attendance_log) {
            updateEntry(
                { id: shift.attendance_log.id, data: payload },
                { onSuccess: onClose },
            )
        } else {
            createEntry(
                { schedule_id: shift.id, ...payload },
                { onSuccess: onClose },
            )
        }
    }

    if (!shift) return null

    const shiftStart = format(parseISO(shift.shift_start), 'HH:mm')
    const shiftEnd   = format(parseISO(shift.shift_end),   'HH:mm')
    const shiftDate  = format(parseISO(shift.shift_start), 'EEE, dd MMM yyyy')

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Attendance' : 'Record Attendance'}</DialogTitle>
                    <DialogDescription>
                        Manual attendance entry for the shift below
                    </DialogDescription>
                </DialogHeader>

                {/* Shift summary */}
                <div className="rounded-lg border bg-neutral-50 p-3 space-y-1 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                        <User className="h-4 w-4 text-neutral-500" />
                        {shift.employee.first_name} {shift.employee.last_name}
                        <span className="text-neutral-400 font-normal">#{shift.employee.employee_code}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600">
                        <MapPin className="h-4 w-4 text-neutral-400" />
                        {shift.site.site_name}
                        {shift.site.client && <span className="text-neutral-400">— {shift.site.client.company_name}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600">
                        <Clock className="h-4 w-4 text-neutral-400" />
                        {shiftDate} &nbsp;·&nbsp; {shiftStart} – {shiftEnd}
                    </div>
                </div>

                {/* Status selector */}
                <div className="space-y-2">
                    <Label>Attendance Status</Label>
                    <div className="grid grid-cols-1 gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleStatusChange(opt.value)}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all text-left
                                    ${status === opt.value
                                        ? `${opt.color} border-2 ring-2 ring-offset-1 ring-current`
                                        : 'border-neutral-200 bg-white hover:bg-neutral-50'
                                    }`}
                            >
                                <span
                                    className={`h-3 w-3 rounded-full border-2 ${
                                        status === opt.value ? 'bg-current border-current' : 'border-neutral-400'
                                    }`}
                                />
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Time fields — hidden for absent */}
                {!isAbsent && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="clock_in">Clock-in Time</Label>
                            <Input
                                id="clock_in"
                                type="datetime-local"
                                value={clockIn}
                                onChange={(e) => setClockIn(e.target.value)}
                            />
                            <p className="text-xs text-neutral-400">
                                Roster: {shiftStart}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="clock_out">Clock-out Time</Label>
                            <Input
                                id="clock_out"
                                type="datetime-local"
                                value={clockOut}
                                onChange={(e) => setClockOut(e.target.value)}
                            />
                            <p className="text-xs text-neutral-400">
                                Roster: {shiftEnd}
                            </p>
                        </div>
                    </div>
                )}

                {isAbsent && (
                    <div className="rounded-md bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-700">
                        No clock-in/out times needed for absent entries. The shift will be
                        counted as absent in payroll.
                    </div>
                )}

                {/* Note */}
                <div className="space-y-1">
                    <Label htmlFor="note" className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        Note <span className="text-neutral-400 font-normal">(optional)</span>
                    </Label>
                    <Textarea
                        id="note"
                        placeholder="Reason, context, or any relevant information…"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" onClick={onClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending ? 'Saving…' : isEdit ? 'Update Attendance' : 'Record Attendance'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

/** Small helper badge used in the shifts table */
export function AttendanceStatusBadge({ status }: { status: AttendanceStatusFull | 'PENDING' }) {
    const map: Record<string, { label: string; className: string }> = {
        PRESENT:                { label: 'Present',              className: 'bg-green-100  text-green-800'  },
        LATE:                   { label: 'Late',                 className: 'bg-yellow-100 text-yellow-800' },
        LATE_WITH_PERMISSION:   { label: 'Late (Perm.)',         className: 'bg-blue-100   text-blue-800'   },
        ABSENT:                 { label: 'Absent',               className: 'bg-red-100    text-red-800'    },
        ABSENT_WITH_PERMISSION: { label: 'Absent (Perm.)',       className: 'bg-orange-100 text-orange-800' },
        PENDING:                { label: 'Pending',              className: 'bg-neutral-100 text-neutral-600' },
    }
    const cfg = map[status] ?? map.PENDING
    return <Badge className={`${cfg.className} border-0`}>{cfg.label}</Badge>
}
