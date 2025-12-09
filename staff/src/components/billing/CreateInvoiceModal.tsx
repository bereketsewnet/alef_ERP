import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useClients } from "@/services/useClients"
import { useCreateInvoice } from "@/services/useInvoices"
import { Plus, Trash2, Loader2 } from "lucide-react"

const formSchema = z.object({
    client_id: z.string().min(1, "Client is required"),
    invoice_date: z.string().min(1, "Invoice date is required"),
    due_date: z.string().min(1, "Due date is required"),
    items: z.array(z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unit_price: z.number().min(0, "Price must be positive"),
    })).min(1, "At least one item is required")
})

interface CreateInvoiceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateInvoiceModal({ open, onOpenChange }: CreateInvoiceModalProps) {
    const { data: clients, isLoading: clientsLoading } = useClients({ page: 1, per_page: 1000 }) // Fetch all clients for dropdown
    const { mutate: createInvoice, isPending } = useCreateInvoice()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            client_id: "",
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +15 days
            items: [{ description: "", quantity: 1, unit_price: 0 }]
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items"
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        createInvoice({
            ...values,
            client_id: parseInt(values.client_id)
        }, {
            onSuccess: () => {
                onOpenChange(false)
                form.reset()
            }
        })
    }

    const calculateTotal = (items: any[]) => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>
                        Fill in the details to generate a new invoice.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="client_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={form.control}
                                    name="invoice_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="due_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Due Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border p-4 rounded-md">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-medium">Invoice Items</h3>
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", quantity: 1, unit_price: 0 })}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Item
                                </Button>
                            </div>

                            {fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-6">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Description</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Item description" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Qty</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.unit_price`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Price</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end items-center gap-4">
                            <span className="text-lg font-bold">Total: {calculateTotal(form.watch('items')).toLocaleString()} ETB</span>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Invoice
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
