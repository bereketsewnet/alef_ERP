import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCurrentUser, useUpdateProfile, useChangePassword } from "@/services/useAuth"
import { Loader2 } from "lucide-react"

const profileSchema = z.object({
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phone_number: z.string().optional().or(z.literal("")),
})

const passwordSchema = z.object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(6, "New password must be at least 6 characters"),
    new_password_confirmation: z.string().min(6, "Please confirm the new password"),
}).refine(
    (data) => data.new_password === data.new_password_confirmation,
    {
        path: ["new_password_confirmation"],
        message: "Passwords do not match",
    }
)

export function ProfilePage() {
    const { data: user, isLoading } = useCurrentUser()
    const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile()
    const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword()

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            email: "",
            phone_number: "",
        },
        values: user
            ? {
                email: user.email || "",
                phone_number: user.phone_number || "",
            }
            : undefined,
    })

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            current_password: "",
            new_password: "",
            new_password_confirmation: "",
        },
    })

    const handleSubmitProfile = (values: z.infer<typeof profileSchema>) => {
        const payload: any = {}
        if (values.email && values.email.trim()) {
            payload.email = values.email.trim()
        }
        if (values.phone_number && values.phone_number.trim()) {
            payload.phone_number = values.phone_number.trim()
        }
        updateProfile(payload)
    }

    const handleSubmitPassword = (values: z.infer<typeof passwordSchema>) => {
        changePassword({
            current_password: values.current_password,
            new_password: values.new_password,
            new_password_confirmation: values.new_password_confirmation,
        })
        passwordForm.reset()
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900">My Profile</h1>
                <p className="text-neutral-600 mt-1">
                    Update your contact details and password.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(handleSubmitProfile)} className="space-y-4">
                                <FormField
                                    control={profileForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="phone_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isUpdatingProfile}>
                                    {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(handleSubmitPassword)} className="space-y-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="current_password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Current Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="new_password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="new_password_confirmation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm New Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isChangingPassword}>
                                    {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Change Password
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

