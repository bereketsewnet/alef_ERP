import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLogin } from '@/services/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Link } from 'react-router-dom'

const loginSchema = z.object({
    login: z.string().min(1, 'Email, username, or phone is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    remember: z.boolean().default(false),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
    const { mutate: login, isPending } = useLogin()

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            login: '',
            password: '',
            remember: false,
        },
    })

    const onSubmit = (data: LoginFormValues) => {
        login(data)
    }

    return (
        <div className="light min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-secondary-500">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary-600 mb-2">
                        {import.meta.env.VITE_APP_NAME || 'ALEF DELTA ERP'}
                    </h1>
                    <p className="text-neutral-600">Staff Portal</p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="login"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email / Username</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Enter your email or username"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Enter your password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center justify-between">
                            <FormField
                                control={form.control}
                                name="remember"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="!mt-0 text-sm font-normal cursor-pointer">
                                            Remember me
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />
                            <Link
                                to="/forgot-password"
                                className="text-sm text-primary-600 hover:text-primary-700"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 text-base font-semibold"
                            disabled={isPending}
                        >
                            {isPending ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </Form>

                <div className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
                    <p>© 2024 ALEF DELTA. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}
