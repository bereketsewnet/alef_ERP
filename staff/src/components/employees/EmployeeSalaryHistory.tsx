import { useQuery } from "@tanstack/react-query"
import { employeesApi } from "@/api/endpoints/employees"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { EmployeeSalaryDetail } from "./EmployeeSalaryDetail"
import { DollarSign } from "lucide-react"
import { SalaryAdjustmentModal } from "./SalaryAdjustmentModal"

interface EmployeeSalaryHistoryProps {
    employeeId: number
}

export function EmployeeSalaryHistory({ employeeId }: EmployeeSalaryHistoryProps) {
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null)
    const [expandedPeriodId, setExpandedPeriodId] = useState<number | null>(null)
    const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false)
    const [adjustmentPeriodId, setAdjustmentPeriodId] = useState<number | null>(null)
    const [adjustmentPeriodDates, setAdjustmentPeriodDates] = useState<{ start: string; end: string } | null>(null)

    const { data: history, isLoading } = useQuery({
        queryKey: ['employee-salary-history', employeeId],
        queryFn: () => employeesApi.getSalaryHistory(employeeId),
    })

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!history || history.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-neutral-500">No salary history found</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Salary History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Base Salary</TableHead>
                                    <TableHead>Bonuses</TableHead>
                                    <TableHead>Deductions</TableHead>
                                    <TableHead>Net Pay</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.filter((item: any) => item.status === 'APPROVED').map((item: any) => (
                                    <>
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(item.payroll_period.start_date), 'MMM yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                {item.payroll_period.client?.company_name || '-'}
                                            </TableCell>
                                            <TableCell>{formatCurrency(item.base_salary)}</TableCell>
                                            <TableCell className="text-green-600">
                                                +{formatCurrency(item.bonuses)}
                                            </TableCell>
                                            <TableCell className="text-red-600">
                                                -{formatCurrency(item.total_deductions)}
                                            </TableCell>
                                            <TableCell className="font-bold text-green-600">
                                                {formatCurrency(item.net_pay)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        item.status === 'APPROVED' ? 'default' :
                                                        item.status === 'DRAFT' ? 'secondary' : 'outline'
                                                    }
                                                >
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setAdjustmentPeriodId(item.payroll_period_id)
                                                            setAdjustmentPeriodDates({
                                                                start: item.payroll_period.start_date,
                                                                end: item.payroll_period.end_date,
                                                            })
                                                            setAdjustmentModalOpen(true)
                                                        }}
                                                        title="Salary Adjustment"
                                                    >
                                                        <DollarSign className="h-4 w-4 mr-1" />
                                                        Adjust
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedPeriodId(item.payroll_period_id)
                                                            setExpandedPeriodId(
                                                                expandedPeriodId === item.payroll_period_id
                                                                    ? null
                                                                    : item.payroll_period_id
                                                            )
                                                        }}
                                                    >
                                                        {expandedPeriodId === item.payroll_period_id
                                                            ? 'Hide Details'
                                                            : 'View Details'}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {expandedPeriodId === item.payroll_period_id && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="bg-neutral-50 p-4">
                                                    <EmployeeSalaryDetail
                                                        employeeId={employeeId}
                                                        periodId={item.payroll_period_id}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {selectedPeriodId && (
                <Card>
                    <CardHeader>
                        <CardTitle>Detailed Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <EmployeeSalaryDetail
                            employeeId={employeeId}
                            periodId={selectedPeriodId}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Salary Adjustment Modal */}
            {adjustmentPeriodId && adjustmentPeriodDates && (
                <SalaryAdjustmentModal
                    open={adjustmentModalOpen}
                    onOpenChange={(open) => {
                        setAdjustmentModalOpen(open)
                        if (!open) {
                            setAdjustmentPeriodId(null)
                            setAdjustmentPeriodDates(null)
                        }
                    }}
                    employeeId={employeeId}
                    payrollPeriodId={adjustmentPeriodId}
                    periodStartDate={adjustmentPeriodDates.start}
                    periodEndDate={adjustmentPeriodDates.end}
                />
            )}
        </div>
    )
}


