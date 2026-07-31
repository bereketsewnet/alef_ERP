import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Search, CheckCircle, Eye, ChevronLeft, ChevronRight, Download, MapPin, Clock, ChevronDown, Shield, PenLine, Trash2, ClipboardCheck, ClipboardList, FileSpreadsheet } from "lucide-react"
import {
    useAttendanceLogs,
    useVerifyAttendance,
    useUnverifyAttendance,
    useExportAttendance,
    useMarkAttendancePermission,
    usePendingShifts,
    useDeleteManualAttendance,
} from "@/services/useAttendance"
import { useAttendanceMode } from "@/services/useSettings"
import { PermissionManagementModal } from "@/components/attendance/PermissionManagementModal"
import { ManualAttendanceModal, AttendanceStatusBadge } from "@/components/attendance/ManualAttendanceModal"
import { useClients } from "@/services/useClients"
import type { AttendanceFilters, AttendanceLog, ShiftWithAttendance } from "@/api/endpoints/attendance"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FieldStaffSchedulerDialog } from '@/components/attendance/FieldStaffSchedulerDialog'
import { AttendanceImportDialog } from '@/components/attendance/AttendanceImportDialog'

export function AttendanceLogsPage() {
    // ── Attendance mode from settings ────────────────────────────────
    const { data: modeData } = useAttendanceMode()
    const attendanceMode = modeData?.mode ?? 'MANUAL'

    // ── Tab state: default driven by attendance mode ─────────────────
    // MANUAL → open on Manual Entry   GPS → open on Logs   MIXED → Manual (both shown)
    const defaultTab = useMemo<'logs' | 'manual'>(
        () => (attendanceMode === 'GPS' ? 'logs' : 'manual'),
        [attendanceMode],
    )
    const [activeTab, setActiveTab] = useState<'logs' | 'manual' | 'field_staff'>(defaultTab)
    const [schedulerOpen, setSchedulerOpen] = useState(false)

    // Sync tab when mode loads from server (first render)
    useEffect(() => {
        setActiveTab(attendanceMode === 'GPS' ? 'logs' : 'manual')
    }, [attendanceMode])

    // ── Logs tab state ────────────────────────────────────────────────
    const [filters, setFilters] = useState<AttendanceFilters>({ page: 1, exclude_field_staff: true })
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null)
    const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('csv')
    const [permissionModalOpen, setPermissionModalOpen] = useState(false)
    const [permissionModalMode, setPermissionModalMode] = useState<'set' | 'remove'>('set')

    // ── Manual Entry tab state ────────────────────────────────────────
    const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [manualSearch, setManualSearch] = useState('')
    const [manualSiteId, setManualSiteId] = useState<number | undefined>()
    const [manualShift, setManualShift] = useState<ShiftWithAttendance | null>(null)
    const [manualModalOpen, setManualModalOpen] = useState(false)
    const [importModalOpen, setImportModalOpen] = useState(false)

    const { data, isLoading, error } = useAttendanceLogs(filters)
    const { mutate: verify } = useVerifyAttendance()
    const { mutate: unverify } = useUnverifyAttendance()
    const { mutate: exportData, isPending: isExporting } = useExportAttendance()
    const { mutate: markPermission } = useMarkAttendancePermission()
    const { mutate: deleteManual } = useDeleteManualAttendance()

    const { data: pendingShifts, isLoading: shiftsLoading } = usePendingShifts({
        date: manualDate,
        site_id: manualSiteId,
        search: manualSearch || undefined,
    })

    // Load sites (via clients) for site filter dropdown
    const { data: clientsData } = useClients({ page: 1, per_page: 500 })

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prev => ({
                ...prev,
                search: searchTerm || undefined,
                page: 1
            }))
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm])

    const handleDateFilter = (type: 'start' | 'end', value: string) => {
        setFilters(prev => ({
            ...prev,
            [type === 'start' ? 'start_date' : 'end_date']: value || undefined,
            page: 1
        }))
    }

    const handleSiteFilter = (value: string) => {
        const siteId = value ? Number(value) : undefined
        setFilters(prev => ({
            ...prev,
            site_id: siteId,
            page: 1,
        }))
    }

    const handleVerifyToggle = (id: number, isVerified: boolean) => {
        if (isVerified) {
            unverify(id)
        } else {
            verify(id)
        }
    }

    const handleExport = (format: 'pdf' | 'csv' = exportFormat) => {
        exportData({
            filters: {
                start_date: filters.start_date,
                end_date: filters.end_date,
                site_id: filters.site_id
            },
            format
        })
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Must work at least 95% of scheduled shift to count as "finished"
    const FINISHED_THRESHOLD = 0.95

    const getWorkedHours = (clockIn: string, clockOut: string | null): number | null => {
        if (!clockOut) return null
        const start = new Date(clockIn)
        const end = new Date(clockOut)
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    }

    const getScheduledHours = (log: AttendanceLog): number | null => {
        const s = log.schedule
        if (!s) return null
        const startStr = (s as { shift_start?: string }).shift_start ?? s.start_time
        const endStr = (s as { shift_end?: string }).shift_end ?? s.end_time
        if (!startStr || !endStr) return null
        const start = new Date(startStr)
        const end = new Date(endStr)
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    }

    const isNotFinished = (log: AttendanceLog): boolean => {
        if (!log.clock_out_time) return false
        const worked = getWorkedHours(log.clock_in_time, log.clock_out_time)
        if (worked === null) return false
        const scheduled = getScheduledHours(log)
        if (scheduled === null || scheduled <= 0) {
            // No schedule: fallback — under 15 min counts as not finished
            return worked < 15 / 60
        }
        return worked < FINISHED_THRESHOLD * scheduled
    }

    const calculateHours = (clockIn: string, clockOut: string | null, log?: AttendanceLog) => {
        if (!clockOut) return <span className="text-gray-400 italic">In Progress</span>
        const hours = getWorkedHours(clockIn, clockOut)
        if (hours === null) return '--'
        const notFinished = log ? isNotFinished(log) : false
        return (
            <span className={notFinished ? 'text-amber-600 font-medium' : ''}>
                {hours.toFixed(2)}h
                {notFinished && <span className="ml-1 text-xs text-amber-600">(Not finished)</span>}
            </span>
        )
    }

    // Calculate status counts from current page data
    const statusCounts = data?.data.reduce((acc, log) => {
        if (!log.clock_out_time) {
            acc.active++
        } else {
            if (isNotFinished(log)) {
                acc.notFinished++
            } else if (log.flagged_late) {
                acc.late++
            } else if (log.flagged_early_leave) {
                acc.early++
            } else {
                acc.present++
            }
        }
        return acc
    }, { active: 0, late: 0, early: 0, present: 0, notFinished: 0 }) || { active: 0, late: 0, early: 0, present: 0, notFinished: 0 }

    const handleDeleteManual = (logId: number) => {
        if (!window.confirm('Delete this attendance entry? The shift will be reset to Pending.')) return
        deleteManual(logId)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Attendance</h1>
                <p className="text-neutral-600 mt-1">Record and manage employee attendance</p>
            </div>
            <FieldStaffSchedulerDialog open={schedulerOpen} onOpenChange={setSchedulerOpen} />

            {/* Tab switcher */}
            <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-neutral-100 rounded-lg p-1 w-fit">
                <button
                    type="button"
                    onClick={() => { setActiveTab('manual'); setFilters(prev => ({ ...prev, field_staff: undefined, page: 1 })) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'manual'
                            ? 'bg-white shadow text-neutral-900'
                            : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    <PenLine className="h-4 w-4" />
                    Manual Entry
                </button>
                <button
                    type="button"
                    onClick={() => { setActiveTab('field_staff'); setFilters(prev => ({ ...prev, field_staff: true, exclude_field_staff: undefined, page: 1 })) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'field_staff' ? 'bg-white shadow text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                ><Shield className="h-4 w-4" /> Field Staff</button>
                <button
                    type="button"
                    onClick={() => { setActiveTab('logs'); setFilters(prev => ({ ...prev, field_staff: undefined, exclude_field_staff: true, page: 1 })) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'logs'
                            ? 'bg-white shadow text-neutral-900'
                            : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    <ClipboardList className="h-4 w-4" />
                    Logs
                </button>
            </div>
            {activeTab === 'field_staff' && <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-blue-50 p-4"><div><b>Field Staff GPS Attendance</b><p className="text-sm text-neutral-600">Monitor assigned site controllers, GPS verification, late arrivals and clock-outs.</p></div><Button onClick={() => setSchedulerOpen(true)}>Schedule Field Staff</Button></div>}
            {/* Current mode badge */}
            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${
                attendanceMode === 'MANUAL' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                attendanceMode === 'GPS'    ? 'bg-green-50  text-green-700  border-green-200'  :
                                             'bg-blue-50   text-blue-700   border-blue-200'
            }`}>
                {attendanceMode === 'MANUAL' ? 'Manual Mode' :
                 attendanceMode === 'GPS'    ? 'GPS Mode'    : 'Mixed Mode'}
            </span>
            </div>

            {/* ══════════════ MANUAL ENTRY TAB ══════════════ */}
            {activeTab === 'manual' && (
                <div className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-lg border bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div><div className="font-semibold">Bulk attendance from Excel</div><p className="text-sm text-neutral-600">Import manual, GPS, or mixed attendance with row-level validation and safe updates.</p></div>
                        <Button type="button" variant="outline" onClick={() => setImportModalOpen(true)} className="shrink-0"><FileSpreadsheet className="mr-2 h-4 w-4" />Excel Import</Button>
                    </div>
                    <AttendanceImportDialog open={importModalOpen} onOpenChange={setImportModalOpen} />
                    {/* Filters row */}
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div>
                            <Label className="mb-1 block">Date</Label>
                            <Input
                                type="date"
                                value={manualDate}
                                onChange={(e) => setManualDate(e.target.value)}
                                className="w-44"
                            />
                        </div>
                        <div className="flex-1 max-w-xs">
                            <Label className="mb-1 block">Search Employee</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                                <Input
                                    placeholder="Name…"
                                    value={manualSearch}
                                    onChange={(e) => setManualSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1 block">Site</Label>
                            <select
                                className="flex h-10 w-full sm:w-52 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={manualSiteId?.toString() ?? ''}
                                onChange={(e) => setManualSiteId(e.target.value ? Number(e.target.value) : undefined)}
                            >
                                <option value="">All sites</option>
                                {clientsData?.data.flatMap((client: any) =>
                                    (client.sites || []).map((site: any) => (
                                        <option key={site.id} value={site.id}>
                                            {client.company_name} — {site.site_name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Pending-shifts summary badges */}
                    {pendingShifts && (
                        <div className="flex gap-3 flex-wrap">
                            {(['PENDING', 'PRESENT', 'LATE', 'LATE_WITH_PERMISSION', 'ABSENT', 'ABSENT_WITH_PERMISSION', 'POLICY_VIOLATION'] as const).map((s) => {
                                const count = pendingShifts.filter((sh) => sh.attendance_status === s).length
                                if (count === 0) return null
                                return (
                                    <div key={s} className="flex items-center gap-1">
                                        <AttendanceStatusBadge status={s} />
                                        <span className="text-sm font-semibold">{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Shifts table */}
                    <div className="border rounded-lg bg-white overflow-x-auto shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Site</TableHead>
                                    <TableHead>Shift Time</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shiftsLoading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                                            Loading shifts…
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!shiftsLoading && (!pendingShifts || pendingShifts.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                                            No shifts found for this date
                                        </TableCell>
                                    </TableRow>
                                )}
                                {pendingShifts?.map((shift) => {
                                    const start = new Date(shift.shift_start)
                                    const end   = new Date(shift.shift_end)
                                    const hrs   = ((end.getTime() - start.getTime()) / 3600000).toFixed(1)
                                    return (
                                        <TableRow key={shift.id}>
                                            <TableCell className="font-medium">
                                                {shift.employee.first_name} {shift.employee.last_name}
                                                <div className="text-xs text-neutral-500">{shift.employee.employee_code}</div>
                                            </TableCell>
                                            <TableCell>{shift.site.site_name}</TableCell>
                                            <TableCell className="text-sm">
                                                {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
                                                <span className="ml-1 text-neutral-400">({hrs}h)</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap items-center gap-1">
                                                    <AttendanceStatusBadge status={shift.attendance_status} />
                                                    {shift.attendance_log?.manual_entry && (
                                                        <Badge variant="outline" className="text-xs border-violet-300 text-violet-700">
                                                            Manual
                                                        </Badge>
                                                    )}
                                                </div>
                                                {shift.attendance_log?.manual_note && (
                                                    <div className="mt-1 max-w-xs text-xs text-neutral-600">
                                                        Reason: {shift.attendance_log.manual_note}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button
                                                    size="sm"
                                                    variant={shift.attendance_status === 'PENDING' ? 'default' : 'outline'}
                                                    onClick={() => {
                                                        setManualShift(shift)
                                                        setManualModalOpen(true)
                                                    }}
                                                    title={shift.attendance_log && !shift.attendance_log.manual_entry
                                                        ? 'Review status or reason; GPS evidence will be preserved'
                                                        : shift.attendance_status === 'PENDING' ? 'Record attendance' : 'Edit attendance'}
                                                >
                                                    <PenLine className="h-3.5 w-3.5 mr-1" />
                                                    {shift.attendance_status === 'PENDING' ? 'Record' : 'Edit'}
                                                </Button>
                                                {shift.attendance_log?.manual_entry && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDeleteManual(shift.attendance_log!.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* ══════════════ LOGS TAB ══════════════ */}
            {(activeTab === 'logs' || activeTab === 'field_staff') && (
            <>

            {/* Status Summary */}
            {data && data.data.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm text-blue-600 font-medium">Active</div>
                        <div className="text-2xl font-bold text-blue-700 mt-1">{statusCounts.active}</div>
                        <div className="text-xs text-blue-500 mt-1">Currently working</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="text-sm text-amber-600 font-medium">Not finished</div>
                        <div className="text-2xl font-bold text-amber-700 mt-1">{statusCounts.notFinished}</div>
                        <div className="text-xs text-amber-500 mt-1">Clocked out &lt; 15 min</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-sm text-red-600 font-medium">Late</div>
                        <div className="text-2xl font-bold text-red-700 mt-1">{statusCounts.late}</div>
                        <div className="text-xs text-red-500 mt-1">Arrived late</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="text-sm text-yellow-600 font-medium">Early</div>
                        <div className="text-2xl font-bold text-yellow-700 mt-1">{statusCounts.early}</div>
                        <div className="text-xs text-yellow-500 mt-1">Left early</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm text-green-600 font-medium">Present</div>
                        <div className="text-2xl font-bold text-green-700 mt-1">{statusCounts.present}</div>
                        <div className="text-xs text-green-500 mt-1">On time & complete</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full relative">
                        <Label htmlFor="search" className="mb-2 block">Search</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                            <Input
                                id="search"
                                type="search"
                                placeholder="Search by name, email, or phone..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="mb-2 block">Date Range</Label>
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                aria-label="Start Date"
                                onChange={(e) => handleDateFilter('start', e.target.value)}
                                value={filters.start_date || ''}
                                className="w-40"
                            />
                            <Input
                                type="date"
                                aria-label="End Date"
                                onChange={(e) => handleDateFilter('end', e.target.value)}
                                value={filters.end_date || ''}
                                className="w-40"
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="mb-2 block">Site</Label>
                        <select
                            className="flex h-10 w-full sm:w-52 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={filters.site_id?.toString() || ''}
                            onChange={(e) => handleSiteFilter(e.target.value)}
                        >
                            <option value="">All sites</option>
                            {clientsData?.data.flatMap((client: any) =>
                                (client.sites || []).map((site: any) => (
                                    <option key={site.id} value={site.id}>
                                        {client.company_name} - {site.site_name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={isExporting} variant="outline" className="mb-[1px]">
                                    <Download className="h-4 w-4 mr-2" />
                                    {isExporting ? 'Exporting...' : 'Export'}
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleExport('csv')} disabled={isExporting}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={isExporting}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export as PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="mb-[1px]">
                                    <Shield className="h-4 w-4 mr-2" />
                                    Permission
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                    setPermissionModalMode('set')
                                    setPermissionModalOpen(true)
                                }}>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Set Permission
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    setPermissionModalMode('remove')
                                    setPermissionModalOpen(true)
                                }}>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Remove Permission
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg bg-white overflow-x-auto shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Site</TableHead>
                            <TableHead>Clock In</TableHead>
                            <TableHead>Clock Out</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Verified</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-neutral-500">
                                    Loading attendance logs...
                                </TableCell>
                            </TableRow>
                        )}

                        {error && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-red-600">
                                    Error loading attendance: {(error as any).response?.data?.error || 'Unknown error. Check backend logs.'}
                                </TableCell>
                            </TableRow>
                        )}

                        {data && data.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-neutral-500">
                                    No attendance logs found
                                </TableCell>
                            </TableRow>
                        )}

                        {data?.data.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="font-medium">
                                    {log.employee ? `${log.employee.first_name} ${log.employee.last_name}` : 'N/A'}
                                    <div className="text-xs text-neutral-500">
                                        {log.employee?.employee_code}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {log.schedule?.site?.site_name || 'N/A'}
                                </TableCell>
                                <TableCell>
                                    {formatDateTime(log.clock_in_time)}
                                </TableCell>
                                <TableCell>
                                    {log.clock_out_time ? formatDateTime(log.clock_out_time) : <span className="text-yellow-600 text-sm">--</span>}
                                </TableCell>
                                <TableCell>
                                    {calculateHours(log.clock_in_time, log.clock_out_time, log)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex flex-wrap gap-1">
                                            {!log.clock_out_time ? (
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Active</Badge>
                                            ) : isNotFinished(log) ? (
                                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300">Not finished</Badge>
                                            ) : (
                                                <>
                                                    {log.attendance_status === 'POLICY_VIOLATION' && <Badge className="bg-purple-100 text-purple-800">Policy Violation</Badge>}
                                                    {log.attendance_status !== 'POLICY_VIOLATION' && log.flagged_late && <Badge variant="destructive">Late</Badge>}
                                                    {log.flagged_early_leave && <Badge variant="warning">Early</Badge>}
                                                    {log.attendance_status !== 'POLICY_VIOLATION' && !log.flagged_late && !log.flagged_early_leave && <Badge variant="success">Present</Badge>}
                                                </>
                                            )}
                                        </div>
                                        {log.with_permission && (
                                            <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">
                                                With Permission
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleVerifyToggle(log.id, log.is_verified)}
                                        className="gap-1 h-8 w-8 p-0"
                                        title={log.is_verified ? "Unverify" : "Verify"}
                                    >
                                        {log.is_verified ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-1 h-8 w-8 p-0 ml-1"
                                        title={log.with_permission ? "Remove Permission" : "Mark With Permission"}
                                        onClick={() => markPermission({ id: log.id })}
                                    >
                                        {log.with_permission ? (
                                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-400 text-blue-700">
                                                P
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-gray-400">P?</span>
                                        )}
                                    </Button>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Details
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data && data.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="text-sm text-neutral-500">
                        Showing {data.from} to {data.to} of {data.total} results
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
                            disabled={!data.prev_page_url}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <div className="flex items-center gap-2 px-3">
                            <span className="text-sm">
                                Page {data.current_page} of {data.last_page}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
                            disabled={!data.next_page_url}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Attendance Details</DialogTitle>
                        <DialogDescription>
                            Log ID: #{selectedLog?.id}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Time & Status
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="text-gray-500">Clock In:</span>
                                    <span className="font-medium">{formatDateTime(selectedLog.clock_in_time)}</span>

                                    <span className="text-gray-500">Clock Out:</span>
                                    <span className="font-medium">{selectedLog.clock_out_time ? formatDateTime(selectedLog.clock_out_time) : 'Active'}</span>

                                    <span className="text-gray-500">Duration:</span>
                                    <span className="font-medium">{calculateHours(selectedLog.clock_in_time, selectedLog.clock_out_time, selectedLog)}</span>

                                    {selectedLog.clock_out_time && isNotFinished(selectedLog) && (
                                        <>
                                            <span className="text-gray-500">Status:</span>
                                            <span className="font-medium text-amber-600">Not finished (under 95% of shift)</span>
                                        </>
                                    )}

                                    <span className="text-gray-500">Verification:</span>
                                    <span className={selectedLog.is_verified ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                                        {selectedLog.is_verified ? 'Verified' : 'Pending Verification'}
                                    </span>
                                    <span className="text-gray-500">Decision:</span>
                                    <span className="font-medium">{selectedLog.attendance_status ? selectedLog.attendance_status.replace(/_/g, ' ') : (selectedLog.flagged_late ? 'LATE' : 'PRESENT')}</span>
                                </div>
                                {selectedLog.manual_note && (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                                        <div className="font-medium text-blue-900">Reason / Note</div>
                                        <p className="mt-1 whitespace-pre-wrap text-blue-800">{selectedLog.manual_note}</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <MapPin className="h-4 w-4" /> Location
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Site:</span>
                                        <span className="font-medium text-right">{selectedLog.schedule?.site?.site_name || 'Unknown Site'}</span>
                                    </div>
                                    <div className="bg-gray-100 p-3 rounded-md text-xs font-mono space-y-1">
                                        <div className="flex justify-between">
                                            <span>Lat:</span>
                                            <span>{(selectedLog as any).clock_in_lat ?? selectedLog.clock_in_latitude ?? '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Lng:</span>
                                            <span>{(selectedLog as any).clock_in_long ?? selectedLog.clock_in_longitude ?? '—'}</span>
                                        </div>
                                    </div>
                                    {((selectedLog as any).clock_out_lat || selectedLog.clock_out_latitude) && (
                                        <div className="text-xs text-gray-500 mt-2">
                                            Clock out location recorded
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedLog.verification_method === 'GPS' && (
                                <div className="col-span-2 space-y-2">
                                    <h3 className="font-semibold">Verification Images</h3>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {(selectedLog as any).clock_in_photo_url && <div><p className="mb-1 text-xs text-gray-500">Clock-in image</p><a href={(selectedLog as any).clock_in_photo_url} target="_blank" rel="noreferrer"><img src={(selectedLog as any).clock_in_photo_url} alt="Clock-in verification" className="h-48 w-full rounded-lg border bg-gray-100 object-contain" /></a></div>}
                                        {(selectedLog as any).clock_out_photo_url && <div><p className="mb-1 text-xs text-gray-500">Clock-out image</p><a href={(selectedLog as any).clock_out_photo_url} target="_blank" rel="noreferrer"><img src={(selectedLog as any).clock_out_photo_url} alt="Clock-out verification" className="h-48 w-full rounded-lg border bg-gray-100 object-contain" /></a></div>}
                                        {!(selectedLog as any).clock_in_photo_url && !(selectedLog as any).clock_out_photo_url && <div className="sm:col-span-2 rounded-lg border border-dashed bg-neutral-50 p-6 text-center text-sm text-neutral-500">No verification image was uploaded for this attendance record. Images are optional for employees and Field Staff.</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Permission Management Modal */}
            <PermissionManagementModal
                open={permissionModalOpen}
                onOpenChange={setPermissionModalOpen}
                mode={permissionModalMode}
            />
            </> // end logs tab wrapper
            )} {/* end activeTab === 'logs' */}

            {/* Manual Attendance Modal (shared) */}
            <ManualAttendanceModal
                open={manualModalOpen}
                onClose={() => {
                    setManualModalOpen(false)
                    setManualShift(null)
                }}
                shift={manualShift}
            />
        </div>
    )
}
