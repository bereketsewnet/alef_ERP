import { useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Download, FileText, Loader2, Send, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useInvoices, useInvoiceStats, useDownloadInvoice, useSendInvoice } from "@/services/useInvoices"
import { formatDateByCalendar } from "@/utils/ethiopianDate"
import { CreateInvoiceModal } from "@/components/billing/CreateInvoiceModal"
import { InvoiceDetailsModal } from "@/components/billing/InvoiceDetailsModal"
import { MarkAsPaidModal } from "@/components/billing/MarkAsPaidModal"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"

export function BillingPage() {
    const [search, setSearch] = useState("")
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [viewInvoiceId, setViewInvoiceId] = useState<number | null>(null)
    const [markAsPaidInvoiceId, setMarkAsPaidInvoiceId] = useState<number | null>(null)
    const [markAsPaidInvoiceNumber, setMarkAsPaidInvoiceNumber] = useState<string>("")
    const { toast } = useToast()

    // API Hooks
    const { data: invoices, isLoading } = useInvoices({ search })
    const { data: stats } = useInvoiceStats()
    const { mutateAsync: downloadInvoice } = useDownloadInvoice()
    const { mutate: sendInvoice, isPending: isSending } = useSendInvoice()

    const handleDownload = async (id: number, number: string) => {
        try {
            const blob = await downloadInvoice(id)
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `invoice-${number}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.parentNode?.removeChild(link)
            toast({
                title: "Success",
                description: "Invoice downloaded",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to download invoice",
                variant: "destructive",
            })
        }
    }

    const handleSend = (id: number) => {
        sendInvoice(id, {
            onSuccess: (data: any) => {
                toast({
                    title: "Success",
                    description: data.message || "Invoice sent successfully",
                })
            },
            onError: (error: any) => {
                let errorMessage = "Failed to send invoice"
                let errorTitle = "Error"
                const data = error?.response?.data
                const raw = (typeof data?.error === "string" ? data.error : null)
                    ?? (typeof data?.message === "string" ? data.message : null)
                    ?? (typeof error?.message === "string" ? error.message : null)
                    ?? (error?.error && typeof error.error === "string" ? error.error : null)
                const rawError = raw ?? (data && typeof data === "object" ? JSON.stringify(data).slice(0, 200) : null)

                if (rawError && typeof rawError === "string") {
                    if (rawError.includes("Permission denied") || rawError.includes("could not be opened")) {
                        errorTitle = "Server Configuration Error"
                        errorMessage = "Email sending failed due to server configuration. Please contact administrator."
                    } else if (rawError.includes("Connection") || rawError.includes("SMTP")) {
                        errorTitle = "Email Server Error"
                        errorMessage = "Failed to connect to email server. Please check mail configuration."
                    } else if (rawError.includes("Email not configured") || rawError.includes("set an email address")) {
                        errorTitle = "Email Not Configured"
                        errorMessage = "Please set an email address for this client before sending the invoice."
                    } else if (rawError.length > 150) {
                        const firstLine = rawError.split("\n")[0] || rawError.split(".")[0]
                        errorMessage = firstLine.length > 150 ? firstLine.substring(0, 150) + "..." : firstLine
                    } else {
                        errorMessage = rawError
                    }
                }

                toast({
                    title: errorTitle,
                    description: errorMessage,
                    variant: "destructive",
                })
            }
        })
    }

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "invoice_number",
            header: "Invoice #",
        },
        {
            accessorKey: "client",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Client
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const client = row.original.client
                return client?.company_name || client?.name || 'N/A'
            },
        },
        {
            accessorKey: "invoice_date",
            header: "Date",
            cell: ({ row }) => {
                const isoDate = row.getValue("invoice_date") as string
                const calendar = row.original.client?.preferred_calendar
                return formatDateByCalendar(isoDate, calendar)
            },
        },
        {
            accessorKey: "due_date",
            header: "Due Date",
            cell: ({ row }) => {
                const isoDate = row.getValue("due_date") as string
                const calendar = row.original.client?.preferred_calendar
                return formatDateByCalendar(isoDate, calendar)
            },
        },
        {
            accessorKey: "total_amount",
            header: "Amount (ETB)",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("total_amount"))
                return amount.toLocaleString() + " ETB"
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge
                        variant={
                            status === "PAID"
                                ? "default" // Using default (black/primary) for success-ish in shadcn if no success variant
                                : status === "SENT"
                                    ? "secondary" // Gray/Blue
                                    : status === "DRAFT"
                                        ? "outline" // Gray outline for draft
                                        : "destructive" // Red for overdue
                        }
                        className={status === 'PAID' ? 'bg-green-600' : status === 'DRAFT' ? 'bg-gray-100 text-gray-700' : ''}
                    >
                        {status}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const invoice = row.original
                return (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setViewInvoiceId(invoice.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(invoice.id, invoice.invoice_number)}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                        </Button>
                        {invoice.status === 'DRAFT' && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleSend(invoice.id)}
                                disabled={isSending}
                                className="text-green-600 hover:text-green-700"
                            >
                                <Send className="h-4 w-4 mr-1" />
                                {isSending ? 'Sending...' : 'Send'}
                            </Button>
                        )}
                        {(invoice.status === 'SENT' || invoice.status === 'DRAFT') && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                    setMarkAsPaidInvoiceId(invoice.id)
                                    setMarkAsPaidInvoiceNumber(invoice.invoice_number)
                                }}
                                className="text-blue-600 hover:text-blue-700"
                            >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark as Paid
                            </Button>
                        )}
                    </div>
                )
            },
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">
                        Billing & Invoices
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        Manage client invoices and billing
                    </p>
                </div>
                <Button className="bg-primary-600 hover:bg-primary-700" onClick={() => setCreateModalOpen(true)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Invoice
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-neutral-600">
                            Total Invoiced
                        </p>
                        <p className="text-2xl font-bold text-neutral-900">
                            {stats?.total_invoiced ? parseFloat(stats.total_invoiced.toString()).toLocaleString() : '0'} ETB
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-neutral-600">
                            Paid
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                            {stats?.paid ? parseFloat(stats.paid.toString()).toLocaleString() : '0'} ETB
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-neutral-600">
                            Pending
                        </p>
                        <p className="text-2xl font-bold text-amber-600">
                            {stats?.pending ? parseFloat(stats.pending.toString()).toLocaleString() : '0'} ETB
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-neutral-600">
                            Overdue
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                            {stats?.overdue ? parseFloat(stats.overdue.toString()).toLocaleString() : '0'} ETB
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <div className="w-72">
                    <Input
                        placeholder="Search invoices..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <DataTable columns={columns} data={invoices?.data || []} />
            )}

            <CreateInvoiceModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
            <InvoiceDetailsModal invoiceId={viewInvoiceId} onClose={() => setViewInvoiceId(null)} />
            {markAsPaidInvoiceId && (
                <MarkAsPaidModal
                    open={!!markAsPaidInvoiceId}
                    onOpenChange={(open) => {
                        if (!open) {
                            setMarkAsPaidInvoiceId(null)
                            setMarkAsPaidInvoiceNumber("")
                        }
                    }}
                    invoiceId={markAsPaidInvoiceId}
                    invoiceNumber={markAsPaidInvoiceNumber}
                />
            )}
        </div>
    )
}
