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
    proof_image: z.instanceof(File).optional(),
}).refine(
    (data) => data.receipt_number || data.proof_image,
    {
        message: "Please provide either a receipt number or proof image (or both)",
        path: ["receipt_number"],
    }
)

interface MarkAsPaidModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    invoiceId: number
    invoiceNumber: string
}

export function MarkAsPaidModal({ open, onOpenChange, invoiceId, invoiceNumber }: MarkAsPaidModalProps) {
    const { toast } = useToast()
    const { mutate: markAsPaid, isPending } = useMarkInvoiceAsPaid()
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            payment_date: new Date().toISOString().split('T')[0],
            payment_description: "",
            receipt_number: "",
            proof_image: undefined,
        },
    })

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            form.setValue("proof_image", file)
            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const data: MarkAsPaidData = {
            payment_date: values.payment_date,
            payment_description: values.payment_description || undefined,
            receipt_number: values.receipt_number || undefined,
            proof_image: values.proof_image,
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
                    setImagePreview(null)
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
                            name="proof_image"
                            render={({ field: { value, onChange, ...field } }) => (
                                <FormItem>
                                    <FormLabel>Proof of Payment (Screenshot/Receipt)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                handleImageChange(e)
                                                onChange(e.target.files?.[0])
                                            }}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Upload a screenshot or receipt image (JPG, PNG, GIF - Max 5MB)
                                    </FormDescription>
                                    {imagePreview && (
                                        <div className="mt-2">
                                            <img
                                                src={imagePreview}
                                                alt="Proof preview"
                                                className="max-w-full h-auto max-h-48 rounded border"
                                            />
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
                                    setImagePreview(null)
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

