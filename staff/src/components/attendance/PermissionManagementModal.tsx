import { useState, useMemo } from 'react'
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useMutation, useQuery } from "@tanstack/react-query"
import { employeesApi } from "@/api/endpoints/employees"
import { useSetPermission, useRemovePermission } from "@/services/useAttendance"
import { toast } from "sonner"
import { Loader2, Search, X } from "lucide-react"

const formSchema = z.object({
    employee_id: z.string().min(1, "Employee is required"),
    date: z.string().min(1, "Date is required"),
    reason: z.string().max(500, "Reason must be less than 500 characters").optional(),
})

interface PermissionManagementModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode?: 'set' | 'remove'
}

export function PermissionManagementModal({
    open,
    onOpenChange,
    mode = 'set',
}: PermissionManagementModalProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_id: '',
            date: new Date().toISOString().split('T')[0],
            reason: '',
        },
    })

    // Fetch employees with search
    const { data: employeesData, isLoading: employeesLoading } = useQuery({
        queryKey: ['employees', { search: searchTerm, per_page: 500 }],
        queryFn: () => employeesApi.list({ search: searchTerm, per_page: 500 }),
        enabled: open,
    })

    const setPermission = useSetPermission()
    const removePermission = useRemovePermission()

    // Filter employees based on search term
    const filteredEmployees = useMemo(() => {
        if (!employeesData?.data) return []
        if (!searchTerm) return employeesData.data

        const searchLower = searchTerm.toLowerCase()
        return employeesData.data.filter((emp) => {
            const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase()
            const code = emp.employee_code?.toLowerCase() || ''
            return fullName.includes(searchLower) || code.includes(searchLower)
        })
    }, [employeesData, searchTerm])

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        if (!values.employee_id) {
            toast.error('Please select an employee')
            return
        }

        if (mode === 'set') {
            setPermission.mutate(
                {
                    employee_id: parseInt(values.employee_id),
                    date: values.date,
                    reason: values.reason || undefined,
                },
                {
                    onSuccess: () => {
                        form.reset()
                        setSearchTerm('')
                        setSelectedEmployeeId('')
                        onOpenChange(false)
                    },
                    onError: (error: any) => {
                        // Error is already handled in the hook, but we can add additional logging here
                        console.error('Permission set error:', error)
                    },
                }
            )
        } else {
            removePermission.mutate(
                {
                    employee_id: parseInt(values.employee_id),
                    date: values.date,
                },
                {
                    onSuccess: () => {
                        form.reset()
                        setSearchTerm('')
                        setSelectedEmployeeId('')
                        onOpenChange(false)
                    },
                    onError: (error: any) => {
                        // Error is already handled in the hook, but we can add additional logging here
                        console.error('Permission remove error:', error)
                    },
                }
            )
        }
    }

    const isSubmitting = setPermission.isPending || removePermission.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'set' ? 'Set Permission' : 'Remove Permission'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'set'
                            ? 'Set permission for employee absence/lateness. If the date is in the past, existing attendance logs will be automatically updated.'
                            : 'Remove permission for employee absence/lateness on a specific date.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="employee_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Employee *</FormLabel>
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                            <Input
                                                placeholder="Search by name or employee code..."
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value)
                                                    if (!e.target.value) {
                                                        setSelectedEmployeeId('')
                                                        field.onChange('')
                                                    }
                                                }}
                                                className="pl-9"
                                            />
                                            {searchTerm && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                                    onClick={() => {
                                                        setSearchTerm('')
                                                        setSelectedEmployeeId('')
                                                        field.onChange('')
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                        {searchTerm && (
                                            <div className="border rounded-md max-h-48 overflow-y-auto">
                                                {employeesLoading ? (
                                                    <div className="p-4 text-center text-sm text-neutral-500">
                                                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                                        Loading employees...
                                                    </div>
                                                ) : filteredEmployees.length === 0 ? (
                                                    <div className="p-4 text-center text-sm text-neutral-500">
                                                        No employees found
                                                    </div>
                                                ) : (
                                                    filteredEmployees.map((emp) => (
                                                        <button
                                                            key={emp.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedEmployeeId(emp.id.toString())
                                                                field.onChange(emp.id.toString())
                                                                setSearchTerm(`${emp.first_name} ${emp.last_name} (${emp.employee_code || 'N/A'})`)
                                                            }}
                                                            className={`w-full text-left px-4 py-2 hover:bg-neutral-100 transition-colors ${
                                                                selectedEmployeeId === emp.id.toString()
                                                                    ? 'bg-neutral-100 font-medium'
                                                                    : ''
                                                            }`}
                                                        >
                                                            <div className="font-medium">
                                                                {emp.first_name} {emp.last_name}
                                                            </div>
                                                            <div className="text-sm text-neutral-500">
                                                                {emp.employee_code || 'N/A'}
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date *</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {mode === 'set' && (
                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reason (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter reason for permission (e.g., 'Sick leave', 'Personal matter')"
                                                className="resize-none"
                                                rows={3}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    form.reset()
                                    setSearchTerm('')
                                    setSelectedEmployeeId('')
                                    onOpenChange(false)
                                }}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {mode === 'set' ? 'Set Permission' : 'Remove Permission'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

