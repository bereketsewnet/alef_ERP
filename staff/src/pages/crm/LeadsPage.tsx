import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { useCrmLeads, useCreateCrmLead, useUpdateCrmLead, useDeleteCrmLead, useCrmLead, useAddCrmActivity } from "@/services/useCrm"
import { Plus, Loader2, PhoneCall, Mail, MessageCircle, CalendarDays, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const leadSchema = z.object({
    company_name: z.string().min(2, "Company name is required"),
    contact_person: z.string().optional(),
    contact_phone: z.string().optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    source: z.string().optional(),
    expected_value: z.string().optional(),
    probability: z.string().optional(),
    notes: z.string().optional(),
})

const activitySchema = z.object({
    type: z.string().min(1, "Type is required"),
    subject: z.string().optional(),
    description: z.string().optional(),
    due_at: z.string().optional(),
})

const stageLabels: Record<string, string> = {
    REACH: "Reach",
    QUALIFIED: "Qualified",
    PROPOSAL: "Proposal",
    NEGOTIATION: "Negotiation",
    CLOSED_WON: "Closed Won",
    CLOSED_LOST: "Closed Lost",
}

const stageOrder = ["REACH", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"]

export function LeadsPage() {
    const [stageFilter, setStageFilter] = useState<string | undefined>(undefined)
    const [search, setSearch] = useState("")
    const [page] = useState(1)
    const [leadModalOpen, setLeadModalOpen] = useState(false)
    const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
    const [activityModalOpen, setActivityModalOpen] = useState(false)

    const params: any = { page }
    if (stageFilter) params.stage = stageFilter
    if (search) params.search = search

    const { data: leadsData, isLoading } = useCrmLeads(params)
    const { data: selectedLead } = useCrmLead(selectedLeadId || 0)
    const { mutate: createLead, isPending: isCreating } = useCreateCrmLead()
    const { mutate: updateLead, isPending: isUpdating } = useUpdateCrmLead()
    const { mutate: deleteLead } = useDeleteCrmLead()
    const { mutate: addActivity, isPending: isAddingActivity } = useAddCrmActivity()

    const leadForm = useForm<z.infer<typeof leadSchema>>({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            company_name: "",
            contact_person: "",
            contact_phone: "",
            email: "",
            source: "",
            expected_value: "",
            probability: "",
            notes: "",
        },
    })

    const activityForm = useForm<z.infer<typeof activitySchema>>({
        resolver: zodResolver(activitySchema),
        defaultValues: {
            type: "NOTE",
            subject: "",
            description: "",
            due_at: "",
        },
    })

    const handleOpenNewLead = () => {
        setSelectedLeadId(null)
        leadForm.reset()
        setLeadModalOpen(true)
    }

    const handleEditLead = (lead: any) => {
        setSelectedLeadId(lead.id)
        leadForm.reset({
            company_name: lead.company_name || "",
            contact_person: lead.contact_person || "",
            contact_phone: lead.contact_phone || "",
            email: lead.email || "",
            source: lead.source || "",
            expected_value: lead.expected_value != null ? String(lead.expected_value) : "",
            probability: lead.probability != null ? String(lead.probability) : "",
            notes: lead.notes || "",
        })
        setLeadModalOpen(true)
    }

    const handleSubmitLead = (values: z.infer<typeof leadSchema>) => {
        const payload: any = {
            company_name: values.company_name,
            contact_person: values.contact_person || undefined,
            contact_phone: values.contact_phone || undefined,
            source: values.source || undefined,
            notes: values.notes || undefined,
        }
        if (values.email && values.email.trim()) {
            payload.email = values.email.trim()
        }
        if (values.expected_value && !isNaN(Number(values.expected_value))) {
            payload.expected_value = Number(values.expected_value)
        }
        if (values.probability && !isNaN(Number(values.probability))) {
            payload.probability = Number(values.probability)
        }

        if (selectedLeadId) {
            updateLead(
                { id: selectedLeadId, data: payload },
                {
                    onSuccess: () => {
                        setLeadModalOpen(false)
                    },
                }
            )
        } else {
            createLead(payload, {
                onSuccess: () => {
                    setLeadModalOpen(false)
                    leadForm.reset()
                },
            })
        }
    }

    const handleDeleteLead = (leadId: number) => {
        deleteLead(leadId)
    }

    const handleOpenActivityModal = (leadId: number) => {
        setSelectedLeadId(leadId)
        activityForm.reset({
            type: "NOTE",
            subject: "",
            description: "",
            due_at: "",
        })
        setActivityModalOpen(true)
    }

    const handleSubmitActivity = (values: z.infer<typeof activitySchema>) => {
        if (!selectedLeadId) return
        const payload: any = {
            type: values.type,
            subject: values.subject || undefined,
            description: values.description || undefined,
        }
        if (values.due_at) {
            payload.due_at = values.due_at
        }

        addActivity(
            { leadId: selectedLeadId, data: payload },
            {
                onSuccess: () => {
                    activityForm.reset()
                    setActivityModalOpen(false)
                },
            }
        )
    }

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "company_name",
            header: "Company",
        },
        {
            accessorKey: "contact_person",
            header: "Contact",
        },
        {
            accessorKey: "contact_phone",
            header: "Phone",
        },
        {
            accessorKey: "stage",
            header: "Stage",
            cell: ({ row }) => {
                const stage = row.original.stage as string
                const label = stageLabels[stage] || stage
                const color =
                    stage === "CLOSED_WON"
                        ? "bg-green-100 text-green-700"
                        : stage === "CLOSED_LOST"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-50 text-blue-700"
                return <Badge className={color}>{label}</Badge>
            },
        },
        {
            accessorKey: "expected_value",
            header: "Expected (ETB)",
            cell: ({ row }) => {
                const v = row.original.expected_value
                return v != null ? Number(v).toLocaleString() : "-"
            },
        },
        {
            accessorKey: "next_action_date",
            header: "Next Action",
            cell: ({ row }) => {
                const d = row.original.next_action_date
                const note = row.original.next_action_note
                if (!d && !note) return "-"
                return (
                    <div className="text-xs">
                        {d && <div>{new Date(d).toLocaleDateString()}</div>}
                        {note && <div className="text-neutral-500">{note}</div>}
                    </div>
                )
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const lead = row.original
                return (
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenActivityModal(lead.id)}>
                            <CalendarDays className="h-3 w-3 mr-1" /> Follow-up
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditLead(lead)}>
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteLead(lead.id)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">CRM Leads</h1>
                    <p className="text-neutral-600 mt-1">
                        Track clients from reach to closing and manage follow-ups.
                    </p>
                </div>
                <Button className="bg-primary-600 hover:bg-primary-700" onClick={handleOpenNewLead}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Lead
                </Button>
            </div>

            <Card>
                <CardContent className="pt-4 space-y-4">
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                            {stageOrder.map((stage) => (
                                <Button
                                    key={stage}
                                    variant={stageFilter === stage ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setStageFilter(stageFilter === stage ? undefined : stage)}
                                >
                                    {stageLabels[stage]}
                                </Button>
                            ))}
                        </div>
                        <div className="w-64">
                            <Input
                                placeholder="Search leads..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                        </div>
                    ) : (
                        <DataTable columns={columns} data={leadsData?.data || []} />
                    )}
                </CardContent>
            </Card>

            {/* Lead modal */}
            <Dialog open={leadModalOpen} onOpenChange={setLeadModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{selectedLeadId ? "Edit Lead" : "New Lead"}</DialogTitle>
                        <DialogDescription>Capture basic details about the potential client.</DialogDescription>
                    </DialogHeader>
                    <Form {...leadForm}>
                        <form onSubmit={leadForm.handleSubmit(handleSubmitLead)} className="space-y-4">
                            <FormField
                                control={leadForm.control}
                                name="company_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Name *</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={leadForm.control}
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
                                    control={leadForm.control}
                                    name="contact_phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={leadForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={leadForm.control}
                                name="source"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Source</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Referral, LinkedIn, Website, etc." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={leadForm.control}
                                    name="expected_value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expected Value (ETB)</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={leadForm.control}
                                    name="probability"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Probability (%)</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={leadForm.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Textarea rows={3} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setLeadModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isCreating || isUpdating}>
                                    {(isCreating || isUpdating) && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {selectedLeadId ? "Save Changes" : "Create Lead"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Activity modal */}
            <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>New Activity</DialogTitle>
                        <DialogDescription>
                            Log a call, email, meeting or note and optionally schedule a follow-up date.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...activityForm}>
                        <form onSubmit={activityForm.handleSubmit(handleSubmitActivity)} className="space-y-4">
                            <FormField
                                control={activityForm.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="CALL, EMAIL, MEETING, NOTE, TASK" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={activityForm.control}
                                name="subject"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Subject</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={activityForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea rows={3} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={activityForm.control}
                                name="due_at"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Next Action Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setActivityModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isAddingActivity}>
                                    {isAddingActivity && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Activity
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

