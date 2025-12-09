import { useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Download, FileText, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useInvoices, useInvoiceStats, useDownloadInvoice } from "@/services/useInvoices"
import { CreateInvoiceModal } from "@/components/billing/CreateInvoiceModal"
import { InvoiceDetailsModal } from "@/components/billing/InvoiceDetailsModal"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

export function BillingPage() {
    const [search, setSearch] = useState("")
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [viewInvoiceId, setViewInvoiceId] = useState<number | null>(null)

    // API Hooks
    const { data: invoices, isLoading } = useInvoices({ search })
    const { data: stats } = useInvoiceStats()
    const { mutateAsync: downloadInvoice } = useDownloadInvoice()

    const handleDownload = async (id: number, number: string) => {
        try {
            const blob = await downloadInvoice(id)
            const url = window.URL.createObjectURL(new Blob([blob]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `invoice-${number}.txt`) // Changed to .txt as per controller Stub 
            document.body.appendChild(link)
            link.click()
            link.parentNode?.removeChild(link)
            toast.success("Invoice downloaded")
        } catch (error) {
            toast.error("Failed to download invoice")
        }
    }

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "invoice_number",
            header: "Invoice #",
        },
        {
            accessorKey: "client.name",
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
        },
        {
            accessorKey: "invoice_date",
            header: "Date",
            cell: ({ row }) => {
                return new Date(row.getValue("invoice_date")).toLocaleDateString()
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
                                    : "destructive" // Red for overdue
                        }
                        className={status === 'PAID' ? 'bg-green-600' : ''}
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
        </div>
    )
}
