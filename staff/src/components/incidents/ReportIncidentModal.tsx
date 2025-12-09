import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useReportIncident } from "@/services/useIncidents"
import { useClients } from "@/services/useClients" // We need sites, but currently getting them via Clients is the way or we need a useSites hook

import { Loader2, AlertTriangle } from "lucide-react"
import { useMemo } from "react"

const formSchema = z.object({
    client_id: z.string().min(1, "Client is required"), // Helper to filter sites
    site_id: z.string().min(1, "Site is required"),
    report_type: z.string().min(1, "Type is required"),
    severity_level: z.string().min(1, "Severity is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
})

interface ReportIncidentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ReportIncidentModal({ open, onOpenChange }: ReportIncidentModalProps) {
    const { mutate: reportIncident, isPending } = useReportIncident()
    const { data: clients, isLoading: clientsLoading } = useClients({ page: 1, per_page: 100 })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            client_id: "",
            site_id: "",
            report_type: "INCIDENT",
            severity_level: "LOW",
            description: "",
        }
    })

    const selectedClientId = form.watch("client_id")

    // Derive sites from selected client
    const sites = useMemo(() => {
        if (!clients?.data || !selectedClientId) return []
        const client = clients.data.find((c: any) => c.id.toString() === selectedClientId)
        return client?.sites || []
    }, [clients, selectedClientId])

    function onSubmit(values: z.infer<typeof formSchema>) {
        reportIncident({
            site_id: parseInt(values.site_id),
            report_type: values.report_type,
            severity_level: values.severity_level,
            description: values.description,
        }, {
            onSuccess: () => {
                onOpenChange(false)
                form.reset()
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Report Incident
                    </DialogTitle>
                    <DialogDescription>
                        Submit a new operational report or incident.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        {/* Client Selection (Helper) */}
                        <FormField
                            control={form.control}
                            name="client_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client</FormLabel>
                                    <Select onValueChange={(val) => {
                                        field.onChange(val)
                                        form.setValue("site_id", "") // Reset site when client changes
                                    }} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select client" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {clientsLoading ? (
                                                <div className="p-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                                            ) : (
                                                clients?.data?.map((client: any) => (
                                                    <SelectItem key={client.id} value={client.id.toString()}>
                                                        {client.company_name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Site Selection */}
                        <FormField
                            control={form.control}
                            name="site_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Site</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedClientId}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={selectedClientId ? "Select site" : "Select client first"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {sites.map((site: any) => (
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="report_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="INCIDENT">Incident</SelectItem>
                                                <SelectItem value="OBSERVATION">Observation</SelectItem>
                                                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                                <SelectItem value="PANIC">Panic/Emergency</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="severity_level"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Severity</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select severity" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="LOW">Low</SelectItem>
                                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                                <SelectItem value="HIGH">High</SelectItem>
                                                <SelectItem value="CRITICAL">Critical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <textarea
                                            placeholder="Describe what happened..."
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending} className="bg-red-600 hover:bg-red-700">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Report
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
