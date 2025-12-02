import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Package as PackageIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// Mock assets data
const mockAssets = [
    {
        id: 1,
        code: "UNI-001",
        name: "Security Uniform (Large)",
        category: "Uniform",
        status: "assigned" as const,
        assigned_to: "John Doe",
        value: 500,
    },
    {
        id: 2,
        code: "RAD-001",
        name: "Walkie Talkie Motorola",
        category: "Radio",
        status: "assigned" as const,
        assigned_to: "Jane Smith",
        value: 2500,
    },
    {
        id: 3,
        code: "FLASH-003",
        name: "LED Flashlight",
        category: "Equipment",
        status: "available" as const,
        assigned_to: null,
        value: 300,
    },
]

const columns: ColumnDef<typeof mockAssets[0]>[] = [
    {
        accessorKey: "code",
        header: "Asset Code",
    },
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
            return <Badge variant="outline">{row.getValue("category")}</Badge>
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "assigned" ? "secondary" : "success"}>
                    {status}
                </Badge>
            )
        },
    },
    {
        accessorKey: "assigned_to",
        header: "Assigned To",
        cell: ({ row }) => {
            return row.getValue("assigned_to") || "-"
        },
    },
    {
        accessorKey: "value",
        header: "Value (ETB)",
        cell: ({ row }) => {
            return `${row.getValue("value")} ETB`
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                </Button>
            )
        },
    },
]

export function AssetListPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                        Assets
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                        Manage company assets and assignments
                    </p>
                </div>
                <Button className="bg-primary-600 hover:bg-primary-700">
                    Add Asset
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Total Assets
                                </p>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                    {mockAssets.length}
                                </p>
                            </div>
                            <PackageIcon className="h-8 w-8 text-primary-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            Assigned
                        </p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                            {mockAssets.filter(a => a.status === "assigned").length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            Available
                        </p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                            {mockAssets.filter(a => a.status === "available").length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            Total Value
                        </p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                            {mockAssets.reduce((acc, a) => acc + a.value, 0)} ETB
                        </p>
                    </CardContent>
                </Card>
            </div>

            <DataTable columns={columns} data={mockAssets} searchKey="name" />
        </div>
    )
}
