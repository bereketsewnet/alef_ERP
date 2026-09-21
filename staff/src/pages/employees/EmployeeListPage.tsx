import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Eye, DollarSign, X } from 'lucide-react'
import { useEmployees, useDeleteEmployee } from '@/services/useEmployees'
import { useJobCategories, useJobs } from '@/services/useJobs'
import type { Employee } from '@/api/endpoints/employees'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
import { useSearchParams } from 'react-router-dom'

export function EmployeeListPage() {
    const [searchParams] = useSearchParams()
    const initialSearch = searchParams.get('search') || ''
    const [search, setSearch] = useState(initialSearch)
    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [jobFilter, setJobFilter] = useState('all')
    const [perPage, setPerPage] = useState(25)
    const [page, setPage] = useState(1)
    const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null)
    const [employeeToView, setEmployeeToView] = useState<Employee | null>(null)
    const [viewTab, setViewTab] = useState<'info' | 'jobs' | 'salary'>('info')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearch(search.trim())
            setPage(1)
        }, 300)

        return () => window.clearTimeout(timeout)
    }, [search])

    const { data: categories = [], isLoading: categoriesLoading } = useJobCategories()
    const { data: jobs = [], isLoading: jobsLoading } = useJobs()
    const { data, isLoading, isFetching, isError } = useEmployees({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        category_id: categoryFilter === 'all'
            ? undefined
            : categoryFilter === 'none'
                ? 'none'
                : Number(categoryFilter),
        job_id: jobFilter === 'all' ? undefined : Number(jobFilter),
    })
    const { mutate: deleteEmployee } = useDeleteEmployee()

    useEffect(() => {
        if (data?.meta.last_page && page > data.meta.last_page) {
            setPage(data.meta.last_page)
        }
    }, [data?.meta.last_page, page])

    const activeFilters = search.length > 0 || categoryFilter !== 'all' || jobFilter !== 'all'

    const sortedCategories = useMemo(
        () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
        [categories]
    )
    const sortedJobs = useMemo(
        () => [...jobs].sort((a, b) => a.job_name.localeCompare(b.job_name)),
        [jobs]
    )

    const handleDelete = (employee: Employee) => {
        if (window.confirm(`Are you sure you want to delete employee "${employee.first_name} ${employee.last_name}"?`)) {
            deleteEmployee(employee.id)
        }
    }

    const clearFilters = () => {
        setSearch('')
        setDebouncedSearch('')
        setCategoryFilter('all')
        setJobFilter('all')
        setPage(1)
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

    const getCategoryNames = (employee: Employee) => {
        const names = new Set<string>()
        if (employee.job_category?.name) names.add(employee.job_category.name)
        employee.jobs?.forEach((job) => {
            if (job.category?.name) names.add(job.category.name)
        })
        return [...names]
    }

    const from = data?.meta.from ?? (data?.meta.total ? (data.meta.current_page - 1) * data.meta.per_page + 1 : 0)
    const to = data?.meta.to ?? (data ? Math.min(data.meta.current_page * data.meta.per_page, data.meta.total) : 0)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Employees</h1>
                    <p className="text-neutral-600 mt-1">
                        Manage your workforce and employee information
                    </p>
                </div>
                <Button
                    className="bg-primary-600 hover:bg-primary-700 shrink-0"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_220px_260px_auto]">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                        placeholder="Search by name, ID, email, or phone..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="pl-9"
                        aria-label="Search employees"
                    />
                </div>

                <Select
                    value={categoryFilter}
                    onValueChange={(value) => {
                        setCategoryFilter(value)
                        setPage(1)
                    }}
                >
                    <SelectTrigger aria-label="Filter employees by category">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="none">None / Unassigned</SelectItem>
                        {sortedCategories.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={jobFilter}
                    onValueChange={(value) => {
                        setJobFilter(value)
                        setPage(1)
                    }}
                >
                    <SelectTrigger aria-label="Filter employees by assigned job">
                        <SelectValue placeholder="All Jobs" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        {sortedJobs.map((job) => (
                            <SelectItem key={job.id} value={String(job.id)}>
                                {job.job_name} ({job.job_code})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {activeFilters && (
                    <Button type="button" variant="outline" onClick={clearFilters} className="xl:self-stretch">
                        <X className="mr-2 h-4 w-4" />
                        Clear Filters
                    </Button>
                )}
            </div>

            {(categoriesLoading || jobsLoading) && (
                <p className="text-sm text-neutral-500">Loading category and job filters...</p>
            )}

            <div className="overflow-x-auto rounded-lg border bg-white">
                <Table className="min-w-[1120px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Assigned Jobs</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Hire Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : isError ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-red-600">
                                    Employee records could not be loaded. Please try again.
                                </TableCell>
                            </TableRow>
                        ) : data?.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    No employees found
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data.map((employee) => {
                                const categoryNames = getCategoryNames(employee)
                                return (
                                    <TableRow key={employee.id} className={isFetching ? 'opacity-70' : undefined}>
                                        <TableCell className="font-medium">
                                            <div>{employee.first_name} {employee.last_name}</div>
                                            <div className="text-xs font-normal text-neutral-500">
                                                {employee.employee_code || `#${employee.id}`}
                                            </div>
                                        </TableCell>
                                        <TableCell>{employee.email || '-'}</TableCell>
                                        <TableCell>
                                            {categoryNames.length > 0 ? categoryNames.join(', ') : (
                                                <span className="text-neutral-500">None</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-[260px] whitespace-normal">
                                            {employee.jobs?.length
                                                ? employee.jobs.map((job) => job.job_name).join(', ')
                                                : <span className="text-neutral-500">None</span>}
                                        </TableCell>
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
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setViewTab('salary')
                                                        setEmployeeToView(employee)
                                                    }}
                                                    title="View Salary History"
                                                >
                                                    <DollarSign className="h-4 w-4 text-green-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setViewTab('info')
                                                        setEmployeeToView(employee)
                                                    }}
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
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {data && (
                <div className="flex flex-col gap-3 rounded-lg border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                        <span>Showing {from}–{to} of {data.meta.total} employees</span>
                        <div className="flex items-center gap-2">
                            <span>Rows per page</span>
                            <Select
                                value={String(perPage)}
                                onValueChange={(value) => {
                                    setPerPage(Number(value))
                                    setPage(1)
                                }}
                            >
                                <SelectTrigger className="h-8 w-[76px]" aria-label="Rows per page">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 25, 50, 100].map((size) => (
                                        <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            disabled={data.meta.current_page <= 1 || isFetching}
                        >
                            Previous
                        </Button>
                        <span className="min-w-[92px] text-center text-sm text-neutral-700">
                            Page {data.meta.current_page} of {Math.max(data.meta.last_page, 1)}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((current) => Math.min(data.meta.last_page, current + 1))}
                            disabled={data.meta.current_page >= data.meta.last_page || isFetching}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            <EmployeeFormModal
                open={isCreateModalOpen || !!employeeToEdit}
                onClose={() => {
                    setIsCreateModalOpen(false)
                    setEmployeeToEdit(null)
                }}
                employee={employeeToEdit}
            />

            <EmployeeDetailsModal
                open={!!employeeToView}
                onClose={() => {
                    setEmployeeToView(null)
                    setViewTab('info')
                }}
                employee={employeeToView}
                defaultTab={viewTab}
            />
        </div>
    )
}
