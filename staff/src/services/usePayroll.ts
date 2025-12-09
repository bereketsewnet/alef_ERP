import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    getPayrollPeriods,
    createPayrollPeriod,
    getPayrollPeriod,
    generatePayroll,
    approvePayroll,
    getPayrollStats,
    getPenalties,
    createPenalty,
    deletePenalty,
    getBonuses,
    createBonus,
    deleteBonus,
    getPayrollSettings,
    updatePayrollSetting
} from '../api/endpoints/payroll'

// --- Periods & Stats ---

export function usePayrollPeriods(params?: any) {
    return useQuery({
        queryKey: ['payroll-periods', params],
        queryFn: () => getPayrollPeriods(params),
    })
}

export function usePayrollStats() {
    return useQuery({
        queryKey: ['payroll-stats'],
        queryFn: getPayrollStats,
    })
}

export function usePayrollPeriod(id: number) {
    return useQuery({
        queryKey: ['payroll-period', id],
        queryFn: () => getPayrollPeriod(id),
        enabled: !!id,
    })
}

export function useCreatePayrollPeriod() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createPayrollPeriod,
        onSuccess: () => {
            toast.success('Payroll period created')
            queryClient.invalidateQueries({ queryKey: ['payroll-periods'] })
        },
        onError: (err: any) => toast.error(err.message || 'Failed to create period'),
    })
}

export function useGeneratePayroll() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => generatePayroll(id),
        onSuccess: (_data, id) => {
            toast.success('Payroll generated successfully')
            queryClient.invalidateQueries({ queryKey: ['payroll-period', id] })
            queryClient.invalidateQueries({ queryKey: ['payroll-periods'] })
        },
        onError: (err: any) => toast.error(err.message || 'Failed to generate payroll'),
    })
}

export function useApprovePayroll() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => approvePayroll(id),
        onSuccess: (_data, id) => {
            toast.success('Payroll approved')
            queryClient.invalidateQueries({ queryKey: ['payroll-period', id] })
            queryClient.invalidateQueries({ queryKey: ['payroll-periods'] })
        },
        onError: (err: any) => toast.error(err.message || 'Failed to approve payroll'),
    })
}

// --- Penalties ---

export function usePenalties(params?: any) {
    return useQuery({
        queryKey: ['penalties', params],
        queryFn: () => getPenalties(params),
    })
}

export function useCreatePenalty() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createPenalty,
        onSuccess: () => {
            toast.success('Penalty added')
            queryClient.invalidateQueries({ queryKey: ['penalties'] })
        },
        onError: (err: any) => toast.error(err.message || 'Failed to add penalty'),
    })
}

export function useDeletePenalty() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deletePenalty,
        onSuccess: () => {
            toast.success('Penalty removed')
            queryClient.invalidateQueries({ queryKey: ['penalties'] })
        },
        onError: (err: any) => toast.error(err.message || 'Failed to remove penalty'),
    })
}

// --- Bonuses ---

export function useBonuses(params?: any) {
    return useQuery({
        queryKey: ['bonuses', params],
        queryFn: () => getBonuses(params),
    })
}

export function useCreateBonus() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createBonus,
        onSuccess: () => {
            toast.success('Bonus added')
            queryClient.invalidateQueries({ queryKey: ['bonuses'] })
        },
        onError: (err: any) => toast.error(err.message || 'Failed to add bonus'),
    })
}

export function useDeleteBonus() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteBonus,
        onSuccess: () => {
            toast.success('Bonus removed')
            queryClient.invalidateQueries({ queryKey: ['bonuses'] })
        },
        onError: (err: any) => toast.error(err.message || 'Failed to remove bonus'),
    })
}

// --- Settings ---

export function usePayrollSettings() {
    return useQuery({
        queryKey: ['payroll-settings'],
        queryFn: getPayrollSettings,
    })
}

export function useUpdatePayrollSetting() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ key, data }: { key: string, data: any }) => updatePayrollSetting(key, data),
        onSuccess: () => {
            toast.success('Setting updated')
            queryClient.invalidateQueries({ queryKey: ['payroll-settings'] })
        },
        onError: (err: any) => toast.error(err.message || 'Failed to update setting'),
    })
}
