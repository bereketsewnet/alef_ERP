import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeScreeningsApi, type CreateEmployeeScreeningRequest, type UpdateEmployeeScreeningRequest } from '@/api/endpoints/employeeScreenings'
import { toast } from '@/components/ui/use-toast'

export const employeeScreeningKeys = {
    all: ['employee-screenings'] as const,
    list: (employeeId: number) => [...employeeScreeningKeys.all, 'list', employeeId] as const,
}

export function useEmployeeScreenings(employeeId: number) {
    return useQuery({
        queryKey: employeeScreeningKeys.list(employeeId),
        queryFn: () => employeeScreeningsApi.list(employeeId),
        enabled: !!employeeId,
    })
}

export function useCreateEmployeeScreening(employeeId: number) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateEmployeeScreeningRequest) =>
            employeeScreeningsApi.create(employeeId, data),
        onSuccess: () => {
            toast({ title: 'Screening record created' })
            queryClient.invalidateQueries({ queryKey: employeeScreeningKeys.list(employeeId) })
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Failed to create screening record',
                description: error.message,
            })
        },
    })
}

export function useUpdateEmployeeScreening(employeeId: number) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (args: { screeningId: number; data: UpdateEmployeeScreeningRequest }) =>
            employeeScreeningsApi.update(employeeId, args.screeningId, args.data),
        onSuccess: () => {
            toast({ title: 'Screening record updated' })
            queryClient.invalidateQueries({ queryKey: employeeScreeningKeys.list(employeeId) })
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Failed to update screening record',
                description: error.message,
            })
        },
    })
}

export function useDeleteEmployeeScreening(employeeId: number) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (screeningId: number) =>
            employeeScreeningsApi.delete(employeeId, screeningId),
        onSuccess: () => {
            toast({ title: 'Screening record deleted' })
            queryClient.invalidateQueries({ queryKey: employeeScreeningKeys.list(employeeId) })
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Failed to delete screening record',
                description: error.message,
            })
        },
    })
}

