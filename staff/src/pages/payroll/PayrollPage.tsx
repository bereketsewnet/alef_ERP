
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, Settings, Plus, Loader2 } from "lucide-react"
import { usePayrollPeriods, usePayrollStats } from "@/services/usePayroll"
import { CreatePeriodModal } from "@/components/payroll/CreatePeriodModal"
import { PayrollDetailsModal } from "@/components/payroll/PayrollDetailsModal"
import { format } from "date-fns"
import { Link } from "react-router-dom"
import { formatCurrency } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BonusesPanel } from "./BonusesPanel"
import { PenaltiesPanel } from "./PenaltiesPanel"

export function PayrollPage() {
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null)

    const { data: periods, isLoading: periodsLoading } = usePayrollPeriods()
    const { data: stats } = usePayrollStats()

    const handleViewPeriod = (id: number) => {
        setSelectedPeriodId(id)
        setDetailsModalOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Payroll</h1>
                    <p className="text-neutral-600 mt-1">Process payroll, manage bonuses, and generate payslips</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/payroll/settings">
                        <Button variant="outline">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Button>
                    </Link>
                    <Button onClick={() => setCreateModalOpen(true)} className="bg-primary-600 hover:bg-primary-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Run Payroll
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
                    <TabsTrigger value="penalties">Penalties</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-600">Total Gross (YTD)</p>
                                        <p className="text-2xl font-bold text-neutral-900">
                                            {stats ? formatCurrency(stats.total_ytd_gross) : '---'}
                                        </p>
                                    </div>
                                    <DollarSign className="h-8 w-8 text-green-600" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm font-medium text-neutral-600">Active Employees</p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {stats?.total_employees || '---'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm font-medium text-neutral-600">Last processed</p>
                                <p className="text-lg font-bold text-neutral-900">
                                    {stats?.last_period ? format(new Date(stats.last_period.start_date), 'MMMM yyyy') : 'Never'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payroll History Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payroll History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {periodsLoading ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Start Date</TableHead>
                                            <TableHead>End Date</TableHead>
                                            <TableHead>Processed Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {periods?.data?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8">
                                                    No payroll periods found. Click "Run Payroll" to start.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            periods?.data?.map((period: any) => (
                                                <TableRow key={period.id}>
                                                    <TableCell className="font-medium">
                                                        {format(new Date(period.start_date), 'MMMM yyyy')}
                                                    </TableCell>
                                                    <TableCell>{format(new Date(period.start_date), 'MMM d, yyyy')}</TableCell>
                                                    <TableCell>{format(new Date(period.end_date), 'MMM d, yyyy')}</TableCell>
                                                    <TableCell>
                                                        {period.processed_date ? format(new Date(period.processed_date), 'MMM d, yyyy') : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                period.status === 'COMPLETED' ? 'default' :
                                                                    period.status === 'PROCESSING' ? 'secondary' : 'outline'
                                                            }
                                                            className={period.status === 'COMPLETED' ? 'bg-green-600' : ''}
                                                        >
                                                            {period.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => handleViewPeriod(period.id)}>
                                                            View Details
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bonuses">
                    <BonusesPanel />
                </TabsContent>

                <TabsContent value="penalties">
                    <PenaltiesPanel />
                </TabsContent>
            </Tabs>

            <CreatePeriodModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
            <PayrollDetailsModal periodId={selectedPeriodId} open={detailsModalOpen} onOpenChange={setDetailsModalOpen} />
        </div>
    )
}
