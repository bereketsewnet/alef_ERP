import { useEffect, useState, type ReactNode } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateEmployee, useUpdateEmployee } from '@/services/useEmployees'
import { employeeDocumentsApi } from '@/api/endpoints/employeeDocuments'
import type { Employee } from '@/api/endpoints/employees'
import { EmployeeCredentialsModal } from './EmployeeCredentialsModal'
import { EmployeeDocumentsPanel } from './EmployeeDocumentsPanel'
import {
    NamedFileUploader,
    type NamedFileItem,
} from '@/components/shared/NamedFileUploader'
import { toast } from '@/components/ui/use-toast'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Briefcase, FileText, User } from 'lucide-react'
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

function EmployeeFormFields({ form, isSubmitting, employee, onClose, children }: {
    form: UseFormReturn<EmployeeFormValues>,
    isSubmitting: boolean,
    employee?: Employee | null,
    onClose: () => void,
    children?: ReactNode
}) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {children}

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
    const { mutateAsync: createEmployee, isPending: isCreating } = useCreateEmployee()
    const { mutate: updateEmployee, isPending: isUpdating } = useUpdateEmployee()
    const [credentials, setCredentials] = useState<{ username: string; email: string; password: string; message: string } | null>(null)
    const [showCredentialsModal, setShowCredentialsModal] = useState(false)
    const [attachments, setAttachments] = useState<NamedFileItem[]>([])
    const [attachmentError, setAttachmentError] = useState<string>()
    const [isUploadingDocuments, setIsUploadingDocuments] = useState(false)

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
            setAttachments([])
            setAttachmentError(undefined)
        }
    }, [employee, form, open])

    const validateAttachments = () => {
        if (attachments.some((item) => !item.name.trim() || !item.file)) {
            return 'Every attachment needs both a file name and a selected file.'
        }
        if (attachments.some((item) => item.file && item.file.size > 10 * 1024 * 1024)) {
            return 'Each attachment must be 10 MB or smaller.'
        }
        return undefined
    }

    const onSubmit = async (data: EmployeeFormValues) => {
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
            return
        }

        const validationError = validateAttachments()
        setAttachmentError(validationError)
        if (validationError) return

        try {
            const response = await createEmployee(data)
            const employeeId = response.data.id

            if (attachments.length > 0) {
                setIsUploadingDocuments(true)
                const results = await Promise.allSettled(
                    attachments.map((attachment) => employeeDocumentsApi.upload(employeeId, {
                        type: 'OTHER',
                        name: attachment.name.trim(),
                        file: attachment.file!,
                    }))
                )
                const failedUploads = results.filter((result) => result.status === 'rejected').length
                if (failedUploads > 0) {
                    toast({
                        variant: 'destructive',
                        title: 'Some documents were not uploaded',
                        description: `${failedUploads} of ${attachments.length} document(s) failed. Open the employee details to retry them.`,
                    })
                } else {
                    toast({
                        title: 'Documents uploaded',
                        description: `${attachments.length} employee document(s) saved successfully.`,
                    })
                }
            }

            form.reset()
            setAttachments([])
            if (response.login_credentials) {
                setCredentials(response.login_credentials)
                setShowCredentialsModal(true)
            } else {
                onClose()
            }
        } catch {
            // The employee mutation already displays the API error.
        } finally {
            setIsUploadingDocuments(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
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
                        <TabsList className="grid w-full grid-cols-3 gap-1 sm:gap-2">
                            <TabsTrigger value="info" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Information
                            </TabsTrigger>
                            <TabsTrigger value="jobs" className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                Jobs & Pay
                            </TabsTrigger>
                            <TabsTrigger value="documents" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Documents
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

                        <TabsContent value="documents" className="mt-4">
                            <EmployeeDocumentsPanel employeeId={employee.id} />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <EmployeeFormFields
                                form={form}
                                isSubmitting={isCreating || isUploadingDocuments}
                                employee={undefined}
                                onClose={onClose}
                            >
                                <NamedFileUploader
                                    value={attachments}
                                    onChange={(items) => {
                                        setAttachments(items)
                                        setAttachmentError(undefined)
                                    }}
                                    disabled={isCreating || isUploadingDocuments}
                                    error={attachmentError}
                                    title="Employee Documents"
                                    description="Add IDs, certificates, or any other supporting employee files."
                                    addButtonLabel="Add document"
                                />
                            </EmployeeFormFields>
                        </form>
                    </Form>
                )}
            </DialogContent>

            {/* Credentials Modal */}
            {credentials && (
                <EmployeeCredentialsModal
                    open={showCredentialsModal}
                    onOpenChange={(open) => {
                        setShowCredentialsModal(open)
                        if (!open) {
                            setCredentials(null)
                            onClose() // Close the form modal after credentials are acknowledged
                        }
                    }}
                    credentials={credentials}
                />
            )}
        </Dialog>
    )
}
