import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rosterApi, type BulkAssignRequest } from '@/api/endpoints/roster'
import { toast } from '@/components/ui/use-toast'

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
            toast({
                title: "Shifts Assigned",
                description: `Successfully created ${result.shifts_created} shifts`,
            })
        },
        onError: (error: any) => {
            const errorMessage = error.error || error.message || 'Failed to assign shifts'
            toast({
                variant: 'destructive',
                title: "Assignment Failed",
                description: errorMessage,
            })
        },
    })
}

export const useDeleteShift = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => rosterApi.deleteShift(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roster'] })
            toast({
                title: "Shift Deleted",
                description: "The shift was deleted successfully.",
            })
        },
        onError: (error: any) => {
            const errorMessage = error.error || error.message || 'Failed to delete shift'
            toast({
                variant: 'destructive',
                title: "Delete Failed",
                description: errorMessage,
            })
        },
    })
}

export const useDeleteShiftsByEmployee = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ employeeId, start_date, end_date }: { employeeId: number; start_date?: string; end_date?: string }) =>
            rosterApi.deleteShiftsByEmployee(employeeId, { start_date, end_date }),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['roster'] })
            toast({
                title: "Shifts Deleted",
                description: `Deleted ${result.deleted_count} shift(s) for this employee.`,
            })
        },
        onError: (error: any) => {
            const errorMessage = error.error || error.message || 'Failed to delete shifts'
            toast({
                variant: 'destructive',
                title: "Delete Failed",
                description: errorMessage,
            })
        },
    })
}
