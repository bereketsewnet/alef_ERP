import { useEffect } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateEmployee, useUpdateEmployee } from '@/services/useEmployees'
import type { Employee } from '@/api/endpoints/employees'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Briefcase, User } from 'lucide-react'
import { EmployeeJobsPanel } from './EmployeeJobsPanel'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const employeeSchema = z.object({
    first_name: z.string().min(2, 'First name must be at least 2 characters'),
    last_name: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address').or(z.literal('')),
    phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
    status: z.enum(['active', 'probation', 'inactive', 'terminated']),
    hire_date: z.string().min(1, 'Hire date is required'),
})

type EmployeeFormValues = z.infer<typeof employeeSchema>

interface EmployeeFormModalProps {
    open: boolean
    onClose: () => void
    employee?: Employee | null
}

function EmployeeFormFields({ form, isSubmitting, employee, onClose }: {
    form: UseFormReturn<EmployeeFormValues>,
    isSubmitting: boolean,
    employee?: Employee | null,
    onClose: () => void
}) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="John" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Doe" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input {...field} type="email" placeholder="john.doe@example.com" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="+251911234567" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value || 'active'}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="probation">Probation</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="terminated">Terminated</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="hire_date"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Hire Date</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value || ''} type="date" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? 'Saving...'
                        : employee
                            ? 'Update'
                            : 'Create'}
                </Button>
            </div>
        </div>
    )
}

export function EmployeeFormModal({ open, onClose, employee }: EmployeeFormModalProps) {
    const { mutate: createEmployee, isPending: isCreating } = useCreateEmployee()
    const { mutate: updateEmployee, isPending: isUpdating } = useUpdateEmployee()

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            phone_number: '',
            status: 'active',
            hire_date: '',
        },
    })

    useEffect(() => {
        if (employee) {
            form.reset({
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                email: employee.email || '',
                phone_number: employee.phone_number || '',
                status: employee.status || 'active',
                hire_date: employee.hire_date ? employee.hire_date.split('T')[0] : '',
            })
        } else {
            form.reset({
                first_name: '',
                last_name: '',
                email: '',
                phone_number: '',
                status: 'active',
                hire_date: '',
            })
        }
    }, [employee, form])

    const onSubmit = (data: EmployeeFormValues) => {
        if (employee) {
            updateEmployee(
                { id: employee.id, data },
                {
                    onSuccess: () => {
                        onClose()
                        form.reset()
                    },
                }
            )
        } else {
            createEmployee(data, {
                onSuccess: () => {
                    onClose()
                    form.reset()
                },
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{employee ? 'Edit Employee' : 'Create New Employee'}</DialogTitle>
                    <DialogDescription>
                        {employee
                            ? 'Update employee information and assignments'
                            : 'Add a new employee to the system'}
                    </DialogDescription>
                </DialogHeader>

                {employee ? (
                    <Tabs defaultValue="info" className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="info" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Information
                            </TabsTrigger>
                            <TabsTrigger value="jobs" className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                Jobs & Pay
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="mt-4">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)}>
                                    <EmployeeFormFields
                                        form={form}
                                        isSubmitting={isUpdating}
                                        employee={employee}
                                        onClose={onClose}
                                    />
                                </form>
                            </Form>
                        </TabsContent>

                        <TabsContent value="jobs" className="mt-4">
                            <EmployeeJobsPanel
                                employeeId={employee.id}
                                employeeName={`${employee.first_name} ${employee.last_name}`}
                            />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <EmployeeFormFields
                                form={form}
                                isSubmitting={isCreating}
                                employee={undefined}
                                onClose={onClose}
                            />
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    )
}
