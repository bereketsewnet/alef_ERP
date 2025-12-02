import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rosterApi, type BulkAssignRequest } from '@/api/endpoints/roster'
import { toast } from 'sonner'

export const useRoster = (filters: { site_id?: number; date?: string; page?: number } = {}) => {
    return useQuery({
        queryKey: ['roster', filters],
        queryFn: () => rosterApi.list(filters),
    })
}

export const useMyRoster = () => {
    return useQuery({
        queryKey: ['my-roster'],
        queryFn: () => rosterApi.myRoster(),
    })
}

export const useBulkAssignShifts = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: BulkAssignRequest) => rosterApi.bulkAssign(data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['roster'] })
            toast.success(`Successfully created ${result.shifts_created} shifts`)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to assign shifts')
        },
    })
}
