import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Search, Plus, MapPin, ChevronLeft, ChevronRight, Building2 } from "lucide-react"
import { useClients, useCreateClient, useCreateSite, useDeleteClient } from "@/services/useClients"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const clientSchema = z.object({
    company_name: z.string().min(2, 'Company name is required'),
    contact_person: z.string().min(2, 'Contact person is required'),
    contact_phone: z.string().min(10, 'Valid phone number required'),
    billing_cycle: z.string().optional(),
    tin_number: z.string().optional(),
})

const siteSchema = z.object({
    site_name: z.string().min(2, 'Site name is required'),
    latitude: z.string().min(1, 'Latitude is required'),
    longitude: z.string().min(1, 'Longitude is required'),
    geo_radius_meters: z.string().optional(),
    site_contact_phone: z.string().optional(),
})

export function ClientListPage() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [clientModalOpen, setClientModalOpen] = useState(false)
    const [siteModalOpen, setSiteModalOpen] = useState(false)
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null)

    const { data, isLoading, error } = useClients(page)
    const { mutate: createClient, isPending: isCreating } = useCreateClient()
    const { mutate: createSite, isPending: isCreatingSite } = useCreateSite()
    const { mutate: deleteClient } = useDeleteClient()

    const clientForm = useForm({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            company_name: '',
            contact_person: '',
            contact_phone: '',
            billing_cycle: '',
            tin_number: '',
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
        },
    })

    const handleCreateClient = (values: z.infer<typeof clientSchema>) => {
        // Remove empty optional fields to prevent validation errors
        const cleanedData: any = {
            company_name: values.company_name,
            contact_person: values.contact_person,
            contact_phone: values.contact_phone,
        }

        if (values.billing_cycle && values.billing_cycle.trim()) {
            cleanedData.billing_cycle = values.billing_cycle
        }
        if (values.tin_number && values.tin_number.trim()) {
            cleanedData.tin_number = values.tin_number
        }

        createClient(cleanedData, {
            onSuccess: () => {
                setClientModalOpen(false)
                clientForm.reset()
            },
        })
    }

    const handleCreateSite = (values: z.infer<typeof siteSchema>) => {
        if (!selectedClientId) return

        createSite({
            clientId: selectedClientId,
            data: {
                site_name: values.site_name,
                latitude: parseFloat(values.latitude),
                longitude: parseFloat(values.longitude),
                geo_radius_meters: values.geo_radius_meters ? parseInt(values.geo_radius_meters) : 100,
                site_contact_phone: values.site_contact_phone,
            },
        }, {
            onSuccess: () => {
                setSiteModalOpen(false)
                siteForm.reset()
                setSelectedClientId(null)
            },
        })
    }

    const handleAddSite = (clientId: number) => {
        setSelectedClientId(clientId)
        setSiteModalOpen(true)
    }

    // Calculate totals
    const totalClients = data?.total || 0
    const totalSites = data?.data.reduce((acc, client) => acc + (client.sites?.length || 0), 0) || 0
    const avgSites = totalClients > 0 ? (totalSites / totalClients).toFixed(1) : '0'

    // Filter clients by search
    const filteredClients = data?.data.filter(client =>
        client.company_name.toLowerCase().includes(search.toLowerCase()) ||
        client.contact_person.toLowerCase().includes(search.toLowerCase()) ||
        client.contact_phone.includes(search)
    ) || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">
                        Clients & Sites
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        Manage your clients and their site locations
                    </p>
                </div>
                <Button onClick={() => setClientModalOpen(true)} className="bg-primary-600 hover:bg-primary-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                </Button>
            </div>

            {/* Dashboard Cards */}
            <div className="grid gap-4 md:grid-cols-3">
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
            <div className="border rounded-lg">
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
                            <TableRow key={client.id}>
                                <TableCell className="font-medium">
                                    {client.company_name}
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
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAddSite(client.id)}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Site
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data && data.last_page > 1 && (
                <div className="flex items-center justify-between">
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
            <Dialog open={clientModalOpen} onOpenChange={setClientModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Client</DialogTitle>
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
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setClientModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isCreating}>
                                    {isCreating ? 'Creating...' : 'Create Client'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Add Site Modal */}
            <Dialog open={siteModalOpen} onOpenChange={setSiteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Site</DialogTitle>
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
                                            <Input {...field} type="number" placeholder="100" />
                                        </FormControl>
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
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setSiteModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isCreatingSite}>
                                    {isCreatingSite ? 'Creating...' : 'Create Site'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
