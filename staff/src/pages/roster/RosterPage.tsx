import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar, Users, Clock, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { useRoster, useBulkAssignShifts } from "@/services/useRoster"
import { useEmployees } from "@/services/useEmployees"
import { useClients } from "@/services/useClients"
import { useJobs } from "@/services/useJobs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { ShiftSchedule } from "@/api/endpoints/roster"

const bulkAssignSchema = z.object({
    site_id: z.string().min(1, 'Site is required'),
    job_id: z.string().min(1, 'Job is required'),
    employee_ids: z.array(z.string()).min(1, 'Select at least one employee'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    start_time: z.string().min(1, 'Start time is required'),
    end_time: z.string().min(1, 'End time is required'),
})

interface GroupedShift {
    employee_id: number
    employee_name: string
    employee_code: string
    site_name: string
    shift_count: number
    total_hours: number
    shifts: ShiftSchedule[]
}

export function RosterPage() {
    const [page, setPage] = useState(1)
    const [siteFilter, setSiteFilter] = useState<number | undefined>()
    const [dateFilter, setDateFilter] = useState<string | undefined>()
    const [bulkAssignOpen, setBulkAssignOpen] = useState(false)
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<GroupedShift | null>(null)

    const { data: rosterData, isLoading } = useRoster({ page, site_id: siteFilter, date: dateFilter })
    const { data: employeesData } = useEmployees({ per_page: 1000 })
    const { data: clientsData } = useClients(1)
    const { mutate: bulkAssign, isPending: isAssigning } = useBulkAssignShifts()
    const { data: jobs } = useJobs({ active_only: true })

    const form = useForm({
        resolver: zodResolver(bulkAssignSchema),
        defaultValues: {
            site_id: '',
            job_id: '',
            employee_ids: [],
            start_date: '',
            end_date: '',
            start_time: '08:00',
            end_time: '17:00',
        },
    })

    const handleBulkAssign = (values: z.infer<typeof bulkAssignSchema>) => {
        bulkAssign({
            site_id: parseInt(values.site_id),
            job_id: parseInt(values.job_id),
            employee_ids: values.employee_ids.map(id => parseInt(id)),
            start_date: values.start_date,
            end_date: values.end_date,
            start_time: values.start_time,
            end_time: values.end_time,
        }, {
            onSuccess: () => {
                setBulkAssignOpen(false)
                form.reset()
            },
        })
    }

    const handleViewDetails = (group: GroupedShift) => {
        setSelectedEmployee(group)
        setDetailsModalOpen(true)
    }

    const handleQuickDateFilter = (filter: 'today' | 'all') => {
        if (filter === 'today') {
            setDateFilter(new Date().toISOString().split('T')[0])
        } else {
            setDateFilter(undefined)
        }
        setPage(1)
    }

    // Group shifts by employee
    const groupedShifts: GroupedShift[] = rosterData?.data.reduce((acc: GroupedShift[], shift) => {
        const existing = acc.find(g => g.employee_id === shift.employee_id)

        const shiftStart = new Date(shift.shift_start)
        const shiftEnd = new Date(shift.shift_end)
        const hours = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60)

        if (existing) {
            existing.shifts.push(shift)
            existing.shift_count++
            existing.total_hours += hours
        } else {
            acc.push({
                employee_id: shift.employee_id,
                employee_name: shift.employee ? `${shift.employee.first_name} ${shift.employee.last_name}` : 'Unassigned',
                employee_code: shift.employee?.employee_code || 'N/A',
                site_name: shift.site?.site_name || 'N/A',
                shift_count: 1,
                total_hours: hours,
                shifts: [shift]
            })
        }

        return acc
    }, []) || []

    // Calculate stats
    const totalShifts = rosterData?.total || 0
    const todayShifts = rosterData?.data.filter(shift => {
        const shiftDate = new Date(shift.shift_start).toISOString().split('T')[0]
        const today = new Date().toISOString().split('T')[0]
        return shiftDate === today
    }).length || 0

    // Get all sites from clients
    const allSites = clientsData?.data.flatMap(client =>
        (client.sites || []).map(site => ({
            ...site,
            client_name: client.company_name
        }))
    ) || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">
                        Roster Management
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        Schedule and assign shifts to employees
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setBulkAssignOpen(true)}>
                        <Users className="mr-2 h-4 w-4" />
                        Bulk Assign
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600">
                                    Total Shifts
                                </p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {totalShifts}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-primary-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600">
                                    Today's Shifts
                                </p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {todayShifts}
                                </p>
                            </div>
                            <Calendar className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600">
                                    Active Employees
                                </p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {groupedShifts.length}
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center flex-wrap">
                <select
                    value={siteFilter || ''}
                    onChange={(e) => {
                        setSiteFilter(e.target.value ? parseInt(e.target.value) : undefined)
                        setPage(1)
                    }}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                    <option value="">All Sites</option>
                    {allSites.map(site => (
                        <option key={site.id} value={site.id}>
                            {site.client_name} - {site.site_name}
                        </option>
                    ))}
                </select>

                <div className="flex gap-2 items-center">
                    <span className="text-sm text-neutral-600">Date:</span>
                    <Button
                        variant={!dateFilter ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleQuickDateFilter('all')}
                    >
                        All
                    </Button>
                    <Button
                        variant={dateFilter === new Date().toISOString().split('T')[0] ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleQuickDateFilter('today')}
                    >
                        Today
                    </Button>
                    <Input
                        type="date"
                        value={dateFilter || ''}
                        onChange={(e) => {
                            setDateFilter(e.target.value || undefined)
                            setPage(1)
                        }}
                        className="w-40"
                    />
                </div>
            </div>

            {/* Grouped Shifts Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Primary Site</TableHead>
                            <TableHead>Shifts</TableHead>
                            <TableHead>Total Hours</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                                    Loading shifts...
                                </TableCell>
                            </TableRow>
                        )}

                        {groupedShifts.length === 0 && !isLoading && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                                    No shifts found
                                </TableCell>
                            </TableRow>
                        )}

                        {groupedShifts.map((group) => (
                            <TableRow key={group.employee_id}>
                                <TableCell className="font-medium">
                                    {group.employee_name}
                                    <div className="text-xs text-neutral-500">
                                        {group.employee_code}
                                    </div>
                                </TableCell>
                                <TableCell>{group.site_name}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {group.shift_count} shifts
                                    </span>
                                </TableCell>
                                <TableCell>{group.total_hours.toFixed(1)}h</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewDetails(group)}
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View Details
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {rosterData && rosterData.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-neutral-500">
                        Showing {rosterData.from} to {rosterData.to} of {rosterData.total} results
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={!rosterData.prev_page_url}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <div className="flex items-center gap-2 px-3">
                            <span className="text-sm">
                                Page {rosterData.current_page} of {rosterData.last_page}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={!rosterData.next_page_url}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Employee Shifts Details Modal */}
            <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedEmployee?.employee_name} - Shift Details
                        </DialogTitle>
                        <DialogDescription>
                            All scheduled shifts for {selectedEmployee?.employee_code}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Site</TableHead>
                                    <TableHead>Start Time</TableHead>
                                    <TableHead>End Time</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Attended</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedEmployee?.shifts.map((shift) => {
                                    const shiftStart = new Date(shift.shift_start)
                                    const shiftEnd = new Date(shift.shift_end)
                                    const duration = ((shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60)).toFixed(1)
                                    const now = new Date()
                                    const isFuture = shiftStart > now

                                    // Check attendance
                                    const attendance = shift.attendance_logs?.[0]
                                    let attendanceStatus = 'not-attended'

                                    if (isFuture) {
                                        attendanceStatus = 'future'
                                    } else if (attendance) {
                                        const clockIn = new Date(attendance.clock_in)
                                        const timeDiff = (clockIn.getTime() - shiftStart.getTime()) / (1000 * 60)
                                        attendanceStatus = timeDiff <= 15 ? 'on-time' : 'late'
                                    }

                                    return (
                                        <TableRow key={shift.id}>
                                            <TableCell>{shiftStart.toLocaleDateString()}</TableCell>
                                            <TableCell>{shift.site?.site_name || 'N/A'}</TableCell>
                                            <TableCell>{shiftStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</TableCell>
                                            <TableCell>{shiftEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</TableCell>
                                            <TableCell>{duration}h</TableCell>
                                            <TableCell>
                                                {attendanceStatus === 'on-time' && (
                                                    <span className="inline-flex items-center text-green-600" title="Attended on time">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                )}
                                                {attendanceStatus === 'late' && (
                                                    <span className="inline-flex items-center text-yellow-600" title="Attended but late">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                )}
                                                {attendanceStatus === 'not-attended' && (
                                                    <span className="inline-flex items-center text-red-600" title="Did not attend">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                )}
                                                {attendanceStatus === 'future' && (
                                                    <span className="inline-flex items-center text-gray-400" title="Future shift">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Assign Modal */}
            <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Bulk Assign Shifts</DialogTitle>
                        <DialogDescription>
                            Assign shifts to multiple employees for a date range
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleBulkAssign)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="site_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Site</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a site" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {allSites.map(site => (
                                                    <SelectItem key={site.id} value={site.id.toString()}>
                                                        {site.client_name} - {site.site_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="job_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Job Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select job type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {jobs?.map(job => (
                                                    <SelectItem key={job.id} value={job.id.toString()}>
                                                        {job.job_code} - {job.job_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-neutral-500">Pay rates will be determined by job settings</p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="employee_ids"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employees</FormLabel>
                                        <FormControl>
                                            <select
                                                multiple
                                                value={field.value}
                                                onChange={(e) => {
                                                    const selected = Array.from(e.target.selectedOptions).map(option => option.value)
                                                    field.onChange(selected)
                                                }}
                                                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            >
                                                {employeesData?.data.map(emp => (
                                                    <option key={emp.id} value={emp.id.toString()}>
                                                        {emp.first_name} {emp.last_name} ({emp.employee_id || emp.id})
                                                    </option>
                                                ))}
                                            </select>
                                        </FormControl>
                                        <p className="text-xs text-neutral-500">Hold Ctrl/Cmd to select multiple employees</p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="start_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="end_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="start_time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Time</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="end_time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Time</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Job Selection - Added right after time fields */}

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setBulkAssignOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isAssigning}>
                                    {isAssigning ? 'Assigning...' : 'Assign Shifts'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
