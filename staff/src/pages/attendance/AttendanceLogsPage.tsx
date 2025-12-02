import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Search, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { useAttendanceLogs, useVerifyAttendance, useUnverifyAttendance, useExportAttendance } from "@/services/useAttendance"
import type { AttendanceFilters } from "@/api/endpoints/attendance"

export function AttendanceLogsPage() {
    const [filters, setFilters] = useState<AttendanceFilters>({
        page: 1
    })

    const { data, isLoading, error } = useAttendanceLogs(filters)
    const { mutate: verify } = useVerifyAttendance()
    const { mutate: unverify } = useUnverifyAttendance()
    const { mutate: exportData, isPending: isExporting } = useExportAttendance()

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const search = formData.get('search') as string
        setFilters({ ...filters, search: search || undefined, page: 1 })
    }

    const handleDateFilter = (type: 'start' | 'end', value: string) => {
        setFilters({
            ...filters,
            [type === 'start' ? 'start_date' : 'end_date']: value || undefined,
            page: 1
        })
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
        if (!clockOut) return '-'
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
            <div className="flex flex-col sm:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                        <Input
                            name="search"
                            type="search"
                            placeholder="Search by employee name, email, or phone..."
                            className="pl-9"
                            defaultValue={filters.search}
                        />
                    </div>
                </form>

                <div className="flex gap-2">
                    <Input
                        type="date"
                        placeholder="Start Date"
                        onChange={(e) => handleDateFilter('start', e.target.value)}
                        value={filters.start_date || ''}
                        className="w-40"
                    />
                    <Input
                        type="date"
                        placeholder="End Date"
                        onChange={(e) => handleDateFilter('end', e.target.value)}
                        value={filters.end_date || ''}
                        className="w-40"
                    />
                </div>

                <Button onClick={handleExport} disabled={isExporting} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                </Button>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
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
                                    Error loading attendance: {(error as any).response?.data?.error || 'Unknown error'}
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
                                    {log.clock_out_time ? formatDateTime(log.clock_out_time) : '-'}
                                </TableCell>
                                <TableCell>
                                    {calculateHours(log.clock_in_time, log.clock_out_time)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        {log.flagged_late && (
                                            <Badge variant="destructive">Late</Badge>
                                        )}
                                        {log.flagged_early_leave && (
                                            <Badge variant="warning">Early</Badge>
                                        )}
                                        {!log.flagged_late && !log.flagged_early_leave && (
                                            <Badge variant="success">On Time</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleVerifyToggle(log.id, log.is_verified)}
                                        className="gap-1"
                                    >
                                        {log.is_verified ? (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                        )}
                                    </Button>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
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
        </div>
    )
}
