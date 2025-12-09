
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Days</TableHead>
                                    <TableHead>Shift Pay</TableHead>
                                    <TableHead>Bonus</TableHead>
                                    <TableHead>Gross</TableHead>
                                    <TableHead>Tax</TableHead>
                                    <TableHead>Pension</TableHead>
                                    <TableHead>Agcy Fee</TableHead>
                                    <TableHead>Other Ded.</TableHead>
                                    <TableHead>Net Pay</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {period?.payroll_items?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                                            No payroll items generated yet.
                                            {period.status === 'DRAFT' && <p>Click "Generate Payroll" to calculate.</p>}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    period?.payroll_items?.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-medium">{item.employee.first_name} {item.employee.last_name}</div>
                                                <div className="text-xs text-muted-foreground">{item.employee.job_role?.name}</div>
                                            </TableCell>
                                            <TableCell>{item.worked_days}</TableCell>
                                            <TableCell>{parseFloat(item.shift_allowance).toLocaleString()}</TableCell>
                                            <TableCell className="text-green-600">{parseFloat(item.bonuses || 0).toLocaleString()}</TableCell>
                                            <TableCell className="font-semibold">{parseFloat(item.total_gross).toLocaleString()}</TableCell>
                                            <TableCell>{parseFloat(item.income_tax).toLocaleString()}</TableCell>
                                            <TableCell>{parseFloat(item.pension_contribution).toLocaleString()}</TableCell>
                                            <TableCell className="text-orange-600">{parseFloat(item.agency_deductions || 0).toLocaleString()}</TableCell>
                                            <TableCell>{(parseFloat(item.total_deductions) - parseFloat(item.income_tax) - parseFloat(item.pension_contribution) - parseFloat(item.agency_deductions || 0)).toLocaleString()}</TableCell>
                                            <TableCell className="font-bold">{parseFloat(item.net_pay).toLocaleString()} ETB</TableCell>
                                            <TableCell>
                                                <Badge variant={item.status === 'APPROVED' ? 'default' : 'secondary'}>
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button size="icon" variant="ghost" onClick={() => handleDownloadPayslip(item.id, item.employee.first_name)}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
