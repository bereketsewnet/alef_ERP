
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePayrollPeriod, useGeneratePayroll, useApprovePayroll } from "@/services/usePayroll"
import { Loader2, Download, CheckCircle, Play } from "lucide-react"
import { downloadPayslip } from "@/api/endpoints/payroll"
import { format } from "date-fns"

interface PayrollDetailsModalProps {
    periodId: number | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PayrollDetailsModal({ periodId, open, onOpenChange }: PayrollDetailsModalProps) {
    const { data: period, isLoading } = usePayrollPeriod(periodId || 0)
    const { mutate: generate, isPending: isGenerating } = useGeneratePayroll()
    const { mutate: approve, isPending: isApproving } = useApprovePayroll()

    if (!periodId) return null

    const handleGenerate = () => {
        if (periodId) generate(periodId)
    }

    const handleApprove = () => {
        if (periodId) approve(periodId)
    }

    const handleDownloadPayslip = async (itemId: number, name: string) => {
        try {
            const blob = await downloadPayslip(itemId)
            const url = window.URL.createObjectURL(new Blob([blob]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `payslip-${name}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.parentNode?.removeChild(link)
        } catch (error) {
            console.error('Failed to download payslip', error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-full h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogDescription className="sr-only">Payroll period details and payslips</DialogDescription>
                    <div className="flex items-center justify-between">
                        <DialogTitle>
                            Payroll Details
                            {period && `(${format(new Date(period.start_date), 'MMM d')} - ${format(new Date(period.end_date), 'MMM d, yyyy')})`}
                        </DialogTitle>
                        <div className="flex gap-2">
                            {period?.status === 'DRAFT' && (
                                <Button onClick={handleGenerate} disabled={isGenerating}>
                                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                    Generate Payroll
                                </Button>
                            )}
                            {period?.status === 'PROCESSING' && (
                                <Button onClick={handleApprove} disabled={isApproving} variant="default" className="bg-green-600 hover:bg-green-700">
                                    {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                    Approve & Finalize
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="overflow-x-auto border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="sticky left-0 bg-white z-10 min-w-[150px]">Employee</TableHead>
                                        <TableHead className="whitespace-nowrap">Days</TableHead>
                                        <TableHead className="whitespace-nowrap">Expected</TableHead>
                                        <TableHead className="whitespace-nowrap">Shift Pay</TableHead>
                                        <TableHead className="whitespace-nowrap">Bonus</TableHead>
                                        <TableHead className="whitespace-nowrap text-red-600">Manual Penalty</TableHead>
                                        <TableHead className="whitespace-nowrap text-orange-600">Late (N)</TableHead>
                                        <TableHead className="whitespace-nowrap text-yellow-600">Late (P)</TableHead>
                                        <TableHead className="whitespace-nowrap text-red-600">Absent (N)</TableHead>
                                        <TableHead className="whitespace-nowrap text-yellow-600">Absent (P)</TableHead>
                                        <TableHead className="whitespace-nowrap font-semibold">Gross</TableHead>
                                        <TableHead className="whitespace-nowrap">Tax</TableHead>
                                        <TableHead className="whitespace-nowrap">Pension</TableHead>
                                        <TableHead className="whitespace-nowrap">Agcy Fee</TableHead>
                                        <TableHead className="whitespace-nowrap text-red-600">Penalties</TableHead>
                                        <TableHead className="whitespace-nowrap">Other Ded.</TableHead>
                                        <TableHead className="whitespace-nowrap font-bold">Net Pay</TableHead>
                                        <TableHead className="whitespace-nowrap">Status</TableHead>
                                        <TableHead className="sticky right-0 bg-white z-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {period?.payroll_items?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={19} className="text-center py-8 text-muted-foreground">
                                                No payroll items generated yet.
                                                {period.status === 'DRAFT' && <p>Click "Generate Payroll" to calculate.</p>}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        period?.payroll_items?.map((item: any) => {
                                            const penalties = parseFloat(item.penalties || 0)
                                            const manualPenalties = parseFloat(item.manual_penalties || 0)
                                            const assetDeductions = parseFloat(item.asset_deductions || 0)
                                            const otherDeductions = assetDeductions
                                            
                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="sticky left-0 bg-white z-10 min-w-[150px]">
                                                        <div className="font-medium">{item.employee?.first_name} {item.employee?.last_name}</div>
                                                        <div className="text-xs text-muted-foreground">{item.employee?.job_role?.name || '-'}</div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">{item.worked_days || 0}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{item.expected_days || 0}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{parseFloat(item.shift_allowance || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-green-600">{parseFloat(item.bonuses || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-red-600">{manualPenalties > 0 ? manualPenalties.toLocaleString() : '-'}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-orange-600">{item.normal_late_count ?? 0}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-yellow-600">{item.permission_late_count ?? 0}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-red-600">{item.normal_absent_count ?? 0}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-yellow-600">{item.permission_absent_count ?? 0}</TableCell>
                                                    <TableCell className="whitespace-nowrap font-semibold">{parseFloat(item.total_gross || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{parseFloat(item.income_tax || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{parseFloat(item.pension_contribution || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-orange-600">{parseFloat(item.agency_deductions || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-red-600">{penalties.toLocaleString()}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{otherDeductions.toLocaleString()}</TableCell>
                                                    <TableCell className="whitespace-nowrap font-bold">{parseFloat(item.net_pay || 0).toLocaleString()} ETB</TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        <Badge variant={item.status === 'APPROVED' ? 'default' : 'secondary'}>
                                                            {item.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="sticky right-0 bg-white z-10">
                                                        <Button size="icon" variant="ghost" onClick={() => handleDownloadPayslip(item.id, item.employee?.first_name || 'employee')}>
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
