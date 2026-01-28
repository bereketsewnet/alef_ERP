import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { salaryApi, type SalaryHistoryItem } from '@/api/endpoints/salary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { payrollApi } from '@/api/endpoints/payroll'
import { format } from 'date-fns'

export function SalaryHistoryPage() {
    const { t } = useTranslation()
    const { user } = useAuth()

    const employeeId = user?.employee_id

    const { data, isLoading, isError } = useQuery<SalaryHistoryItem[]>({
        queryKey: ['salary-history', employeeId],
        enabled: !!employeeId,
        queryFn: () => salaryApi.getMySalaryHistory(employeeId!),
    })

    const downloadPayslip = async (itemId: number) => {
        try {
            const blob = await payrollApi.downloadPayslip(itemId)
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `payslip-${itemId}.pdf`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Failed to download payslip', error)
            alert(t('common.error') || 'Failed to download payslip')
        }
    }

    if (!employeeId) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-gray-500 text-sm">{t('payroll.noPayslips')}</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-error text-sm">{t('common.error')}</p>
            </div>
        )
    }

    const items = data || []

    return (
        <div className="space-y-4 pb-20">
            <h1 className="text-2xl font-bold">{t('payroll.title')}</h1>

            {items.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-gray-500 text-sm">
                        {t('payroll.noPayslips')}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => {
                        const period = (item as any).payroll_period || (item as any).payrollPeriod
                        const client = period?.client

                        // Backend fields are total_gross / net_pay; our TS type uses gross_salary / net_salary.
                        const gross =
                            (item as any).gross_salary ??
                            (item as any).total_gross ??
                            0
                        const totalDeductions =
                            (item as any).total_deductions ??
                            0
                        const net =
                            (item as any).net_salary ??
                            (item as any).net_pay ??
                            0

                        return (
                            <Card key={item.id}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center justify-between text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {period
                                                    ? period.period_name ||
                                                      `${format(new Date(period.start_date), 'MMM d')} - ${format(
                                                          new Date(period.end_date),
                                                          'MMM d, yyyy'
                                                      )}`
                                                    : t('payroll.period')}
                                            </span>
                                            {client && (
                                                <span className="text-xs text-gray-500">
                                                    {client.company_name}
                                                </span>
                                            )}
                                        </div>
                                        <Badge variant="success" className="text-xs">
                                            APPROVED
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{t('payroll.gross')}</span>
                                        <span className="font-medium">
                                            ETB {Number(gross).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{t('payroll.deductions')}</span>
                                        <span className="font-medium">
                                            -ETB {Number(totalDeductions).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{t('payroll.net')}</span>
                                        <span className="font-semibold text-green-600">
                                            ETB {Number(net).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="pt-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => downloadPayslip(item.id)}
                                        >
                                            {t('payroll.downloadPayslip')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

