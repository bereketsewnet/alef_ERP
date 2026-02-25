import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useInvoice } from "@/services/useInvoices"
import { formatDateByCalendar } from "@/utils/ethiopianDate"
import { Loader2, Calendar, User, FileText, CheckCircle, XCircle, Mail, Receipt, Image as ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface InvoiceDetailsModalProps {
    invoiceId: number | null
    onClose: () => void
}

export function InvoiceDetailsModal({ invoiceId, onClose }: InvoiceDetailsModalProps) {
    const { data: invoice, isLoading } = useInvoice(invoiceId || 0)

    if (!invoiceId) return null

    return (
        <Dialog open={!!invoiceId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0 bg-white sticky top-0 z-10">
                    <DialogTitle>Invoice Details</DialogTitle>
                    <DialogDescription>
                        View complete invoice information
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">

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
                                            invoice.status === "SENT" ? "secondary" :
                                                invoice.status === "DRAFT" ? "outline" : "destructive"
                                    }
                                    className={invoice.status === 'PAID' ? 'bg-green-600' : invoice.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' : ''}
                                >
                                    {invoice.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-500 mb-1">Invoice Date</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-neutral-400" />
                                    <span>{formatDateByCalendar(invoice.invoice_date, invoice.client?.preferred_calendar)}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-500 mb-1">Due Date</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-neutral-400" />
                                    <span>{formatDateByCalendar(invoice.due_date, invoice.client?.preferred_calendar)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        {invoice.status === 'PAID' && (
                            <div className="border p-4 rounded-lg bg-green-50/50">
                                <h3 className="font-medium mb-3 flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    Payment Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {invoice.payment_date && (
                                        <div>
                                            <p className="text-sm font-medium text-neutral-500 mb-1">Payment Date</p>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-neutral-400" />
                                                <span>{formatDateByCalendar(invoice.payment_date, invoice.client?.preferred_calendar)}</span>
                                            </div>
                                        </div>
                                    )}
                                    {invoice.receipt_number && (
                                        <div>
                                            <p className="text-sm font-medium text-neutral-500 mb-1">Receipt Number</p>
                                            <div className="flex items-center gap-2">
                                                <Receipt className="h-4 w-4 text-neutral-400" />
                                                <span className="font-medium">{invoice.receipt_number}</span>
                                            </div>
                                        </div>
                                    )}
                                    {invoice.payment_description && (
                                        <div className="col-span-2">
                                            <p className="text-sm font-medium text-neutral-500 mb-1">Description</p>
                                            <p className="text-sm">{invoice.payment_description}</p>
                                        </div>
                                    )}
                                    {invoice.proof_image_url && (
                                        <div className="col-span-2">
                                            <p className="text-sm font-medium text-neutral-500 mb-2">Proof of Payment</p>
                                            <div className="border rounded-md p-2 bg-white">
                                                <a
                                                    href={invoice.proof_image_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2 text-sm"
                                                >
                                                    <ImageIcon className="h-4 w-4" />
                                                    <span>View Full Image (Opens in new tab)</span>
                                                </a>
                                                <div className="mt-2 overflow-auto max-h-80 border rounded bg-neutral-50 p-2">
                                                    <img
                                                        src={invoice.proof_image_url}
                                                        alt="Proof of payment"
                                                        className="max-w-full h-auto rounded border mx-auto block"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Email Status */}
                        <div className="border p-4 rounded-lg bg-blue-50/50">
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                <Mail className="h-5 w-5 text-blue-600" />
                                Email Status
                            </h3>
                            <div className="space-y-2">
                                {invoice.status === 'SENT' || invoice.status === 'PAID' ? (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                        <span className="text-sm">Invoice email sent to {invoice.client?.email || 'client'}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <XCircle className="h-4 w-4" />
                                        <span className="text-sm">Invoice email not sent yet</span>
                                    </div>
                                )}
                                {invoice.status === 'PAID' && (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                        <span className="text-sm">Payment confirmation email sent to {invoice.client?.email || 'client'}</span>
                                    </div>
                                )}
                                {!invoice.client?.email && (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <XCircle className="h-4 w-4" />
                                        <span className="text-sm">Client email not configured</span>
                                    </div>
                                )}
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
                </div>
            </DialogContent>
        </Dialog>
    )
}
