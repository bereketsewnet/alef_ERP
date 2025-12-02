import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, CheckCircle, XCircle } from "lucide-react"

// Mock attendance data
const mockAttendance = [
    {
        id: 1,
        employee_name: "John Doe",
        site_name: "Downtown Mall",
        clock_type: "IN" as const,
        timestamp: "2024-12-02 08:15:00",
        distance_meters: 15,
        is_verified: true,
    },
    {
        id: 2,
        employee_name: "Jane Smith",
        site_name: "Airport Terminal A",
        clock_type: "IN" as const,
        timestamp: "2024-12-02 09:00:00",
        distance_meters: 8,
        is_verified: true,
    },
    {
        id: 3,
        employee_name: "Mike Johnson",
        site_name: "Bank HQ",
        clock_type: "OUT" as const,
        timestamp: "2024-12-02 17:05:00",
        distance_meters: 125,
        is_verified: false,
    },
]

const columns: ColumnDef<typeof mockAttendance[0]>[] = [
    {
        accessorKey: "employee_name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Employee
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "site_name",
        header: "Site",
    },
    {
        accessorKey: "clock_type",
        header: "Type",
        cell: ({ row }) => {
            const type = row.getValue("clock_type") as string
            return (
                <Badge variant={type === "IN" ? "success" : "secondary"}>
                    {type}
                </Badge>
            )
        },
    },
    {
        accessorKey: "timestamp",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Timestamp
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return new Date(row.getValue("timestamp")).toLocaleString()
        },
    },
    {
        accessorKey: "distance_meters",
        header: "Distance",
        cell: ({ row }) => {
            const distance = row.getValue("distance_meters") as number
            return (
                <span className={distance > 100 ? "text-red-600" : "text-green-600"}>
                    {distance}m
                </span>
            )
        },
    },
    {
        accessorKey: "is_verified",
        header: "Verified",
        cell: ({ row }) => {
            const verified = row.getValue("is_verified") as boolean
            return verified ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
                <XCircle className="h-5 w-5 text-red-600" />
            )
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

export function AttendanceLogsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                    Attendance Logs
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                    View and manage employee clock-in/out records
                </p>
            </div>

            <DataTable columns={columns} data={mockAttendance} searchKey="employee_name" />
        </div>
    )
}
