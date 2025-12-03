import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi, type CreateUserRequest, type UpdateUserRequest } from '@/api/endpoints/users'
import { toast } from '@/components/ui/use-toast'

// Query keys
export const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (filters?: any) => [...userKeys.lists(), filters] as const,
    details: () => [...userKeys.all, 'detail'] as const,
    detail: (id: number) => [...userKeys.details(), id] as const,
}

// Get users list with pagination
export function useUsers(params?: {
    page?: number
    per_page?: number
    search?: string
    role?: string
}) {
    return useQuery({
        queryKey: userKeys.list(params),
        queryFn: () => usersApi.list(params),
    })
}

// Get user by ID
export function useUser(id: number) {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: () => usersApi.getById(id),
        enabled: !!id,
    })
}

// Create user mutation
export function useCreateUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateUserRequest) => usersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() })
            toast({
                title: 'User created',
                description: 'The user has been created successfully',
            })
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to create user',
            })
        },
    })
}

// Update user mutation
export function useUpdateUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
            usersApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() })
            queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
            toast({
                title: 'User updated',
                description: 'The user has been updated successfully',
            })
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update user',
            })
        },
    })
}

// Delete user mutation
export function useDeleteUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => usersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() })
            toast({
                title: 'User deleted',
                description: 'The user has been deleted successfully',
            })
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to delete user',
            })
        },
    })
}
