import apiClient from '../axios'

export type AttendanceMode = 'MANUAL' | 'MIXED' | 'GPS'

export const settingsApi = {
    getAttendanceMode: async (): Promise<{ key: string; mode: AttendanceMode }> => {
        const res = await apiClient.get('/settings/attendance-mode')
        return res.data
    },

    setAttendanceMode: async (mode: AttendanceMode): Promise<{ message: string; mode: AttendanceMode }> => {
        const res = await apiClient.put('/settings/attendance-mode', { mode })
        return res.data
    },
}
