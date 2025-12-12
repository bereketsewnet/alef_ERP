
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Download, FileBarChart, PieChart, BarChart } from "lucide-react"
import { useReportDashboard, useExportReport } from "@/services/useReports"
import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from "recharts"
import { startOfMonth, endOfMonth, format } from "date-fns"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function ReportsPage() {
    const [dateRange, setDateRange] = useState({
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    })

    // We'll add a proper date picker later, for now simple default to current month

    const { data: stats, isLoading } = useReportDashboard({
        start_date: dateRange.start,
        end_date: dateRange.end
    })

    const { mutate: exportFile, isPending: isExporting } = useExportReport()

    const handleExport = (type: string, format: 'pdf' | 'excel') => {
        exportFile({ type, format, params: { start_date: dateRange.start, end_date: dateRange.end } })
    }

    if (isLoading) return <div className="p-8">Loading reports...</div>

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
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Attendance Status</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
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

                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Incident Severity</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
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
                            <div className="bg-neutral-50 p-8 text-center text-muted-foreground border rounded-md">
                                Detailed Roster Table Loading... (Placeholder)
                            </div>
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
                            <div className="bg-neutral-50 p-8 text-center text-muted-foreground border rounded-md">
                                Detailed Attendance Table Loading... (Placeholder)
                            </div>
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
                            <div className="bg-neutral-50 p-8 text-center text-muted-foreground border rounded-md">
                                Detailed Finance Table Loading... (Placeholder)
                            </div>
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
                            <div className="bg-neutral-50 p-8 text-center text-muted-foreground border rounded-md">
                                Detailed Incident Table Loading... (Placeholder)
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
