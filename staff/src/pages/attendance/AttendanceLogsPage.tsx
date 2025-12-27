import { useState, useEffect } from 'react'
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
import { Search, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight, Download, MapPin, Clock } from "lucide-react"
import { useAttendanceLogs, useVerifyAttendance, useUnverifyAttendance, useExportAttendance } from "@/services/useAttendance"
import type { AttendanceFilters, AttendanceLog } from "@/api/endpoints/attendance"

export function AttendanceLogsPage() {
    const [filters, setFilters] = useState<AttendanceFilters>({
        page: 1
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null)

    const { data, isLoading, error } = useAttendanceLogs(filters)
    const { mutate: verify } = useVerifyAttendance()
    const { mutate: unverify } = useUnverifyAttendance()
    const { mutate: exportData, isPending: isExporting } = useExportAttendance()

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

    const handleVerifyToggle = (id: number, isVerified: boolean) => {
        if (isVerified) {
            unverify(id)
        } else {
            verify(id)
        }
    }

    const handleExport = () => {
        exportData({
            start_date: filters.start_date,
            end_date: filters.end_date,
            site_id: filters.site_id
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

    const calculateHours = (clockIn: string, clockOut: string | null) => {
        if (!clockOut) return <span className="text-gray-400 italic">In Progress</span>
        const start = new Date(clockIn)
        const end = new Date(clockOut)
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        return `${hours.toFixed(2)}h`
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900">
                    Attendance Logs
                </h1>
                <p className="text-neutral-600 mt-1">
                    View and manage employee clock-in/out records
                </p>
            </div>

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

                    <Button onClick={handleExport} disabled={isExporting} variant="outline" className="mb-[1px]">
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Export CSV'}
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
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
                                    {calculateHours(log.clock_in_time, log.clock_out_time)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        {log.clock_out_time ? (
                                            <>
                                                {log.flagged_late && <Badge variant="destructive">Late</Badge>}
                                                {log.flagged_early_leave && <Badge variant="warning">Early</Badge>}
                                                {!log.flagged_late && !log.flagged_early_leave && <Badge variant="success">On Time</Badge>}
                                            </>
                                        ) : (
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Active</Badge>
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
                <div className="flex items-center justify-between">
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
                                    <span className="font-medium">{calculateHours(selectedLog.clock_in_time, selectedLog.clock_out_time)}</span>

                                    <span className="text-gray-500">Verification:</span>
                                    <span className={selectedLog.is_verified ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                                        {selectedLog.is_verified ? 'Verified' : 'Pending Verification'}
                                    </span>
                                </div>
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
                                            <span>{selectedLog.clock_in_latitude}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Lng:</span>
                                            <span>{selectedLog.clock_in_longitude}</span>
                                        </div>
                                    </div>
                                    {selectedLog.clock_out_latitude && (
                                        <div className="text-xs text-gray-500 mt-2">
                                            Clock out location recorded
                                        </div>
                                    )}
                                </div>
                            </div>

                            {(selectedLog as any).selfie_url && (
                                <div className="col-span-2 space-y-2">
                                    <h3 className="font-semibold">Selfie Verification</h3>
                                    <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                                        <img
                                            src={(selectedLog as any).selfie_url}
                                            alt="Attendance Selfie"
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
