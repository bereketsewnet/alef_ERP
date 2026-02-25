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
import { useBids, useCreateBid, useUpdateBid, useDeleteBid } from "@/services/useCrm"
import type { BidStatus } from "@/api/endpoints/crm"
import { Plus, Loader2, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const bidSchema = z.object({
    title: z.string().min(2, "Title is required"),
    reference_number: z.string().optional(),
    issuer: z.string().optional(),
    submission_deadline: z.string().optional(),
    estimated_value: z.string().optional(),
    submitted_value: z.string().optional(),
    submitted_at: z.string().optional(),
    result_date: z.string().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
})

const statusLabels: Record<BidStatus, string> = {
    POTENTIAL: "Potential (Can Involve)",
    APPLIED: "Applied",
    WON: "Won",
    LOST: "Lost",
    NOT_ELIGIBLE: "Not Eligible",
}

const statusOrder: BidStatus[] = ["POTENTIAL", "APPLIED", "WON", "LOST", "NOT_ELIGIBLE"]

export function BidsPage() {
    const [statusFilter, setStatusFilter] = useState<BidStatus | undefined>("POTENTIAL")
    const [search, setSearch] = useState("")
    const [page] = useState(1)
    const [bidModalOpen, setBidModalOpen] = useState(false)
    const [selectedBidId, setSelectedBidId] = useState<number | null>(null)

    const params: any = { page }
    if (statusFilter) params.status = statusFilter
    if (search) params.search = search

    const { data: bidsData, isLoading } = useBids(params)
    const { mutate: createBid, isPending: isCreating } = useCreateBid()
    const { mutate: updateBid, isPending: isUpdating } = useUpdateBid()
    const { mutate: deleteBid } = useDeleteBid()

    const bidForm = useForm<z.infer<typeof bidSchema>>({
        resolver: zodResolver(bidSchema),
        defaultValues: {
            title: "",
            reference_number: "",
            issuer: "",
            submission_deadline: "",
            estimated_value: "",
            submitted_value: "",
            submitted_at: "",
            result_date: "",
            status: "POTENTIAL",
            notes: "",
        },
    })

    const handleOpenNewBid = () => {
        setSelectedBidId(null)
        bidForm.reset({
            title: "",
            reference_number: "",
            issuer: "",
            submission_deadline: "",
            estimated_value: "",
            submitted_value: "",
            submitted_at: "",
            result_date: "",
            status: statusFilter || "POTENTIAL",
            notes: "",
        })
        setBidModalOpen(true)
    }

    const handleEditBid = (bid: any) => {
        setSelectedBidId(bid.id)
        bidForm.reset({
            title: bid.title || "",
            reference_number: bid.reference_number || "",
            issuer: bid.issuer || "",
            submission_deadline: bid.submission_deadline || "",
            estimated_value: bid.estimated_value != null ? String(bid.estimated_value) : "",
            submitted_value: bid.submitted_value != null ? String(bid.submitted_value) : "",
            submitted_at: bid.submitted_at || "",
            result_date: bid.result_date || "",
            status: bid.status || "POTENTIAL",
            notes: bid.notes || "",
        })
        setBidModalOpen(true)
    }

    const handleSubmitBid = (values: z.infer<typeof bidSchema>) => {
        const payload: any = {
            title: values.title,
            reference_number: values.reference_number || undefined,
            issuer: values.issuer || undefined,
            submission_deadline: values.submission_deadline || undefined,
            submitted_at: values.submitted_at || undefined,
            result_date: values.result_date || undefined,
            status: (values.status || "POTENTIAL") as BidStatus,
            notes: values.notes || undefined,
        }
        if (values.estimated_value && !isNaN(Number(values.estimated_value))) {
            payload.estimated_value = Number(values.estimated_value)
        }
        if (values.submitted_value && !isNaN(Number(values.submitted_value))) {
            payload.submitted_value = Number(values.submitted_value)
        }

        if (selectedBidId) {
            updateBid(
                { id: selectedBidId, data: payload },
                {
                    onSuccess: () => {
                        setBidModalOpen(false)
                    },
                }
            )
        } else {
            createBid(payload, {
                onSuccess: () => {
                    setBidModalOpen(false)
                    bidForm.reset()
                },
            })
        }
    }

    const handleDeleteBid = (bidId: number) => {
        deleteBid(bidId)
    }

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "title",
            header: "Title",
        },
        {
            accessorKey: "issuer",
            header: "Issuer",
        },
        {
            accessorKey: "reference_number",
            header: "Ref #",
        },
        {
            accessorKey: "submission_deadline",
            header: "Deadline",
            cell: ({ row }) => {
                const d = row.original.submission_deadline
                return d ? new Date(d).toLocaleDateString() : "-"
            },
        },
        {
            accessorKey: "estimated_value",
            header: "Est. Value (ETB)",
            cell: ({ row }) => {
                const v = row.original.estimated_value
                return v != null ? Number(v).toLocaleString() : "-"
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const s = row.original.status as BidStatus
                let color = "bg-blue-50 text-blue-700"
                if (s === "WON") color = "bg-green-100 text-green-700"
                else if (s === "LOST" || s === "NOT_ELIGIBLE") color = "bg-red-100 text-red-700"
                else if (s === "APPLIED") color = "bg-amber-50 text-amber-700"
                return <Badge className={color}>{statusLabels[s] || s}</Badge>
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const bid = row.original
                return (
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditBid(bid)}>
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteBid(bid.id)}
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
                    <h1 className="text-3xl font-bold text-neutral-900">Bid Management</h1>
                    <p className="text-neutral-600 mt-1">
                        Track bids from potential opportunities to applied and won.
                    </p>
                </div>
                <Button className="bg-primary-600 hover:bg-primary-700" onClick={handleOpenNewBid}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Bid
                </Button>
            </div>

            <Card>
                <CardContent className="pt-4 space-y-4">
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                            {statusOrder.map((status) => (
                                <Button
                                    key={status}
                                    variant={statusFilter === status ? "default" : "outline"}
                                    size="sm"
                                    onClick={() =>
                                        setStatusFilter(statusFilter === status ? undefined : status)
                                    }
                                >
                                    {statusLabels[status]}
                                </Button>
                            ))}
                        </div>
                        <div className="w-64">
                            <Input
                                placeholder="Search bids..."
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
                        <DataTable columns={columns} data={bidsData?.data || []} />
                    )}
                </CardContent>
            </Card>

            {/* Bid modal */}
            <Dialog open={bidModalOpen} onOpenChange={setBidModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{selectedBidId ? "Edit Bid" : "New Bid"}</DialogTitle>
                        <DialogDescription>
                            Capture tender details and track its status (potential, applied, won, lost).
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...bidForm}>
                        <form onSubmit={bidForm.handleSubmit(handleSubmitBid)} className="space-y-4">
                            <FormField
                                control={bidForm.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title *</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={bidForm.control}
                                    name="reference_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reference #</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={bidForm.control}
                                    name="issuer"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Issuer</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={bidForm.control}
                                    name="submission_deadline"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Submission Deadline</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={bidForm.control}
                                    name="submitted_at"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Submitted At</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={bidForm.control}
                                    name="estimated_value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estimated Value (ETB)</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={bidForm.control}
                                    name="submitted_value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Submitted Value (ETB)</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={bidForm.control}
                                    name="result_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Result Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={bidForm.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <FormControl>
                                                <Input placeholder="POTENTIAL, APPLIED, WON, LOST, NOT_ELIGIBLE" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={bidForm.control}
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
                                <Button type="button" variant="outline" onClick={() => setBidModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isCreating || isUpdating}>
                                    {(isCreating || isUpdating) && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {selectedBidId ? "Save Changes" : "Create Bid"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

