import api from '../axios'
import type { ShiftSchedule, PaginatedResponse } from '@/types'

export const rosterApi = {
    getMyRoster: async (params?: { start_date?: string; end_date?: string }): Promise<ShiftSchedule[]> => {
        const response = await api.get<ShiftSchedule[]>('/roster/my-roster', { params })
        return response.data
    },

    getShiftById: async (id: number): Promise<ShiftSchedule> => {
        const response = await api.get<ShiftSchedule>(`/roster/${id}`)
        return response.data
    },
}
