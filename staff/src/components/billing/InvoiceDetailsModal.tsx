import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useInvoice } from "@/services/useInvoices"
import { Loader2, Calendar, User, FileText } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface InvoiceDetailsModalProps {
    invoiceId: number | null
    onClose: () => void
}

export function InvoiceDetailsModal({ invoiceId, onClose }: InvoiceDetailsModalProps) {
    const { data: invoice, isLoading } = useInvoice(invoiceId || 0)

    if (!invoiceId) return null

    return (
        <Dialog open={!!invoiceId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Invoice Details</DialogTitle>
                    <DialogDescription>
                        View complete invoice information
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : invoice ? (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="grid grid-cols-3 gap-4 border p-4 rounded-lg bg-neutral-50/50">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 mb-1">Invoice #</p>
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary-600" />
                                    <span className="font-bold">{invoice.invoice_number}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-500 mb-1">Client</p>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary-600" />
                                    <span className="font-medium">
                                        {invoice.client?.company_name || 'Unknown Client'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-500 mb-1">Status</p>
                                <Badge
                                    variant={
                                        invoice.status === "PAID" ? "default" :
                                            invoice.status === "SENT" ? "secondary" : "destructive"
                                    }
                                    className={invoice.status === 'PAID' ? 'bg-green-600' : ''}
                                >
                                    {invoice.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-500 mb-1">Invoice Date</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-neutral-400" />
                                    <span>{new Date(invoice.invoice_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-500 mb-1">Due Date</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-neutral-400" />
                                    <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div>
                            <h3 className="font-medium mb-2">Invoice Items</h3>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Unit Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoice.items?.map((item: any) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{Number(item.unit_price).toLocaleString()} ETB</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {(item.quantity * item.unit_price).toLocaleString()} ETB
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-neutral-50 font-bold">
                                            <TableCell colSpan={3} className="text-right">Total Amount</TableCell>
                                            <TableCell className="text-right text-lg">
                                                {Number(invoice.total_amount).toLocaleString()} ETB
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-4 text-red-500">Failed to load invoice details</div>
                )}
            </DialogContent>
        </Dialog>
    )
}
