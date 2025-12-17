import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Download, FileBarChart, PieChart, BarChart } from "lucide-react"
import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from "recharts"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { DataTable } from "@/components/ui/data-table"
import { useReportDashboard, useExportReport, useAttendanceReport, useFinanceReport, useIncidentsReport, useRosterReport } from "@/services/useReports"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Helper column definitions
const rosterColumns: ColumnDef<any>[] = [
    { accessorKey: "shift_start", header: "Start Time", cell: ({ row }) => format(new Date(row.original.shift_start), 'MMM dd, HH:mm') },
    { accessorKey: "shift_end", header: "End Time", cell: ({ row }) => format(new Date(row.original.shift_end), 'MMM dd, HH:mm') },
    { accessorKey: "site.site_name", header: "Site" },
    { accessorKey: "employee.first_name", header: "Employee", cell: ({ row }) => `${row.original.employee?.first_name || ''} ${row.original.employee?.last_name || ''}` },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge> }
]

const attendanceColumns: ColumnDef<any>[] = [
    { accessorKey: "created_at", header: "Time", cell: ({ row }) => format(new Date(row.original.created_at), 'MMM dd, HH:mm') },
    { accessorKey: "schedule.employee.first_name", header: "Employee", cell: ({ row }) => `${row.original.schedule?.employee?.first_name || ''} ${row.original.schedule?.employee?.last_name || ''}` },
    { accessorKey: "schedule.site.site_name", header: "Site" },
    { accessorKey: "verification_method", header: "Method" },
    {
        accessorKey: "flagged_late", header: "Status", cell: ({ row }) => (
            <Badge variant={row.original.flagged_late ? "destructive" : "default"}>
                {row.original.flagged_late ? "Late" : "On Time"}
            </Badge>
        )
    }
]

const financeColumns: ColumnDef<any>[] = [
    { accessorKey: "invoice_number", header: "Invoice #" },
    { accessorKey: "client.company_name", header: "Client" },
    { accessorKey: "invoice_date", header: "Date" },
    { accessorKey: "total_amount", header: "Amount", cell: ({ row }) => `$${Number(row.original.total_amount).toLocaleString()}` },
    {
        accessorKey: "status", header: "Status", cell: ({ row }) => (
            <Badge variant={row.original.status === 'PAID' ? "default" : row.original.status === 'OVERDUE' ? "destructive" : "secondary"}>
                {row.original.status}
            </Badge>
        )
    }
]

const incidentColumns: ColumnDef<any>[] = [
    { accessorKey: "created_at", header: "Reported At", cell: ({ row }) => format(new Date(row.original.created_at), 'MMM dd, HH:mm') },
    { accessorKey: "site.site_name", header: "Site" },
    { accessorKey: "report_type", header: "Type" },
    {
        accessorKey: "severity_level", header: "Severity", cell: ({ row }) => (
            <Badge variant={row.original.severity_level === 'CRITICAL' ? "destructive" : row.original.severity_level === 'HIGH' ? "destructive" : "default"}>
                {row.original.severity_level}
            </Badge>
        )
    },
    { accessorKey: "reported_by.first_name", header: "Reported By", cell: ({ row }) => `${row.original.reported_by?.first_name || ''} ${row.original.reported_by?.last_name || 'N/A'}` }
]

export function ReportsPage() {
    const [dateRange, setDateRange] = useState({
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    })

    const params = { start_date: dateRange.start, end_date: dateRange.end }

    // Data Hooks
    const { data: stats, isLoading: isLoadingStats } = useReportDashboard(params)
    const { data: rosterData, isLoading: isLoadingRoster } = useRosterReport(params)
    const { data: attendanceData, isLoading: isLoadingAttendance } = useAttendanceReport(params)
    const { data: financeData, isLoading: isLoadingFinance } = useFinanceReport(params)
    const { data: incidentData, isLoading: isLoadingIncidents } = useIncidentsReport(params)

    const { mutate: exportFile, isPending: isExporting } = useExportReport()

    const handleExport = (type: string, format: 'pdf' | 'excel') => {
        exportFile({ type, format, params })
    }

    if (isLoadingStats) return <div className="p-8">Loading reports...</div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Advanced Reports</h1>
                    <p className="text-neutral-600">Analytics and exports for the current month</p>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm bg-white">
                        <CalendarIcon className="h-4 w-4 text-neutral-500" />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-transparent border-none focus:outline-none h-auto p-0 text-sm"
                        />
                        <span className="text-neutral-400">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-transparent border-none focus:outline-none h-auto p-0 text-sm"
                        />
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="roster">Roster</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="finance">Finance</TabsTrigger>
                    <TabsTrigger value="incidents">Incidents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                    {/* Key Metrics Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
                                <span className="text-2xl font-bold">${stats?.finance?.total_billed?.toLocaleString() ?? 0}</span>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Collected</CardTitle>
                                <span className="text-2xl font-bold text-green-600">${stats?.finance?.total_paid?.toLocaleString() ?? 0}</span>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                                <span className="text-2xl font-bold text-red-600">${stats?.finance?.total_overdue?.toLocaleString() ?? 0}</span>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Incidents</CardTitle>
                                <span className="text-2xl font-bold">{stats?.incidents?.reduce((a: any, b: any) => a + b.count, 0) ?? 0}</span>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="col-span-1 min-w-0">
                            <CardHeader>
                                <CardTitle>Attendance Status</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <RechartsPie>
                                        <Pie
                                            data={stats?.attendance}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="count"
                                            nameKey="status"
                                        >
                                            {stats?.attendance?.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="col-span-1 min-w-0">
                            <CardHeader>
                                <CardTitle>Incident Severity</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <RechartsBar
                                        data={stats?.incidents}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="severity_level" type="category" width={80} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="count" fill="#ef4444" name="Incidents" />
                                    </RechartsBar>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="roster">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Roster Report</CardTitle>
                                <CardDescription>Detailed shift schedule data</CardDescription>
                            </div>
                            <Button variant="outline" onClick={() => handleExport('roster', 'pdf')} disabled={isExporting}>
                                <Download className="mr-2 h-4 w-4" /> Export PDF
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isLoadingRoster ? <div>Loading...</div> :
                                <DataTable columns={rosterColumns} data={rosterData?.data || []} />
                            }
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="attendance">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Attendance Report</CardTitle>
                                <CardDescription>Clock-in/out records</CardDescription>
                            </div>
                            <Button variant="outline" onClick={() => handleExport('attendance', 'pdf')} disabled={isExporting}>
                                <Download className="mr-2 h-4 w-4" /> Export PDF
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isLoadingAttendance ? <div>Loading...</div> :
                                <DataTable columns={attendanceColumns} data={attendanceData?.data || []} />
                            }
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="finance">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Finance Report</CardTitle>
                                <CardDescription>Invoicing and payments</CardDescription>
                            </div>
                            <Button variant="outline" onClick={() => handleExport('finance', 'pdf')} disabled={isExporting}>
                                <Download className="mr-2 h-4 w-4" /> Export PDF
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isLoadingFinance ? <div>Loading...</div> :
                                <DataTable columns={financeColumns} data={financeData?.data || []} />
                            }
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="incidents">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Incident Report</CardTitle>
                                <CardDescription>Operational incidents and alerts</CardDescription>
                            </div>
                            <Button variant="outline" onClick={() => handleExport('incidents', 'pdf')} disabled={isExporting}>
                                <Download className="mr-2 h-4 w-4" /> Export PDF
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isLoadingIncidents ? <div>Loading...</div> :
                                <DataTable columns={incidentColumns} data={incidentData?.data || []} />
                            }
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
