import { useState } from 'react'
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react'
import { useEmployees, useDeleteEmployee } from '@/services/useEmployees'
import type { Employee } from '@/api/endpoints/employees'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { EmployeeFormModal } from '@/components/employees/EmployeeFormModal'
import { EmployeeDetailsModal } from '@/components/employees/EmployeeDetailsModal'

export function EmployeeListPage() {
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null)
    const [employeeToView, setEmployeeToView] = useState<Employee | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const { data, isLoading } = useEmployees({ page, search: search || undefined })
    const { mutate: deleteEmployee } = useDeleteEmployee()

    const handleDelete = (employee: Employee) => {
        if (window.confirm(`Are you sure you want to delete employee "${employee.first_name} ${employee.last_name}"?`)) {
            deleteEmployee(employee.id)
        }
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'active':
                return 'success'
            case 'probation':
                return 'warning'
            case 'inactive':
            case 'terminated':
                return 'destructive'
            default:
                return 'default'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Employees</h1>
                    <p className="text-neutral-600 mt-1">
                        Manage your workforce and employee information
                    </p>
                </div>
                <Button
                    className="bg-primary-600 hover:bg-primary-700"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                    <Input
                        placeholder="Search by name, email, or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>

                            <TableHead>Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Hire Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : data?.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    No employees found
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell className="font-medium">
                                        {employee.first_name} {employee.last_name}
                                    </TableCell>
                                    <TableCell>{employee.email || '-'}</TableCell>

                                    <TableCell>{employee.phone_number}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(employee.status)}>
                                            {employee.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(employee.hire_date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEmployeeToView(employee)}
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEmployeeToEdit(employee)}
                                                title="Edit"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(employee)}
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data && data.meta && data.meta.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-600">
                        Showing {data.data.length} of {data.meta.total} employees
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={page === data.meta.last_page}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            <EmployeeFormModal
                open={isCreateModalOpen || !!employeeToEdit}
                onClose={() => {
                    setIsCreateModalOpen(false)
                    setEmployeeToEdit(null)
                }}
                employee={employeeToEdit}
            />

            {/* View Details Modal */}
            <EmployeeDetailsModal
                open={!!employeeToView}
                onClose={() => setEmployeeToView(null)}
                employee={employeeToView}
            />
        </div>
    )
}
