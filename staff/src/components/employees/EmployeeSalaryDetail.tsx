import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { employeesApi } from "@/api/endpoints/employees"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { SalaryAdjustmentModal } from "./SalaryAdjustmentModal"

interface EmployeeSalaryDetailProps {
    employeeId: number
    periodId: number | null
}

export function EmployeeSalaryDetail({ employeeId, periodId }: EmployeeSalaryDetailProps) {
    const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false)
    
    const { data, isLoading, error } = useQuery({
        queryKey: ['employee-salary', employeeId, periodId],
        queryFn: () => employeesApi.getSalary(employeeId, periodId!),
        enabled: !!periodId,
    })

    if (!periodId) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-neutral-500">Select a payroll period to view details</p>
                </CardContent>
            </Card>
        )
    }

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

    if (error || !data) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-red-500">Error loading salary details</p>
                </CardContent>
            </Card>
        )
    }

    const { payroll_item, attendance_logs, bonuses, penalties } = data

    return (
        <div className="space-y-4">
            {/* Summary Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Salary Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-neutral-500">Period</p>
                            <p className="font-medium">
                                {format(new Date(payroll_item.payroll_period.start_date), 'MMM d')} -{' '}
                                {format(new Date(payroll_item.payroll_period.end_date), 'MMM d, yyyy')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Client</p>
                            <p className="font-medium">
                                {payroll_item.payroll_period.client?.company_name || '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Expected Days</p>
                            <p className="font-medium">{payroll_item.expected_days || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Worked Days</p>
                            <p className="font-medium">{payroll_item.worked_days || 0}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Earnings */}
            <Card>
                <CardHeader>
                    <CardTitle>Earnings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-neutral-600">Base Salary</span>
                        <span className="font-medium">{formatCurrency(payroll_item.base_salary)}</span>
                    </div>
                    {payroll_item.bonuses > 0 && (
                        <div className="flex justify-between">
                            <span className="text-neutral-600">Bonuses</span>
                            <span className="font-medium text-green-600">
                                +{formatCurrency(payroll_item.bonuses)}
                            </span>
                        </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                            <span>Total Gross</span>
                            <span>{formatCurrency(payroll_item.total_gross)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Deductions */}
            <Card>
                <CardHeader>
                    <CardTitle>Deductions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {payroll_item.income_tax > 0 && (
                        <div className="flex justify-between">
                            <span className="text-neutral-600">Income Tax</span>
                            <span className="font-medium text-red-600">
                                -{formatCurrency(payroll_item.income_tax)}
                            </span>
                        </div>
                    )}
                    {payroll_item.pension_contribution > 0 && (
                        <div className="flex justify-between">
                            <span className="text-neutral-600">Pension Contribution</span>
                            <span className="font-medium text-red-600">
                                -{formatCurrency(payroll_item.pension_contribution)}
                            </span>
                        </div>
                    )}
                    {payroll_item.penalties > 0 && (
                        <div className="flex justify-between">
                            <span className="text-neutral-600">Penalties</span>
                            <span className="font-medium text-red-600">
                                -{formatCurrency(payroll_item.penalties)}
                            </span>
                        </div>
                    )}
                    {payroll_item.asset_deductions > 0 && (
                        <div className="flex justify-between">
                            <span className="text-neutral-600">Asset Deductions</span>
                            <span className="font-medium text-red-600">
                                -{formatCurrency(payroll_item.asset_deductions)}
                            </span>
                        </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                            <span>Total Deductions</span>
                            <span className="text-red-600">
                                -{formatCurrency(payroll_item.total_deductions)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Net Pay */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Net Pay</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAdjustmentModalOpen(true)}
                        >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Salary Adjustment
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                        {formatCurrency(payroll_item.net_pay)}
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Details */}
            {(payroll_item.normal_late_count > 0 || payroll_item.permission_late_count > 0 || 
             payroll_item.normal_absent_count > 0 || payroll_item.permission_absent_count > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Attendance Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {payroll_item.normal_late_count > 0 && (
                            <div className="flex justify-between">
                                <span className="text-neutral-600">Late (Normal)</span>
                                <Badge variant="destructive">{payroll_item.normal_late_count} occurrences</Badge>
                            </div>
                        )}
                        {payroll_item.permission_late_count > 0 && (
                            <div className="flex justify-between">
                                <span className="text-neutral-600">Late (With Permission)</span>
                                <Badge variant="secondary">{payroll_item.permission_late_count} occurrences</Badge>
                            </div>
                        )}
                        {payroll_item.normal_absent_count > 0 && (
                            <div className="flex justify-between">
                                <span className="text-neutral-600">Absent (Normal)</span>
                                <Badge variant="destructive">{payroll_item.normal_absent_count} occurrences</Badge>
                            </div>
                        )}
                        {payroll_item.permission_absent_count > 0 && (
                            <div className="flex justify-between">
                                <span className="text-neutral-600">Absent (With Permission)</span>
                                <Badge variant="secondary">{payroll_item.permission_absent_count} occurrences</Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Bonuses List */}
            {bonuses && bonuses.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Bonuses & Adjustments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {bonuses.map((bonus: any) => (
                                <div key={bonus.id} className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">
                                            {bonus.reason}
                                            {bonus.type === 'ADJUSTMENT' && (
                                                <Badge variant="secondary" className="ml-2">Adjustment</Badge>
                                            )}
                                        </p>
                                        <p className="text-sm text-neutral-500">
                                            {format(new Date(bonus.bonus_date), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                    <span className="font-medium text-green-600">
                                        +{formatCurrency(bonus.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Penalties List */}
            {penalties && penalties.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Manual Penalties & Adjustments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {penalties.map((penalty: any) => (
                                <div key={penalty.id} className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">
                                            {penalty.reason || penalty.penalty_type}
                                            {penalty.penalty_type === 'ADJUSTMENT' && (
                                                <Badge variant="secondary" className="ml-2">Adjustment</Badge>
                                            )}
                                        </p>
                                        <p className="text-sm text-neutral-500">
                                            {format(new Date(penalty.penalty_date), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                    <span className="font-medium text-red-600">
                                        -{formatCurrency(penalty.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Salary Adjustment Modal */}
            <SalaryAdjustmentModal
                open={adjustmentModalOpen}
                onOpenChange={setAdjustmentModalOpen}
                employeeId={employeeId}
                payrollPeriodId={payroll_item.payroll_period_id}
                periodStartDate={payroll_item.payroll_period.start_date}
                periodEndDate={payroll_item.payroll_period.end_date}
            />
        </div>
    )
}

