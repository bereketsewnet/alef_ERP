import { useState, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Search, Plus, MapPin, ChevronLeft, ChevronRight, Building2, Eye, ChevronDown, ChevronUp, Trash2, Pencil } from "lucide-react"
import { useClients, useCreateClient, useCreateSite, useDeleteClient, useDeleteSite, useSiteStaffOptions, useUpdateClient, useUpdateSite } from "@/services/useClients"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { SiteDetailsModal } from "@/components/sites/SiteDetailsModal"
import { SiteSupervisorsField } from "@/components/sites/SiteSupervisorsField"

const clientSchema = z.object({
    company_name: z.string().min(2, 'Company name is required'),
    contact_person: z.string().min(2, 'Contact person is required'),
    contact_phone: z.string().min(10, 'Valid phone number required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    billing_cycle: z.string().optional(),
    payment_due_day: z.string().optional(),
    payment_grace_days: z.string().optional(),
    late_penalty_type: z.enum(['', 'FIXED', 'PERCENTAGE']),
    late_penalty_value: z.string().optional(),
    late_penalty_recurring: z.boolean(),
    tin_number: z.string().optional(),
    description: z.string().max(5000, 'Description is too long').optional(),
})

const siteSchema = z.object({
    site_name: z.string().min(2, 'Site name is required'),
    latitude: z.string().min(1, 'Latitude is required'),
    longitude: z.string().min(1, 'Longitude is required'),
    geo_radius_meters: z.string().optional(),
    site_contact_phone: z.string().optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    supervisor_user_ids: z.array(z.number()),
    description: z.string().max(5000, 'Description is too long').optional(),
})

export function ClientListPage() {
    const [page, setPage] = useState(1)
    const [searchParams] = useSearchParams()
    const initialSearch = searchParams.get('search') || ''
    const [search, setSearch] = useState(initialSearch)
    const [clientModalOpen, setClientModalOpen] = useState(false)
    const [siteModalOpen, setSiteModalOpen] = useState(false)
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
    const [expandedClientIds, setExpandedClientIds] = useState<Set<number>>(new Set())
    const [siteToView, setSiteToView] = useState<any | null>(null)
    const [clientToDelete, setClientToDelete] = useState<{ id: number; name: string } | null>(null)
    const [siteToDelete, setSiteToDelete] = useState<{ id: number; name: string; clientId: number } | null>(null)
    const [editingClient, setEditingClient] = useState<any | null>(null)
    const [editingSite, setEditingSite] = useState<any | null>(null)

    const { data, isLoading, error } = useClients({ page })
    const { data: fieldStaffUsers = [] } = useSiteStaffOptions()
    const { mutate: createClient, isPending: isCreating } = useCreateClient()
    const { mutate: createSite, isPending: isCreatingSite } = useCreateSite()
    const { mutate: updateClient, isPending: isUpdatingClient } = useUpdateClient()
    const { mutate: updateSite, isPending: isUpdatingSite } = useUpdateSite()
    const { mutate: deleteClient } = useDeleteClient()
    const { mutate: deleteSite } = useDeleteSite()

    const clientForm = useForm({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            company_name: '',
            contact_person: '',
            contact_phone: '',
            email: '',
            billing_cycle: '',
            payment_due_day: '',
            payment_grace_days: '0',
            late_penalty_type: '' as const,
            late_penalty_value: '',
            late_penalty_recurring: false,
            tin_number: '',
            description: '',
        },
    })

    const siteForm = useForm({
        resolver: zodResolver(siteSchema),
        defaultValues: {
            site_name: '',
            latitude: '',
            longitude: '',
            geo_radius_meters: '100',
            site_contact_phone: '',
            email: '',
            supervisor_user_ids: [],
            description: '',
        },
    })

    const handleCreateClient = (values: z.infer<typeof clientSchema>) => {
        // Remove empty optional fields to prevent validation errors
        const cleanedData: any = {
            company_name: values.company_name,
            contact_person: values.contact_person,
            contact_phone: values.contact_phone,
        }

        cleanedData.email = values.email?.trim() || null
        cleanedData.billing_cycle = values.billing_cycle?.trim() || null
        cleanedData.payment_due_day = values.payment_due_day ? Number(values.payment_due_day) : null
        cleanedData.payment_grace_days = values.payment_grace_days ? Number(values.payment_grace_days) : 0
        cleanedData.late_penalty_type = values.late_penalty_type || null
        cleanedData.late_penalty_value = values.late_penalty_value ? Number(values.late_penalty_value) : null
        cleanedData.late_penalty_recurring = values.late_penalty_recurring
        cleanedData.tin_number = values.tin_number?.trim() || null

        cleanedData.description = values.description?.trim() || null

        const onSuccess = () => {
            setClientModalOpen(false)
            setEditingClient(null)
            clientForm.reset()
        }
        if (editingClient) {
            updateClient({ id: editingClient.id, data: cleanedData }, { onSuccess })
            return
        }
        createClient(cleanedData, {
            onSuccess: () => {
                onSuccess()
            },
        })
    }

    const handleCreateSite = (values: z.infer<typeof siteSchema>) => {
        if (!selectedClientId) return

        const siteData: any = {
            site_name: values.site_name,
            description: values.description?.trim() || null,
            latitude: parseFloat(values.latitude),
            longitude: parseFloat(values.longitude),
            geo_radius_meters: values.geo_radius_meters ? parseInt(values.geo_radius_meters) : 100,
            site_contact_phone: values.site_contact_phone,
            email: values.email?.trim() || null,
            supervisor_user_ids: values.supervisor_user_ids,
        }
        const onSuccess = () => {
            setSiteModalOpen(false)
            setEditingSite(null)
            siteForm.reset()
            setSelectedClientId(null)
        }
        if (editingSite) {
            updateSite({ clientId: selectedClientId, siteId: editingSite.id, data: siteData }, { onSuccess })
            return
        }
        createSite({
            clientId: selectedClientId,
            data: siteData,
        }, {
            onSuccess,
        })
    }

    const handleAddSite = (clientId: number) => {
        setEditingSite(null)
        siteForm.reset()
        setSelectedClientId(clientId)
        setSiteModalOpen(true)
    }

    const handleEditClient = (client: any) => {
        setEditingClient(client)
        clientForm.reset({
            company_name: client.company_name || '', contact_person: client.contact_person || '',
            contact_phone: client.contact_phone || '', email: client.email || '',
            billing_cycle: client.billing_cycle || '', tin_number: client.tin_number || '',
            payment_due_day: client.payment_due_day ? String(client.payment_due_day) : '',
            payment_grace_days: String(client.payment_grace_days ?? 0),
            late_penalty_type: client.late_penalty_type || '',
            late_penalty_value: client.late_penalty_value != null ? String(client.late_penalty_value) : '',
            late_penalty_recurring: Boolean(client.late_penalty_recurring),
            description: client.description || '',
        })
        setClientModalOpen(true)
    }

    const handleEditSite = (site: any) => {
        setEditingSite(site)
        setSelectedClientId(site.client_id)
        siteForm.reset({
            site_name: site.site_name || '', description: site.description || '',
            latitude: String(site.latitude ?? ''), longitude: String(site.longitude ?? ''),
            geo_radius_meters: String(site.geo_radius_meters ?? 100),
            site_contact_phone: site.site_contact_phone || '', email: site.email || '',
            supervisor_user_ids: (site.supervisors || []).map((user: any) => user.id),
        })
        setSiteModalOpen(true)
    }

    const toggleClientExpansion = (clientId: number) => {
        setExpandedClientIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(clientId)) {
                newSet.delete(clientId)
            } else {
                newSet.add(clientId)
            }
            return newSet
        })
    }

    const handleConfirmDeleteClient = () => {
        if (!clientToDelete) return

        // Extra browser security confirmation
        const confirmed = window.confirm(
            `This will permanently delete client "${clientToDelete.name}" and ALL related data:\n\n` +
            `• All sites under this client\n` +
            `• All shift schedules and attendance logs for those sites\n` +
            `• Any site job requirements and operational reports\n\n` +
            `This action cannot be undone. Are you absolutely sure?`
        )
        if (!confirmed) {
            return
        }

        deleteClient(clientToDelete.id, {
            onSuccess: () => setClientToDelete(null),
        })
    }

    const handleConfirmDeleteSite = () => {
        if (!siteToDelete) return

        // Extra browser security confirmation
        const confirmed = window.confirm(
            `This will permanently delete site "${siteToDelete.name}" and related data:\n\n` +
            `• Shift schedules and attendance logs associated with this site\n` +
            `• Any job requirements assigned to this site\n\n` +
            `This action cannot be undone. Are you absolutely sure?`
        )
        if (!confirmed) {
            return
        }

        deleteSite(
            { clientId: siteToDelete.clientId, siteId: siteToDelete.id },
            { onSuccess: () => setSiteToDelete(null) }
        )
    }

    // Calculate totals
    const totalClients = data?.total || 0
    const totalSites = data?.data.reduce((acc, client) => acc + (client.sites?.length || 0), 0) || 0
    const avgSites = totalClients > 0 ? (totalSites / totalClients).toFixed(1) : '0'

    // Filter clients by search (company, contact, phone, or any site name)
    const filteredClients = data?.data.filter(client => {
        if (!search) return true
        const searchLower = search.toLowerCase()
        const matchesClient =
            client.company_name.toLowerCase().includes(searchLower) ||
            client.contact_person.toLowerCase().includes(searchLower) ||
            client.contact_phone.includes(search)
        const matchesSite = (client.sites || []).some(site =>
            site.site_name.toLowerCase().includes(searchLower)
        )
        return matchesClient || matchesSite
    }) || []

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                        Clients & Sites
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        Manage your clients and their site locations
                    </p>
                </div>
                <Button onClick={() => { setEditingClient(null); clientForm.reset(); setClientModalOpen(true) }} className="bg-primary-600 hover:bg-primary-700 shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                </Button>
            </div>

            {/* Dashboard Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Building2 className="h-8 w-8 text-primary-600" />
                            <div>
                                <p className="text-sm font-medium text-neutral-600">
                                    Total Clients
                                </p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {totalClients}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <MapPin className="h-8 w-8 text-green-600" />
                            <div>
                                <p className="text-sm font-medium text-neutral-600">
                                    Total Sites
                                </p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {totalSites}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <MapPin className="h-8 w-8 text-blue-600" />
                            <div>
                                <p className="text-sm font-medium text-neutral-600">
                                    Average Sites/Client
                                </p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {avgSites}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                <Input
                    type="search"
                    placeholder="Search by company name, contact person, or phone..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company Name</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Sites</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                                    Loading clients...
                                </TableCell>
                            </TableRow>
                        )}

                        {error && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-red-600">
                                    Error loading clients
                                </TableCell>
                            </TableRow>
                        )}

                        {filteredClients.length === 0 && !isLoading && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                                    No clients found
                                </TableCell>
                            </TableRow>
                        )}

                        {filteredClients.map((client) => (
                            <Fragment key={client.id}>
                                <TableRow className="cursor-pointer hover:bg-neutral-50" onClick={() => toggleClientExpansion(client.id)}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {expandedClientIds.has(client.id) ? (
                                                <ChevronUp className="h-4 w-4 text-neutral-500" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 text-neutral-500" />
                                            )}
                                            <div>
                                                <div>{client.company_name}</div>
                                                {client.description && <div className="max-w-sm truncate text-xs font-normal text-neutral-500">{client.description}</div>}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{client.contact_person}</TableCell>
                                    <TableCell>{client.contact_phone}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4 text-neutral-500" />
                                            <span>{client.sites?.length || 0}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="success">Active</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); handleEditClient(client) }}
                                            >
                                                <Pencil className="h-4 w-4 mr-1" /> Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); handleAddSite(client.id); }}
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Site
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setClientToDelete({ id: client.id, name: client.company_name })
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                {expandedClientIds.has(client.id) && client.sites?.map((site: any) => (
                                    <TableRow key={site.id} className="bg-neutral-50">
                                        <TableCell colSpan={4} className="pl-10">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <MapPin className="h-4 w-4 text-green-500" />
                                                <span className="font-medium">{site.site_name}</span>
                                                <span className="text-xs text-neutral-500">
                                                    ({Number(site.latitude).toFixed(4)}, {Number(site.longitude).toFixed(4)})
                                                </span>
                                                <Badge variant="outline">{site.supervisors?.length || 0} field staff</Badge>
                                                {site.description && <span className="w-full truncate pl-6 text-xs text-neutral-500">{site.description}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditSite(site)}
                                                >
                                                    <Pencil className="h-4 w-4 mr-1" /> Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSiteToView(site)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View Site
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600"
                                                    onClick={() =>
                                                        setSiteToDelete({
                                                            id: site.id,
                                                            name: site.site_name,
                                                            clientId: site.client_id,
                                                        })
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data && data.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="text-sm text-neutral-500">
                        Showing {data.from} to {data.to} of {data.total} results
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={!data.prev_page_url}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <div className="flex items-center gap-2 px-3">
                            <span className="text-sm">
                                Page {data.current_page} of {data.last_page}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={!data.next_page_url}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Add Client Modal */}
            <Dialog open={clientModalOpen} onOpenChange={(open) => { setClientModalOpen(open); if (!open) setEditingClient(null) }}>
                <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                        <DialogDescription>
                            Enter the client details below
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...clientForm}>
                        <form onSubmit={clientForm.handleSubmit(handleCreateClient)} className="space-y-4">
                            <FormField
                                control={clientForm.control}
                                name="company_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={clientForm.control}
                                name="contact_person"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Person</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={clientForm.control}
                                name="contact_phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Phone</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="+251911234567" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={clientForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email (Optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="email" placeholder="client@example.com" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={clientForm.control}
                                name="billing_cycle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Billing Cycle (Optional)</FormLabel>
                                        <FormControl>
                                            <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                                <option value="">Select billing cycle...</option>
                                                <option value="monthly">Monthly</option>
                                                <option value="quarterly">Quarterly</option>
                                                <option value="annually">Annually</option>
                                                <option value="custom">Custom</option>
                                            </select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="rounded-md border p-4 space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium">Payment Due & Late Penalty</h3>
                                    <p className="text-xs text-neutral-500">Set the monthly payment day, grace period, and overdue charge.</p>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <FormField control={clientForm.control} name="payment_due_day" render={({ field }) => (
                                        <FormItem><FormLabel>Payment Day (1–31)</FormLabel><FormControl><Input {...field} type="number" min="1" max="31" placeholder="23" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={clientForm.control} name="payment_grace_days" render={({ field }) => (
                                        <FormItem><FormLabel>Grace Days</FormLabel><FormControl><Input {...field} type="number" min="0" placeholder="2" /></FormControl><p className="text-xs text-neutral-500">Days allowed after the due date before penalty starts.</p><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <FormField control={clientForm.control} name="late_penalty_type" render={({ field }) => (
                                        <FormItem><FormLabel>Late Penalty Type</FormLabel><FormControl><select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">No penalty</option><option value="FIXED">Fixed amount (ETB)</option><option value="PERCENTAGE">Percentage (%)</option></select></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={clientForm.control} name="late_penalty_value" render={({ field }) => (
                                        <FormItem><FormLabel>{clientForm.watch('late_penalty_type') === 'PERCENTAGE' ? 'Penalty Percentage' : 'Penalty Amount (ETB)'}</FormLabel><FormControl><Input {...field} type="number" min="0" step="0.01" disabled={!clientForm.watch('late_penalty_type')} placeholder={clientForm.watch('late_penalty_type') === 'PERCENTAGE' ? '10' : '500'} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField control={clientForm.control} name="late_penalty_recurring" render={({ field }) => (
                                    <FormItem className="flex items-start gap-3 rounded-md bg-neutral-50 p-3"><FormControl><input type="checkbox" className="mt-1 h-4 w-4" checked={field.value} onChange={field.onChange} disabled={!clientForm.watch('late_penalty_type')} /></FormControl><div><FormLabel>Apply again for every overdue month</FormLabel><p className="text-xs text-neutral-500">Example: 10% becomes 20% after two overdue months. Turn off to charge only once.</p></div></FormItem>
                                )} />
                            </div>
                            <FormField
                                control={clientForm.control}
                                name="tin_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>TIN Number (Optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g., 0123456789" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={clientForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description (Optional)</FormLabel>
                                        <FormControl><Textarea {...field} rows={4} placeholder="Describe this client, their business, services, or important notes..." /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setClientModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isCreating || isUpdatingClient}>
                                    {(isCreating || isUpdatingClient) ? 'Saving...' : (editingClient ? 'Save Changes' : 'Create Client')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Add Site Modal */}
            <Dialog open={siteModalOpen} onOpenChange={(open) => { setSiteModalOpen(open); if (!open) setEditingSite(null) }}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingSite ? 'Edit Site' : 'Add New Site'}</DialogTitle>
                        <DialogDescription>
                            Enter the site details and GPS coordinates
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...siteForm}>
                        <form onSubmit={siteForm.handleSubmit(handleCreateSite)} className="space-y-4">
                            <FormField
                                control={siteForm.control}
                                name="site_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Site Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={siteForm.control}
                                    name="latitude"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Latitude</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="9.0320" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={siteForm.control}
                                    name="longitude"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Longitude</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="38.7469" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={siteForm.control}
                                name="geo_radius_meters"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>GPS Radius (meters)</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" placeholder="7200" />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">Clock-in allowed within this distance from site. e.g. 7200 = 7.2 km</p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={siteForm.control}
                                name="site_contact_phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Site Contact Phone (Optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="+251911234567" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={siteForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email (Optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="email" placeholder="site@example.com" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={siteForm.control}
                                name="supervisor_user_ids"
                                render={({ field }) => (
                                    <FormItem>
                                        <SiteSupervisorsField users={fieldStaffUsers} value={field.value || []} onChange={field.onChange} disabled={isCreatingSite || isUpdatingSite} />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={siteForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description (Optional)</FormLabel>
                                        <FormControl><Textarea {...field} rows={4} placeholder="Describe this site, access instructions, or important operational notes..." /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setSiteModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isCreatingSite || isUpdatingSite}>
                                    {(isCreatingSite || isUpdatingSite) ? 'Saving...' : (editingSite ? 'Save Changes' : 'Create Site')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Site Details Modal */}
            <SiteDetailsModal
                open={!!siteToView}
                onClose={() => setSiteToView(null)}
                site={siteToView}
            />

            <ConfirmDialog
                open={!!clientToDelete}
                onOpenChange={(open) => {
                    if (!open) setClientToDelete(null)
                }}
                title="Delete Client"
                description={`This will delete client "${clientToDelete?.name}" and all of its sites, including related shifts, attendance logs, and site job requirements. This action cannot be undone.`}
                onConfirm={handleConfirmDeleteClient}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />

            <ConfirmDialog
                open={!!siteToDelete}
                onOpenChange={(open) => {
                    if (!open) setSiteToDelete(null)
                }}
                title="Delete Site"
                description={`This will delete site "${siteToDelete?.name}" and its related shifts, attendance logs, and job requirements. This action cannot be undone.`}
                onConfirm={handleConfirmDeleteSite}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />
        </div>
    )
}
