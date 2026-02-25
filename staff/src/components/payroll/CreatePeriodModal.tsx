
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreatePayrollPeriod } from "@/services/usePayroll"
import { useQuery } from "@tanstack/react-query"
import { clientsApi } from "@/api/endpoints/clients"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    client_id: z.string().min(1, "Client is required"),
})

interface CreatePeriodModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreatePeriodModal({ open, onOpenChange }: CreatePeriodModalProps) {
    const { mutate: createPeriod, isPending } = useCreatePayrollPeriod()

    const { data: clientsData, isLoading: clientsLoading } = useQuery({
        queryKey: ['clients', 'all'],
        queryFn: () => clientsApi.list({ per_page: 1000 }),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            start_date: '',
            end_date: '',
            client_id: '',
        }
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        createPeriod({
            ...values,
            client_id: parseInt(values.client_id),
        }, {
            onSuccess: () => {
                onOpenChange(false)
                form.reset()
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Payroll Period</DialogTitle>
                    <DialogDescription>Set start and end dates and select client for the new payroll period.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="client_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value?.toString() || ''}
                                        disabled={clientsLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={clientsLoading ? "Loading clients..." : "Select client"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {clientsData?.data?.map((client) => (
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
                            control={form.control}
                            name="start_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="end_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>Create Period</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
