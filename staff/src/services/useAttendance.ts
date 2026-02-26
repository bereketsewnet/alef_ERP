import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    attendanceApi,
    type AttendanceFilters,
    type ManualAttendanceRequest,
    type PendingShiftsFilters,
} from '@/api/endpoints/attendance'
import { toast } from 'sonner'

export const useAttendanceLogs = (filters: AttendanceFilters = {}) => {
    return useQuery({
        queryKey: ['attendance-logs', filters],
        queryFn: () => attendanceApi.list(filters),
    })
}

export const useVerifyAttendance = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => attendanceApi.verify(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance-logs'] })
            toast.success('Attendance verified successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to verify attendance')
        },
    })
}

export const useUnverifyAttendance = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => attendanceApi.unverify(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance-logs'] })
            toast.success('Attendance unverified successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to unverify attendance')
        },
    })
}

export const useMarkAttendancePermission = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, with_permission }: { id: number; with_permission?: boolean }) =>
            attendanceApi.markPermission(id, with_permission),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance-logs'] })
            toast.success('Permission status updated')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update permission status')
        },
    })
}

export const useExportAttendance = () => {
    return useMutation({
        mutationFn: ({ filters, format }: { filters: Omit<AttendanceFilters, 'page'>; format: 'pdf' | 'csv' }) => 
            attendanceApi.export(filters, format),
        onSuccess: (blob, variables) => {
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            const extension = variables.format === 'pdf' ? 'pdf' : 'xlsx'
            link.download = `attendance_${new Date().toISOString().split('T')[0]}.${extension}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            toast.success(`Attendance exported as ${variables.format.toUpperCase()} successfully`)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to export attendance')
        },
    })
}

export const useSetPermission = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { employee_id: number; date: string; reason?: string }) =>
            attendanceApi.setPermission(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['attendance-logs'] })
            const message = data.updated_logs 
                ? `Permission set and ${data.updated_logs} attendance log(s) updated`
                : 'Permission set successfully'
            toast.success(message)
        },
        onError: (error: any) => {
            // Handle Laravel validation errors
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors
                const errorMessages = Object.values(errors).flat().join(', ')
                toast.error(errorMessages || 'Validation failed')
            } else {
                // Handle custom error messages
                const errorMessage = error.response?.data?.message 
                    || error.response?.data?.error 
                    || error.message 
                    || 'Failed to set permission'
                toast.error(errorMessage)
            }
        },
    })
}

// ── Manual attendance hooks ───────────────────────────────────────────

export const usePendingShifts = (filters: PendingShiftsFilters) => {
    return useQuery({
        queryKey: ['pending-shifts', filters],
        queryFn: () => attendanceApi.pendingShifts(filters),
        enabled: !!filters.date,
    })
}

export const useManualAttendanceEntry = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: ManualAttendanceRequest) => attendanceApi.manualEntry(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-shifts'] })
            queryClient.invalidateQueries({ queryKey: ['attendance-logs'] })
            toast.success('Attendance recorded successfully')
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to record attendance',
            )
        },
    })
}

export const useUpdateManualAttendance = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number
            data: Omit<ManualAttendanceRequest, 'schedule_id'>
        }) => attendanceApi.updateManualEntry(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-shifts'] })
            queryClient.invalidateQueries({ queryKey: ['attendance-logs'] })
            toast.success('Attendance updated successfully')
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to update attendance',
            )
        },
    })
}

export const useDeleteManualAttendance = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => attendanceApi.deleteManualEntry(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-shifts'] })
            queryClient.invalidateQueries({ queryKey: ['attendance-logs'] })
            toast.success('Attendance entry deleted')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to delete attendance entry')
        },
    })
}

export const useRemovePermission = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { employee_id: number; date: string }) =>
            attendanceApi.removePermission(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['attendance-logs'] })
            toast.success(`Permission removed. ${data.updated_logs} attendance log(s) updated`)
        },
        onError: (error: any) => {
            // Handle Laravel validation errors
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors
                const errorMessages = Object.values(errors).flat().join(', ')
                toast.error(errorMessages || 'Validation failed')
            } else {
                // Handle custom error messages
                const errorMessage = error.response?.data?.message 
                    || error.response?.data?.error 
                    || error.message 
                    || 'Failed to remove permission'
                toast.error(errorMessage)
            }
        },
    })
}
