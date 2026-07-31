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
    ExternalLink,
    History,
} from "lucide-react"
import { useAssets, useAsset, useAssetBatch, useAssetBatches, useAssetAssignmentHistory, useAssetStats, useDeleteAsset, useDeleteAssetAssignment, useAssignAsset, useReturnAsset, useCreateAsset, useUpdateAsset } from "@/services/useAssets"
import { OptionalFileField } from "@/components/shared/OptionalFileField"
import { useEmployees } from "@/services/useEmployees"
import { useClients } from "@/services/useClients"
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
    client_id: z.string().optional(),
    site_id: z.string().optional(),
    quantity: z.string().refine(
        (value) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 500,
        'Quantity must be between 1 and 500',
    ),
})

const assignSchema = z.object({
    employee_id: z.string().min(1, 'Employee is required'),
    notes: z.string().optional(),
    assignment_document: z.instanceof(File).optional(),
    assignment_condition_image: z.instanceof(File).optional(),
})

const returnSchema = z.object({
    condition: z.string().optional(),
    notes: z.string().optional(),
    return_document: z.instanceof(File).optional(),
    return_condition_image: z.instanceof(File).optional(),
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
    const [historyModalOpen, setHistoryModalOpen] = useState(false)
    const [historySearch, setHistorySearch] = useState('')
    const [batchModalOpen, setBatchModalOpen] = useState(false)
    const [selectedBatchId, setSelectedBatchId] = useState('')
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
    const { data: batchesData, isLoading: areBatchesLoading } = useAssetBatches({
        search: debouncedSearch || undefined,
    })
    const { data: batchDetails, isLoading: isBatchLoading } = useAssetBatch(selectedBatchId)
    const { data: assetDetails } = useAsset(detailsModalOpen && selectedAsset ? selectedAsset.id : 0)
    const { data: assignmentHistory, isLoading: isHistoryLoading } = useAssetAssignmentHistory({
        search: historySearch || undefined,
        per_page: 100,
    })
    const { data: employeesData } = useEmployees({ per_page: 1000 })
    const { data: clientsData } = useClients({ page: 1, per_page: 1000 })

    const { mutate: deleteAsset } = useDeleteAsset()
    const { mutate: createAsset, isPending: isCreating } = useCreateAsset()
    const { mutate: updateAsset, isPending: isUpdating } = useUpdateAsset()
    const { mutate: assignAsset, isPending: isAssigning } = useAssignAsset()
    const { mutate: returnAsset, isPending: isReturning } = useReturnAsset()
    const { mutate: deleteAssignment, isPending: isDeletingAssignment } = useDeleteAssetAssignment()

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
            client_id: '',
            site_id: '',
            quantity: '1',
        },
    })

    const assignForm = useForm({
        resolver: zodResolver(assignSchema),
        defaultValues: {
            employee_id: '',
            notes: '',
            assignment_document: undefined,
            assignment_condition_image: undefined,
        },
    })

    const returnForm = useForm({
        resolver: zodResolver(returnSchema),
        defaultValues: {
            condition: 'GOOD',
            notes: '',
            return_document: undefined,
            return_condition_image: undefined,
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
            client_id: asset.client_id?.toString() || '',
            site_id: asset.site_id?.toString() || '',
            quantity: '1',
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

    const handleViewBatch = (batchId: string) => {
        setSelectedBatchId(batchId)
        setBatchModalOpen(true)
    }

    const handleDeleteAssignment = (assetId: number, assignmentId: number, isActive: boolean) => {
        const warning = isActive
            ? 'This is an active assignment. Deleting it will make the asset available immediately and permanently remove its evidence files. Continue?'
            : 'Delete this assignment history and all of its evidence files permanently?'
        if (window.confirm(warning)) {
            deleteAssignment({ assetId, assignmentId })
        }
    }

    const onSubmitAsset = (values: z.infer<typeof assetSchema>) => {
        const data = {
            ...values,
            value: values.value ? parseFloat(values.value) : undefined,
            client_id: values.client_id ? parseInt(values.client_id) : null,
            site_id: values.site_id ? parseInt(values.site_id) : null,
            quantity: editMode ? undefined : parseInt(values.quantity),
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
                assignment_document: values.assignment_document,
                assignment_condition_image: values.assignment_condition_image,
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

    const detailAsset = assetDetails || selectedAsset
    const selectedClient = clientsData?.data.find(
        (client) => client.id.toString() === assetForm.watch('client_id'),
    )

    const evidenceLink = (url: string | null | undefined, label: string) => url ? (
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
            <ExternalLink className="h-3.5 w-3.5" />
            {label}
        </a>
    ) : <span className="text-sm text-neutral-400">Not attached</span>

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                        Asset Management
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        Track and manage company assets
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setHistoryModalOpen(true)} className="shrink-0">
                        <History className="mr-2 h-4 w-4" />
                        Assignment History
                    </Button>
                    <Button onClick={handleAddAsset} className="shrink-0">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Asset
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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
            {(areBatchesLoading || (batchesData?.data.length ?? 0) > 0) && (
                <div className="space-y-2">
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-900">Assets by Company and Product</h2>
                        <p className="text-sm text-neutral-500">The same product from the same company is shown once. Open it to manage every individual unit.</p>
                    </div>
                    <div className="overflow-x-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Company / Site</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Available</TableHead>
                                    <TableHead>Assigned</TableHead>
                                    <TableHead className="text-right">Manage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {areBatchesLoading && (
                                    <TableRow><TableCell colSpan={7} className="py-8 text-center text-neutral-500">Loading batches...</TableCell></TableRow>
                                )}
                                {batchesData?.data.map((batch) => (
                                    <TableRow key={batch.batch_id}>
                                        <TableCell className="font-medium">{batch.asset_name}</TableCell>
                                        <TableCell>{batch.category}</TableCell>
                                        <TableCell>
                                            <div>{batch.client?.company_name || '—'}</div>
                                            {batch.site && <div className="text-xs text-neutral-500">{batch.site.site_name}</div>}
                                        </TableCell>
                                        <TableCell className="font-semibold">{batch.quantity}</TableCell>
                                        <TableCell className="text-green-700">{batch.available_quantity}</TableCell>
                                        <TableCell className="text-blue-700">{batch.assigned_quantity}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleViewBatch(batch.batch_id)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View All {batch.quantity}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {assetsData && assetsData.data.length > 0 && <>
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Asset Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Company / Site</TableHead>
                            <TableHead>Condition</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-neutral-500">
                                    Loading assets...
                                </TableCell>
                            </TableRow>
                        )}

                        {assetsData && assetsData.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-neutral-500">
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
                                    {asset.client ? (
                                        <div>
                                            <div className="font-medium">{asset.client.company_name}</div>
                                            {asset.site && <div className="text-xs text-neutral-500">{asset.site.site_name}</div>}
                                        </div>
                                    ) : <span className="text-neutral-500">—</span>}
                                </TableCell>
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
            </>}

            {/* Pagination */}
            {assetsData && assetsData.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
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

            {/* Batch Assets Modal */}
            <Dialog open={batchModalOpen} onOpenChange={setBatchModalOpen}>
                <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{batchDetails?.batch_name || 'Asset Batch'}</DialogTitle>
                        <DialogDescription>
                            {batchDetails ? `${batchDetails.quantity} assets in this batch. Manage each asset separately.` : 'Loading batch assets...'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-x-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Condition</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Assigned To</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isBatchLoading && (
                                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-neutral-500">Loading assets...</TableCell></TableRow>
                                )}
                                {batchDetails?.assets.map((asset) => (
                                    <TableRow key={asset.id}>
                                        <TableCell className="font-medium">{asset.asset_code}</TableCell>
                                        <TableCell>{asset.name}</TableCell>
                                        <TableCell>{asset.condition}</TableCell>
                                        <TableCell>{getStatusBadge(asset)}</TableCell>
                                        <TableCell>
                                            {asset.current_assignment?.employee
                                                ? `${asset.current_assignment.employee.first_name} ${asset.current_assignment.employee.last_name}`
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" title="View" onClick={() => { setBatchModalOpen(false); handleViewDetails(asset) }}><Eye className="h-4 w-4" /></Button>
                                                {asset.current_assignment_status === 'available' && (
                                                    <Button variant="ghost" size="sm" title="Assign" onClick={() => { setBatchModalOpen(false); handleAssignAsset(asset) }}><UserPlus className="h-4 w-4" /></Button>
                                                )}
                                                {asset.current_assignment_status === 'assigned' && (
                                                    <Button variant="ghost" size="sm" title="Return" onClick={() => { setBatchModalOpen(false); handleReturnAsset(asset) }}><Undo2 className="h-4 w-4" /></Button>
                                                )}
                                                <Button variant="ghost" size="sm" title="Edit" onClick={() => { setBatchModalOpen(false); handleEditAsset(asset) }}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="sm" title="Delete" disabled={!!asset.current_assignment} onClick={() => handleDeleteAsset(asset.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setBatchModalOpen(false)}>Close</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Asset Modal */}
            <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    control={assetForm.control}
                                    name="client_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company (Optional)</FormLabel>
                                            <Select
                                                value={field.value || 'none'}
                                                onValueChange={(value) => {
                                                    field.onChange(value === 'none' ? '' : value)
                                                    assetForm.setValue('site_id', '')
                                                }}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select company" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">No company</SelectItem>
                                                    {clientsData?.data.map((client) => (
                                                        <SelectItem key={client.id} value={client.id.toString()}>
                                                            {client.company_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={assetForm.control}
                                    name="site_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Site (Optional)</FormLabel>
                                            <Select
                                                value={field.value || 'none'}
                                                onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                                                disabled={!selectedClient}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select site" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">No specific site</SelectItem>
                                                    {selectedClient?.sites?.map((site) => (
                                                        <SelectItem key={site.id} value={site.id.toString()}>
                                                            {site.site_name}
                                                        </SelectItem>
                                                    ))}
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

                            {!editMode && (
                                <FormField
                                    control={assetForm.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantity</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" max="500" step="1" {...field} />
                                            </FormControl>
                                            <p className="text-xs text-neutral-500">
                                                For multiple assets, codes will be created as {assetForm.watch('asset_code') || 'BASE-CODE'}-001, -002, and so on.
                                            </p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

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
                            <div className="grid gap-3 sm:grid-cols-2">
                                <FormField
                                    control={assignForm.control}
                                    name="assignment_document"
                                    render={({ field }) => (
                                        <OptionalFileField
                                            id="assignment-document"
                                            label="Signed handover paper"
                                            description="Employee-signed issue or handover form."
                                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
                                            value={field.value}
                                            disabled={isAssigning}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                                <FormField
                                    control={assignForm.control}
                                    name="assignment_condition_image"
                                    render={({ field }) => (
                                        <OptionalFileField
                                            id="assignment-condition-image"
                                            label="Physical condition photo"
                                            description="Photo of the asset when issued."
                                            accept="image/jpeg,image/png,image/webp"
                                            value={field.value}
                                            disabled={isAssigning}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
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
                            <div className="grid gap-3 sm:grid-cols-2">
                                <FormField
                                    control={returnForm.control}
                                    name="return_document"
                                    render={({ field }) => (
                                        <OptionalFileField
                                            id="return-document"
                                            label="Signed return paper"
                                            description="Employee-signed asset return form."
                                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
                                            value={field.value}
                                            disabled={isReturning}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                                <FormField
                                    control={returnForm.control}
                                    name="return_condition_image"
                                    render={({ field }) => (
                                        <OptionalFileField
                                            id="return-condition-image"
                                            label="Returned condition photo"
                                            description="Photo showing the asset condition at return."
                                            accept="image/jpeg,image/png,image/webp"
                                            value={field.value}
                                            disabled={isReturning}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
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

            {/* Global Assignment History Modal */}
            <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
                <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>All Assignment History</DialogTitle>
                        <DialogDescription>
                            View and manage assignment and return records for every asset.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                        <Input
                            value={historySearch}
                            onChange={(event) => setHistorySearch(event.target.value)}
                            placeholder="Search asset or employee..."
                            className="pl-10"
                        />
                    </div>

                    <div className="overflow-x-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Assignment period</TableHead>
                                    <TableHead>Return condition</TableHead>
                                    <TableHead>Evidence</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isHistoryLoading && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-neutral-500">
                                            Loading assignment history...
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!isHistoryLoading && assignmentHistory?.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-neutral-500">
                                            No assignment history found
                                        </TableCell>
                                    </TableRow>
                                )}
                                {assignmentHistory?.data.map((assignment) => (
                                    <TableRow key={assignment.id}>
                                        <TableCell>
                                            <div className="font-medium">{assignment.asset?.name || 'Deleted asset'}</div>
                                            <div className="text-xs text-neutral-500">{assignment.asset?.asset_code || `Asset #${assignment.asset_id}`}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">
                                                {assignment.employee
                                                    ? `${assignment.employee.first_name} ${assignment.employee.last_name}`
                                                    : 'Deleted employee'}
                                            </div>
                                            {assignment.employee?.employee_code && (
                                                <div className="text-xs text-neutral-500">{assignment.employee.employee_code}</div>
                                            )}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-sm">
                                            <div>{new Date(assignment.assigned_at).toLocaleString()}</div>
                                            <div className={assignment.returned_at ? 'text-neutral-500' : 'font-medium text-blue-700'}>
                                                {assignment.returned_at
                                                    ? `Returned ${new Date(assignment.returned_at).toLocaleString()}`
                                                    : 'Currently assigned'}
                                            </div>
                                        </TableCell>
                                        <TableCell>{assignment.return_condition || '—'}</TableCell>
                                        <TableCell>
                                            <div className="grid min-w-44 gap-1">
                                                {evidenceLink(assignment.assignment_document_url, 'Handover paper')}
                                                {evidenceLink(assignment.assignment_condition_image_url, 'Issue condition photo')}
                                                {evidenceLink(assignment.return_document_url, 'Return paper')}
                                                {evidenceLink(assignment.return_condition_image_url, 'Return condition photo')}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                disabled={isDeletingAssignment}
                                                onClick={() => handleDeleteAssignment(
                                                    assignment.asset_id,
                                                    assignment.id,
                                                    !assignment.returned_at,
                                                )}
                                                title="Delete assignment history"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {assignmentHistory && assignmentHistory.total > assignmentHistory.data.length && (
                        <p className="text-sm text-neutral-500">
                            Showing the latest {assignmentHistory.data.length} of {assignmentHistory.total} records.
                            Use search to find older records.
                        </p>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setHistoryModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Modal */}
            <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Asset Details</DialogTitle>
                    </DialogHeader>
                    {detailAsset && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-neutral-600">Asset Code</p>
                                    <p className="text-base">{detailAsset.asset_code}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-600">Name</p>
                                    <p className="text-base">{detailAsset.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-600">Category</p>
                                    <p className="text-base">{detailAsset.category}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-600">Condition</p>
                                    <p className="text-base">{detailAsset.condition}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-600">Status</p>
                                    <div>{getStatusBadge(detailAsset)}</div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-600">Value</p>
                                    <p className="text-base">${detailAsset.value}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-600">Company</p>
                                    <p className="text-base">{detailAsset.client?.company_name || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-600">Site</p>
                                    <p className="text-base">{detailAsset.site?.site_name || '—'}</p>
                                </div>
                            </div>
                            {detailAsset.current_assignment && (
                                <div className="border-t pt-4">
                                    <p className="font-medium mb-2">Current Assignment</p>
                                    <div className="bg-neutral-50 p-3 rounded">
                                        <p className="text-sm">
                                            Assigned to: {detailAsset.current_assignment.employee?.first_name} {detailAsset.current_assignment.employee?.last_name}
                                        </p>
                                        <p className="text-sm text-neutral-600">
                                            Since: {new Date(detailAsset.current_assignment.assigned_at).toLocaleDateString()}
                                        </p>
                                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                            {evidenceLink(detailAsset.current_assignment.assignment_document_url, 'View handover paper')}
                                            {evidenceLink(detailAsset.current_assignment.assignment_condition_image_url, 'View issue condition photo')}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {assetDetails?.assignments && assetDetails.assignments.length > 0 && (
                                <div className="border-t pt-4">
                                    <p className="font-medium mb-2">Assignment History</p>
                                    <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                                        {assetDetails.assignments.map((assignment) => (
                                            <div key={assignment.id} className="rounded-md border p-3 text-sm">
                                                <div className="flex flex-wrap justify-between gap-2">
                                                    <span className="font-medium">
                                                        {assignment.employee?.first_name} {assignment.employee?.last_name}
                                                    </span>
                                                    <span className="text-neutral-500">
                                                        {new Date(assignment.assigned_at).toLocaleDateString()}
                                                        {' → '}
                                                        {assignment.returned_at ? new Date(assignment.returned_at).toLocaleDateString() : 'Current'}
                                                    </span>
                                                </div>
                                                {assignment.return_condition && (
                                                    <p className="mt-1 text-neutral-600">Return condition: {assignment.return_condition}</p>
                                                )}
                                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                    {evidenceLink(assignment.assignment_document_url, 'Handover paper')}
                                                    {evidenceLink(assignment.assignment_condition_image_url, 'Issue condition photo')}
                                                    {evidenceLink(assignment.return_document_url, 'Return paper')}
                                                    {evidenceLink(assignment.return_condition_image_url, 'Return condition photo')}
                                                </div>
                                                <div className="mt-3 flex justify-end border-t pt-3">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        disabled={isDeletingAssignment}
                                                        onClick={() => handleDeleteAssignment(
                                                            assignment.asset_id,
                                                            assignment.id,
                                                            !assignment.returned_at,
                                                        )}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {isDeletingAssignment ? 'Deleting...' : 'Delete Assignment'}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
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
