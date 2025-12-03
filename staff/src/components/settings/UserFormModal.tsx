import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateUser, useUpdateUser } from '@/services/useUsers'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
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
import type { User } from '@/types/common.types'

const userSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
    role: z.string().min(1, 'Role is required'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    password_confirmation: z.string().optional(),
}).refine(
    (data) => {
        if (data.password || data.password_confirmation) {
            return data.password === data.password_confirmation
        }
        return true
    },
    {
        message: "Passwords don't match",
        path: ['password_confirmation'],
    }
)

type UserFormValues = z.infer<typeof userSchema>

interface UserFormModalProps {
    open: boolean
    onClose: () => void
    user?: User | null
}

export function UserFormModal({ open, onClose, user }: UserFormModalProps) {
    const { mutate: createUser, isPending: isCreating } = useCreateUser()
    const { mutate: updateUser, isPending: isUpdating } = useUpdateUser()

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            username: '',
            email: '',
            phone_number: '',
            role: '',
            password: '',
            password_confirmation: '',
        },
    })

    useEffect(() => {
        if (user) {
            form.reset({
                username: user.username,
                email: user.email,
                phone_number: user.phone_number || '',
                role: user.role,
                password: '',
                password_confirmation: '',
            })
        } else {
            form.reset({
                username: '',
                email: '',
                phone_number: '',
                role: '',
                password: '',
                password_confirmation: '',
            })
        }
    }, [user, form])

    const onSubmit = (data: UserFormValues) => {
        if (user) {
            // Update existing user
            updateUser(
                {
                    id: user.id,
                    data: {
                        email: data.email,
                        phone_number: data.phone_number,
                        role: data.role,
                    },
                },
                {
                    onSuccess: () => {
                        onClose()
                        form.reset()
                    },
                }
            )
        } else {
            // Create new user
            createUser(
                {
                    username: data.username,
                    email: data.email,
                    phone_number: data.phone_number,
                    role: data.role,
                    password: data.password!,
                    password_confirmation: data.password_confirmation!,
                },
                {
                    onSuccess: () => {
                        onClose()
                        form.reset()
                    },
                }
            )
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{user ? 'Edit User' : 'Create New User'}</DialogTitle>
                    <DialogDescription>
                        {user
                            ? 'Update user information and permissions'
                            : 'Add a new user to the system'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            disabled={!!user}
                                            placeholder="john.doe"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="email" placeholder="john@example.com" />
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
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                            <SelectItem value="OPS_MANAGER">Operations Manager</SelectItem>
                                            <SelectItem value="HR">HR</SelectItem>
                                            <SelectItem value="FINANCE">Finance</SelectItem>
                                            <SelectItem value="SITE_SUPERVISOR">Site Supervisor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {!user && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="password" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password_confirmation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="password" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isCreating || isUpdating}>
                                {isCreating || isUpdating ? 'Saving...' : user ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
