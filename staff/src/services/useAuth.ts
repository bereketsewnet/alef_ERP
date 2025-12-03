import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/endpoints/auth'
import type { LoginRequest } from '@/types/auth.types'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/components/ui/use-toast'

// Query keys
export const authKeys = {
    all: ['auth'] as const,
    me: () => [...authKeys.all, 'me'] as const,
}

// Get current user
export function useCurrentUser() {
    return useQuery({
        queryKey: authKeys.me(),
        queryFn: authApi.me,
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

// Login mutation
export function useLogin() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: LoginRequest) => authApi.login(data),
        onSuccess: (data) => {
            // Store tokens
            localStorage.setItem('auth_token', data.access_token)

            // Invalidate and refetch user data
            queryClient.invalidateQueries({ queryKey: authKeys.me() })

            // Navigate to dashboard
            navigate('/dashboard')

            toast({
                title: 'Welcome back!',
                description: `Logged in as ${data.user.name}`,
            })
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Login failed',
                description: error.message || 'Invalid credentials',
            })
        },
    })
}

// Logout mutation
export function useLogout() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => {
            // Clear tokens
            localStorage.removeItem('auth_token')
            localStorage.removeItem('refresh_token')

            // Clear all queries
            queryClient.clear()

            // Navigate to login
            navigate('/login')

            toast({
                title: 'Logged out',
                description: 'You have been successfully logged out',
            })
        },
    })
}

// Forgot password mutation
export function useForgotPassword() {
    return useMutation({
        mutationFn: authApi.forgotPassword,
        onSuccess: () => {
            toast({
                title: 'Email sent',
                description: 'Check your email for password reset instructions',
            })
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to send reset email',
            })
        },
    })
}
