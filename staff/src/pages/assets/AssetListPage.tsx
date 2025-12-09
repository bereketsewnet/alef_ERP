import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Package,
    PackageCheck,
    PackageX,
    Wrench,
    Plus,
    Search,
    Eye,
    Edit,
    Trash2,
    UserPlus,
    Undo2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { useAssets, useAssetStats, useDeleteAsset, useAssignAsset, useReturnAsset, useCreateAsset, useUpdateAsset } from "@/services/useAssets"
import { useEmployees } from "@/services/useEmployees"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { Asset } from "@/api/endpoints/assets"

// Form schemas
const assetSchema = z.object({
    asset_code: z.string().min(1, 'Asset code is required'),
    name: z.string().min(1, 'Name is required'),
    category: z.string().min(1, 'Category is required'),
    description: z.string().optional(),
    purchase_date: z.string().optional(),
    value: z.string().optional(),
    condition: z.string().optional(),
})

const assignSchema = z.object({
    employee_id: z.string().min(1, 'Employee is required'),
    notes: z.string().optional(),
})

const returnSchema = z.object({
    condition: z.string().optional(),
    notes: z.string().optional(),
})

export function AssetListPage() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string | undefined>()
    const [categoryFilter, setCategoryFilter] = useState<string | undefined>()

    const [formModalOpen, setFormModalOpen] = useState(false)
    const [assignModalOpen, setAssignModalOpen] = useState(false)
    const [returnModalOpen, setReturnModalOpen] = useState(false)
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
    const [editMode, setEditMode] = useState(false)

    // Debounce search to avoid too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    const { data: assetsData, isLoading } = useAssets({
        page,
        search: debouncedSearch || undefined,
        status: statusFilter,
        category: categoryFilter,
    })
    const { data: stats } = useAssetStats()
    const { data: employeesData } = useEmployees({ per_page: 1000 })

    const { mutate: deleteAsset } = useDeleteAsset()
    const { mutate: createAsset, isPending: isCreating } = useCreateAsset()
    const { mutate: updateAsset, isPending: isUpdating } = useUpdateAsset()
    const { mutate: assignAsset, isPending: isAssigning } = useAssignAsset()
    const { mutate: returnAsset, isPending: isReturning } = useReturnAsset()

    const assetForm = useForm({
        resolver: zodResolver(assetSchema),
        defaultValues: {
            asset_code: '',
            name: '',
            category: '',
            description: '',
            purchase_date: '',
            value: '',
            condition: 'NEW',
        },
    })

    const assignForm = useForm({
        resolver: zodResolver(assignSchema),
        defaultValues: {
            employee_id: '',
            notes: '',
        },
    })

    const returnForm = useForm({
        resolver: zodResolver(returnSchema),
        defaultValues: {
            condition: 'GOOD',
            notes: '',
        },
    })

    const handleAddAsset = () => {
        setEditMode(false)
        setSelectedAsset(null)
        assetForm.reset()
        setFormModalOpen(true)
    }

    const handleEditAsset = (asset: Asset) => {
        setEditMode(true)
        setSelectedAsset(asset)
        assetForm.reset({
            asset_code: asset.asset_code,
            name: asset.name,
            category: asset.category,
            description: asset.description || '',
            purchase_date: asset.purchase_date ? new Date(asset.purchase_date).toISOString().split('T')[0] : '',
            value: asset.value ? asset.value.toString() : '',
            condition: asset.condition,
        })
        setFormModalOpen(true)
    }

    const handleDeleteAsset = (id: number) => {
        if (window.confirm('Are you sure you want to delete this asset?')) {
            deleteAsset(id)
        }
    }

    const handleAssignAsset = (asset: Asset) => {
        setSelectedAsset(asset)
        assignForm.reset()
        setAssignModalOpen(true)
    }

    const handleReturnAsset = (asset: Asset) => {
        setSelectedAsset(asset)
        returnForm.reset()
        setReturnModalOpen(true)
    }

    const handleViewDetails = (asset: Asset) => {
        setSelectedAsset(asset)
        setDetailsModalOpen(true)
    }

    const onSubmitAsset = (values: z.infer<typeof assetSchema>) => {
        const data = {
            ...values,
            value: values.value ? parseFloat(values.value) : undefined,
        }

        if (editMode && selectedAsset) {
            updateAsset({ id: selectedAsset.id, data }, {
                onSuccess: () => setFormModalOpen(false),
            })
        } else {
            createAsset(data, {
                onSuccess: () => setFormModalOpen(false),
            })
        }
    }

    const onSubmitAssign = (values: z.infer<typeof assignSchema>) => {
        if (!selectedAsset) return

        assignAsset({
            id: selectedAsset.id,
            data: {
                employee_id: parseInt(values.employee_id),
                notes: values.notes,
            },
        }, {
            onSuccess: () => setAssignModalOpen(false),
        })
    }

    const onSubmitReturn = (values: z.infer<typeof returnSchema>) => {
        if (!selectedAsset) return

        returnAsset({
            id: selectedAsset.id,
            data: values,
        }, {
            onSuccess: () => setReturnModalOpen(false),
        })
    }

    const getStatusBadge = (asset: Asset) => {
        const status = asset.current_assignment_status
        const colors = {
            available: 'bg-green-100 text-green-800',
            assigned: 'bg-blue-100 text-blue-800',
            maintenance: 'bg-yellow-100 text-yellow-800',
            retired: 'bg-gray-100 text-gray-800',
        }
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.available}`}>
                {status}
            </span>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">
                        Asset Management
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        Track and manage company assets
                    </p>
                </div>
                <Button onClick={handleAddAsset}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Asset
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600">
                                    Total Assets
                                </p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {stats?.total || 0}
                                </p>
                            </div>
                            <Package className="h-8 w-8 text-primary-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600">
                                    Available
                                </p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {stats?.available || 0}
                                </p>
                            </div>
                            <PackageCheck className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600">
                                    Assigned
                                </p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {stats?.assigned || 0}
                                </p>
                            </div>
                            <PackageX className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600">
                                    Maintenance
                                </p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {stats?.maintenance || 0}
                                </p>
                            </div>
                            <Wrench className="h-8 w-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center flex-wrap">
                <div className="flex-1 max-w-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                        <Input
                            placeholder="Search by code, name, or category..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                            className="pl-10"
                        />
                    </div>
                </div>
                <select
                    value={statusFilter || ''}
                    onChange={(e) => {
                        setStatusFilter(e.target.value || undefined)
                        setPage(1)
                    }}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                    <option value="">All Status</option>
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                </select>
                <select
                    value={categoryFilter || ''}
                    onChange={(e) => {
                        setCategoryFilter(e.target.value || undefined)
                        setPage(1)
                    }}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                    <option value="">All Categories</option>
                    <option value="UNIFORM">Uniform</option>
                    <option value="DEVICE">Device</option>
                    <option value="VEHICLE">Vehicle</option>
                    <option value="EQUIPMENT">Equipment</option>
                </select>
            </div>

            {/* Assets Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Asset Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Condition</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                                    Loading assets...
                                </TableCell>
                            </TableRow>
                        )}

                        {assetsData && assetsData.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                                    No assets found
                                </TableCell>
                            </TableRow>
                        )}

                        {assetsData?.data.map((asset) => (
                            <TableRow key={asset.id}>
                                <TableCell className="font-medium">{asset.asset_code}</TableCell>
                                <TableCell>{asset.name}</TableCell>
                                <TableCell>{asset.category}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                                        {asset.condition}
                                    </span>
                                </TableCell>
                                <TableCell>{getStatusBadge(asset)}</TableCell>
                                <TableCell>
                                    {asset.current_assignment?.employee ? (
                                        <div>
                                            <div className="font-medium">
                                                {asset.current_assignment.employee.first_name} {asset.current_assignment.employee.last_name}
                                            </div>
                                            <div className="text-xs text-neutral-500">
                                                {asset.current_assignment.employee.employee_code}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-neutral-500">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewDetails(asset)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {asset.current_assignment_status === 'available' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleAssignAsset(asset)}
                                            >
                                                <UserPlus className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {asset.current_assignment_status === 'assigned' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleReturnAsset(asset)}
                                            >
                                                <Undo2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditAsset(asset)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteAsset(asset.id)}
                                            disabled={!!asset.current_assignment}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {assetsData && assetsData.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-neutral-500">
                        Showing {assetsData.from} to {assetsData.to} of {assetsData.total} results
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={!assetsData.prev_page_url}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <div className="flex items-center gap-2 px-3">
                            <span className="text-sm">
                                Page {assetsData.current_page} of {assetsData.last_page}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={!assetsData.next_page_url}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Add/Edit Asset Modal */}
            <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editMode ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
                        <DialogDescription>
                            {editMode ? 'Update asset information' : 'Enter the details for the new asset'}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...assetForm}>
                        <form onSubmit={assetForm.handleSubmit(onSubmitAsset)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={assetForm.control}
                                    name="asset_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Asset Code</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <Input {...field} disabled={editMode} placeholder="AST-20251205-001" />
                                                </FormControl>
                                                {!editMode && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => {
                                                            const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
                                                            const random = Math.floor(Math.random() * 900) + 100
                                                            const code = `AST-${date}-${random}`
                                                            assetForm.setValue('asset_code', code)
                                                        }}
                                                    >
                                                        Generate
                                                    </Button>
                                                )}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={assetForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Asset Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={assetForm.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="UNIFORM">Uniform</SelectItem>
                                                    <SelectItem value="DEVICE">Device</SelectItem>
                                                    <SelectItem value="VEHICLE">Vehicle</SelectItem>
                                                    <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={assetForm.control}
                                    name="condition"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Condition</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select condition" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="NEW">New</SelectItem>
                                                    <SelectItem value="GOOD">Good</SelectItem>
                                                    <SelectItem value="DAMAGED">Damaged</SelectItem>
                                                    <SelectItem value="LOST">Lost</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={assetForm.control}
                                    name="purchase_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Purchase Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={assetForm.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Value</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={assetForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setFormModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isCreating || isUpdating}>
                                    {isCreating || isUpdating ? 'Saving...' : editMode ? 'Update Asset' : 'Create Asset'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Assign Asset Modal */}
            <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Asset</DialogTitle>
                        <DialogDescription>
                            Assign {selectedAsset?.name} to an employee
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...assignForm}>
                        <form onSubmit={assignForm.handleSubmit(onSubmitAssign)} className="space-y-4">
                            <FormField
                                control={assignForm.control}
                                name="employee_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employee</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select employee" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {employeesData?.data.map((emp) => (
                                                    <SelectItem key={emp.id} value={emp.id.toString()}>
                                                        {emp.first_name} {emp.last_name} ({emp.employee_code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={assignForm.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setAssignModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isAssigning}>
                                    {isAssigning ? 'Assigning...' : 'Assign'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Return Asset Modal */}
            <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Return Asset</DialogTitle>
                        <DialogDescription>
                            Mark {selectedAsset?.name} as returned
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...returnForm}>
                        <form onSubmit={returnForm.handleSubmit(onSubmitReturn)} className="space-y-4">
                            <FormField
                                control={returnForm.control}
                                name="condition"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Return Condition</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select condition" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="NEW">New</SelectItem>
                                                <SelectItem value="GOOD">Good</SelectItem>
                                                <SelectItem value="DAMAGED">Damaged</SelectItem>
                                                <SelectItem value="LOST">Lost</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={returnForm.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setReturnModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isReturning}>
                                    {isReturning ? 'Processing...' : 'Return Asset'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Details Modal - Simplified for now */}
            <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Asset Details</DialogTitle>
                    </DialogHeader>
                    {selectedAsset && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-neutral-600">Asset Code</p>
                                    <p className="text-base">{selectedAsset.asset_code}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-600">Name</p>
                                    <p className="text-base">{selectedAsset.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-600">Category</p>
                                    <p className="text-base">{selectedAsset.category}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-600">Condition</p>
                                    <p className="text-base">{selectedAsset.condition}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-600">Status</p>
                                    <div>{getStatusBadge(selectedAsset)}</div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-600">Value</p>
                                    <p className="text-base">${selectedAsset.value}</p>
                                </div>
                            </div>
                            {selectedAsset.current_assignment && (
                                <div className="border-t pt-4">
                                    <p className="font-medium mb-2">Current Assignment</p>
                                    <div className="bg-neutral-50 p-3 rounded">
                                        <p className="text-sm">
                                            Assigned to: {selectedAsset.current_assignment.employee?.first_name} {selectedAsset.current_assignment.employee?.last_name}
                                        </p>
                                        <p className="text-sm text-neutral-600">
                                            Since: {new Date(selectedAsset.current_assignment.assigned_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
