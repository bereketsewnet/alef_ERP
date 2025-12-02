import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useForgotPassword } from '@/services/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
    const { mutate: sendResetEmail, isPending, isSuccess } = useForgotPassword()

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    })

    const onSubmit = (data: ForgotPasswordFormValues) => {
        sendResetEmail(data)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-secondary-500">
            <div className="bg-white dark:bg-neutral-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
                <div className="mb-8">
                    <Link
                        to="/login"
                        className="inline-flex items-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to login
                    </Link>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                        Forgot Password
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {isSuccess ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                            Check your email
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            We've sent a password reset link to your email address. Please check your inbox.
                        </p>
                        <Link
                            to="/login"
                            className="inline-block mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Return to login
                        </Link>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="Enter your email"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            We'll send a password reset link to this email
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full bg-primary-600 hover:bg-primary-700"
                                disabled={isPending}
                            >
                                {isPending ? 'Sending...' : 'Send Reset Link'}
                            </Button>
                        </form>
                    </Form>
                )}

                <div className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
                    <p>© 2024 ALEF DELTA. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}
