import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi, type AttendanceMode } from '@/api/endpoints/settings'
import { toast } from 'sonner'

export const useAttendanceMode = () => {
    return useQuery({
        queryKey: ['settings', 'attendance-mode'],
        queryFn: settingsApi.getAttendanceMode,
        // Cache for 5 minutes — rarely changes
        staleTime: 5 * 60 * 1000,
    })
}

export const useSetAttendanceMode = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (mode: AttendanceMode) => settingsApi.setAttendanceMode(mode),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'attendance-mode'] })
            toast.success(`Attendance mode set to ${data.mode}`)
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error ||
                error.response?.data?.message ||
                'Failed to update attendance mode',
            )
        },
    })
}
