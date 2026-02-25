import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useMarkInvoiceAsPaid, type MarkAsPaidData } from "@/services/useInvoices"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    payment_date: z.string().min(1, "Payment date is required"),
    payment_description: z.string().optional(),
    receipt_number: z.string().optional(),
    attachments: z.array(z.instanceof(File)).optional(),
}).refine(
    (data) => !!data.receipt_number || (data.attachments && data.attachments.length > 0),
    {
        message: "Please provide a receipt number or at least one attachment",
        path: ["receipt_number"],
    }
)

type FormValues = z.infer<typeof formSchema>

interface MarkAsPaidModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    invoiceId: number
    invoiceNumber: string
}

export function MarkAsPaidModal({ open, onOpenChange, invoiceId, invoiceNumber }: MarkAsPaidModalProps) {
    const { toast } = useToast()
    const { mutate: markAsPaid, isPending } = useMarkInvoiceAsPaid()
    const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([])

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            payment_date: new Date().toISOString().split('T')[0],
            payment_description: "",
            receipt_number: "",
            attachments: [],
        },
    })

    const handleAttachmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length > 0) {
            form.setValue("attachments", files)

            // Simple previews for image files (truncate to first few)
            const previews: string[] = []
            files.slice(0, 3).forEach((file) => {
                if (file.type.startsWith("image/")) {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                        previews.push(reader.result as string)
                        // Force state update as readers finish
                        setAttachmentPreviews([...previews])
                    }
                    reader.readAsDataURL(file)
                }
            })
        } else {
            form.setValue("attachments", [])
            setAttachmentPreviews([])
        }
    }

    const onSubmit = (values: FormValues) => {
        const data: MarkAsPaidData = {
            payment_date: values.payment_date,
            payment_description: values.payment_description || undefined,
            receipt_number: values.receipt_number || undefined,
            attachments: values.attachments && values.attachments.length > 0 ? values.attachments : undefined,
        }

        markAsPaid(
            { id: invoiceId, data },
            {
                onSuccess: (response: any) => {
                    toast({
                        title: "Success",
                        description: response.message || "Invoice marked as paid successfully",
                    })
                    form.reset()
                    setAttachmentPreviews([])
                    onOpenChange(false)
                },
                onError: (error: any) => {
                    const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || "Failed to mark invoice as paid"
                    toast({
                        title: "Error",
                        description: errorMessage,
                        variant: "destructive",
                    })
                },
            }
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Mark Invoice as Paid</DialogTitle>
                    <DialogDescription>
                        Record payment details for invoice #{invoiceNumber}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="payment_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment Date *</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="receipt_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Receipt Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., RCP-2026-001" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Enter the receipt number if available
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                                    name="attachments"
                                    render={() => (
                                <FormItem>
                                            <FormLabel>Attachments (Proofs, Installments, Penalty Docs)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                                    accept="image/*,application/pdf"
                                                    multiple
                                                    onChange={handleAttachmentsChange}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                                Upload one or more files (JPG, PNG, GIF, PDF - Max 5MB each)
                                    </FormDescription>
                                            {attachmentPreviews.length > 0 && (
                                                <div className="mt-2 space-y-2">
                                                    {attachmentPreviews.map((src, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={src}
                                                            alt={`Attachment preview ${idx + 1}`}
                                                            className="max-w-full h-auto max-h-40 rounded border"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="payment_description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Additional payment notes or description..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                            <strong>Note:</strong> At least one of "Receipt Number" or "Proof Image" must be provided.
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    form.reset()
                                    setAttachmentPreviews([])
                                    onOpenChange(false)
                                }}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Mark as Paid"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

