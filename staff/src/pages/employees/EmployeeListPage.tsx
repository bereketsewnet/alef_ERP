import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, MoreHorizontal } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock employee data - replace with actual API data
const mockEmployees = [
    {
        id: 1,
        name: "John Doe",
        email: "john.doe@email.com",
        role: "Security Guard",
        status: "active" as const,
        hire_date: "2023-01-15",
        phone: "+251912345678",
    },
    {
        id: 2,
        name: "Jane Smith",
        email: "jane.smith@email.com",
        role: "Security Supervisor",
        status: "active" as const,
        hire_date: "2022-06-20",
        phone: "+251923456789",
    },
    {
        id: 3,
        name: "Mike Johnson",
        email: "mike.j@email.com",
        role: "Security Guard",
        status: "probation" as const,
        hire_date: "2024-11-01",
        phone: "+251934567890",
    },
]

const columns: ColumnDef<typeof mockEmployees[0]>[] = [
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
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "role",
        header: "Role",
    },
    {
        accessorKey: "phone",
        header: "Phone",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge
                    variant={
                        status === "active"
                            ? "success"
                            : status === "probation"
                                ? "warning"
                                : "destructive"
                    }
                >
                    {status}
                </Badge>
            )
        },
    },
    {
        accessorKey: "hire_date",
        header: "Hire Date",
        cell: ({ row }) => {
            return new Date(row.getValue("hire_date")).toLocaleDateString()
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const employee = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Link Telegram</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                            Terminate
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

export function EmployeeListPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                        Employees
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                        Manage your workforce and employee information
                    </p>
                </div>
                <Button className="bg-primary-600 hover:bg-primary-700">
                    Add Employee
                </Button>
            </div>

            <DataTable columns={columns} data={mockEmployees} searchKey="name" />
        </div>
    )
}
