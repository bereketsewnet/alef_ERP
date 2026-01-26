import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { employeesApi } from "@/api/endpoints/employees"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    amount: z.string().min(1, "Amount is required").refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num !== 0
    }, "Amount must be a non-zero number"),
    reason: z.string().min(1, "Reason is required").max(500, "Reason must be less than 500 characters"),
    adjustment_date: z.string().min(1, "Date is required"),
})

interface SalaryAdjustmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employeeId: number
    payrollPeriodId: number
    periodStartDate: string
    periodEndDate: string
}

export function SalaryAdjustmentModal({
    open,
    onOpenChange,
    employeeId,
    payrollPeriodId,
    periodStartDate,
    periodEndDate,
}: SalaryAdjustmentModalProps) {
    const queryClient = useQueryClient()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: '',
            reason: '',
            adjustment_date: new Date().toISOString().split('T')[0],
        },
    })

    const mutation = useMutation({
        mutationFn: async (data: z.infer<typeof formSchema>) => {
            const amount = parseFloat(data.amount)
            return employeesApi.addSalaryAdjustment(employeeId, {
                payroll_period_id: payrollPeriodId,
                amount: amount,
                reason: data.reason,
                adjustment_date: data.adjustment_date,
            })
        },
        onSuccess: () => {
            toast.success('Salary adjustment added successfully')
            queryClient.invalidateQueries({ queryKey: ['employee-salary', employeeId, payrollPeriodId] })
            queryClient.invalidateQueries({ queryKey: ['employee-salary-history', employeeId] })
            queryClient.invalidateQueries({ queryKey: ['payroll'] })
            form.reset()
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to add salary adjustment')
        },
        onSettled: () => {
            setIsSubmitting(false)
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        mutation.mutate(values)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Salary Adjustment</DialogTitle>
                    <DialogDescription>
                        Add a manual salary adjustment for this payroll period. Use positive amount to add money, negative amount to deduct.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Adjustment Amount *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Enter amount (positive to add, negative to deduct)"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Positive value adds to salary, negative value deducts from salary
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="adjustment_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Adjustment Date *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            min={periodStartDate}
                                            max={periodEndDate}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter reason for this adjustment"
                                            className="resize-none"
                                            rows={4}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    form.reset()
                                    onOpenChange(false)
                                }}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Adjustment
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

