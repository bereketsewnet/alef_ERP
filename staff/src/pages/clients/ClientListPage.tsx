import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// Mock clients data
const mockClients = [
    {
        id: 1,
        name: "Addis Mall Corporation",
        contact_person: "Abebe Kebede",
        phone: "+251911234567",
        active_sites: 3,
        status: "active" as const,
    },
    {
        id: 2,
        name: "Ethiopian Airlines",
        contact_person: "Meron Tesfaye",
        phone: "+251922345678",
        active_sites: 5,
        status: "active" as const,
    },
    {
        id: 3,
        name: "Commercial Bank of Ethiopia",
        contact_person: "Dawit Haile",
        phone: "+251933456789",
        active_sites: 12,
        status: "active" as const,
    },
]

const columns: ColumnDef<typeof mockClients[0]>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Client Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "contact_person",
        header: "Contact Person",
    },
    {
        accessorKey: "phone",
        header: "Phone",
    },
    {
        accessorKey: "active_sites",
        header: "Active Sites",
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-neutral-500" />
                    <span>{row.getValue("active_sites")}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            return <Badge variant="success">Active</Badge>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                </Button>
            )
        },
    },
]

export function ClientListPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                        Clients & Sites
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                        Manage your clients and their site locations
                    </p>
                </div>
                <Button className="bg-primary-600 hover:bg-primary-700">
                    Add Client
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            Total Clients
                        </p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                            {mockClients.length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            Total Sites
                        </p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                            {mockClients.reduce((acc, c) => acc + c.active_sites, 0)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            Average Sites/Client
                        </p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                            {(mockClients.reduce((acc, c) => acc + c.active_sites, 0) / mockClients.length).toFixed(1)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <DataTable columns={columns} data={mockClients} searchKey="name" />
        </div>
    )
}
