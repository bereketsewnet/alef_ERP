import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Download, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// Mock billing data
const mockInvoices = [
    {
        id: 1,
        invoice_number: "INV-2024-001",
        client_name: "Addis Mall Corporation",
        amount: 125000,
        status: "paid" as const,
        date: "2024-11-30",
    },
    {
        id: 2,
        invoice_number: "INV-2024-002",
        client_name: "Ethiopian Airlines",
        amount: 285000,
        status: "pending" as const,
        date: "2024-11-30",
    },
    {
        id: 3,
        invoice_number: "INV-2024-003",
        client_name: "Commercial Bank of Ethiopia",
        amount: 520000,
        status: "overdue" as const,
        date: "2024-10-31",
    },
]

const columns: ColumnDef<typeof mockInvoices[0]>[] = [
    {
        accessorKey: "invoice_number",
        header: "Invoice #",
    },
    {
        accessorKey: "client_name",
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
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => {
            return new Date(row.getValue("date")).toLocaleDateString()
        },
    },
    {
        accessorKey: "amount",
        header: "Amount (ETB)",
        cell: ({ row }) => {
            const amount = row.getValue("amount") as number
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
                        status === "paid"
                            ? "success"
                            : status === "pending"
                                ? "warning"
                                : "destructive"
                    }
                >
                    {status.toUpperCase()}
                </Badge>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                    </Button>
                    <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                    </Button>
                </div>
            )
        },
    },
]

export function BillingPage() {
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
                <Button className="bg-primary-600 hover:bg-primary-700">
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
                            {mockInvoices.reduce((acc, inv) => acc + inv.amount, 0).toLocaleString()} ETB
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-neutral-600">
                            Paid
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                            {mockInvoices
                                .filter(inv => inv.status === "paid")
                                .reduce((acc, inv) => acc + inv.amount, 0)
                                .toLocaleString()} ETB
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-neutral-600">
                            Pending
                        </p>
                        <p className="text-2xl font-bold text-amber-600">
                            {mockInvoices
                                .filter(inv => inv.status === "pending")
                                .reduce((acc, inv) => acc + inv.amount, 0)
                                .toLocaleString()} ETB
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-neutral-600">
                            Overdue
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                            {mockInvoices
                                .filter(inv => inv.status === "overdue")
                                .reduce((acc, inv) => acc + inv.amount, 0)
                                .toLocaleString()} ETB
                        </p>
                    </CardContent>
                </Card>
            </div>

            <DataTable columns={columns} data={mockInvoices} searchKey="client_name" />
        </div>
    )
}
