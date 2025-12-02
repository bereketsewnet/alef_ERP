import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi, type AttendanceFilters } from '@/api/endpoints/attendance'
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

export const useExportAttendance = () => {
    return useMutation({
        mutationFn: (filters: Omit<AttendanceFilters, 'page'>) => attendanceApi.export(filters),
        onSuccess: (blob) => {
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `attendance_${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            toast.success('Attendance exported successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to export attendance')
        },
    })
}
