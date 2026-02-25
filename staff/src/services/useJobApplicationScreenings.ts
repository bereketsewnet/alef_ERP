import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getJobApplicationScreenings,
    createJobApplicationScreening,
    updateJobApplicationScreening,
    deleteJobApplicationScreening,
    type CreateJobApplicationScreeningRequest,
    type UpdateJobApplicationScreeningRequest,
} from '@/api/endpoints/jobApplicationScreenings'
import { toast } from '@/components/ui/use-toast'

export const jobApplicationScreeningKeys = {
    all: ['job-application-screenings'] as const,
    list: (jobApplicationId: number) =>
        [...jobApplicationScreeningKeys.all, 'list', jobApplicationId] as const,
}

export function useJobApplicationScreenings(jobApplicationId: number) {
    return useQuery({
        queryKey: jobApplicationScreeningKeys.list(jobApplicationId),
        queryFn: () => getJobApplicationScreenings(jobApplicationId),
        enabled: !!jobApplicationId,
    })
}

export function useCreateJobApplicationScreening(jobApplicationId: number) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateJobApplicationScreeningRequest) =>
            createJobApplicationScreening(jobApplicationId, data),
        onSuccess: () => {
            toast({ title: 'Screening record created' })
            queryClient.invalidateQueries({
                queryKey: jobApplicationScreeningKeys.list(jobApplicationId),
            })
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

export function useUpdateJobApplicationScreening(jobApplicationId: number) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (args: { screeningId: number; data: UpdateJobApplicationScreeningRequest }) =>
            updateJobApplicationScreening(jobApplicationId, args.screeningId, args.data),
        onSuccess: () => {
            toast({ title: 'Screening record updated' })
            queryClient.invalidateQueries({
                queryKey: jobApplicationScreeningKeys.list(jobApplicationId),
            })
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

export function useDeleteJobApplicationScreening(jobApplicationId: number) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (screeningId: number) =>
            deleteJobApplicationScreening(jobApplicationId, screeningId),
        onSuccess: () => {
            toast({ title: 'Screening record deleted' })
            queryClient.invalidateQueries({
                queryKey: jobApplicationScreeningKeys.list(jobApplicationId),
            })
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

