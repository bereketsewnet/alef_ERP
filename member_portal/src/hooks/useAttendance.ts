import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi } from '@/api/endpoints/attendance'
import type { ClockInPayload } from '@/types'

export function useAttendanceLogs() {
    return useQuery({
        queryKey: ['attendance', 'my-logs'],
        queryFn: () => attendanceApi.getMyLogs(),
    })
}

export function useClockIn() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: ClockInPayload) => attendanceApi.clockIn(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] })
            queryClient.invalidateQueries({ queryKey: ['roster'] })
        },
    })
}

export function useClockOut() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: ClockInPayload) => attendanceApi.clockOut(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] })
            queryClient.invalidateQueries({ queryKey: ['roster'] })
        },
    })
}
