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
    password: z.string().min(5, 'Password must be at least 5 characters'),
    remember: z.boolean().default(false),
})

type LoginFormValues = z.infer<typeof loginSchema>

const DEMO_ACCOUNTS = [
    { role: 'Owner', username: 'owner', password: 'owner123' },
    { role: 'GM', username: 'gm', password: 'gm123' },
    { role: 'HR', username: 'hr', password: 'hr123' },
    { role: 'Finance', username: 'finance', password: 'finance123' },
    { role: 'Operations', username: 'operations', password: 'operations123' },
    { role: 'Marketing', username: 'marketing', password: 'marketing123' },
    { role: 'Procurement', username: 'procurement', password: 'procurement123' },
]

export function LoginPage() {
    const { mutate: login, isPending } = useLogin()

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema) as any,
        defaultValues: {
            login: '',
            password: '',
            remember: false,
        },
    })

    const onSubmit = (data: any) => {
        login(data)
    }

    const fillDemo = (username: string, password: string) => {
        form.setValue('login', username, { shouldValidate: true })
        form.setValue('password', password, { shouldValidate: true })
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
                            control={form.control as any}
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
                            control={form.control as any}
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
                                control={form.control as any}
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

                <div className="mt-6">
                    <div className="relative flex items-center mb-3">
                        <div className="flex-grow border-t border-neutral-200" />
                        <span className="mx-3 text-xs text-neutral-400 whitespace-nowrap">Demo Accounts</span>
                        <div className="flex-grow border-t border-neutral-200" />
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {DEMO_ACCOUNTS.map((acc) => (
                            <button
                                key={acc.username}
                                type="button"
                                onClick={() => fillDemo(acc.username, acc.password)}
                                className="px-3 py-1 text-xs rounded-full border border-primary-300 text-primary-700 bg-primary-50 hover:bg-primary-100 hover:border-primary-500 transition-colors cursor-pointer"
                            >
                                {acc.role}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-5 text-center text-sm text-neutral-600">
                    <p>© 2024 ALEF DELTA. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}
