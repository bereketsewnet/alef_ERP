import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { incidentsApi } from "@/api/endpoints/incidents"
import { toast } from "sonner"

export const incidentKeys = {
    all: ['incidents'] as const,
    list: (params: any) => [...incidentKeys.all, 'list', params] as const,
}

export function useIncidents(params?: any) {
    return useQuery({
        queryKey: incidentKeys.list(params),
        queryFn: () => incidentsApi.list(params),
    })
}

export function useReportIncident() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: incidentsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: incidentKeys.all })
        },
    })
}

export function usePanicButton() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: incidentsApi.panic,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: incidentKeys.all })
        },
    })
}

export function useDeleteIncident() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: incidentsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: incidentKeys.all })
            toast.success('Incident deleted successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete incident')
        },
    })
}
