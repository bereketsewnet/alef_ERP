import api from '../axios'
import type { AttendanceLog, ClockInPayload, ClockInResponse, PaginatedResponse } from '@/types'

export const attendanceApi = {
    clockIn: async (payload: ClockInPayload): Promise<ClockInResponse> => {
        const formData = new FormData()
        formData.append('schedule_id', payload.schedule_id.toString())
        formData.append('latitude', payload.latitude.toString())
        formData.append('longitude', payload.longitude.toString())
        formData.append('accuracy', payload.accuracy.toString())

        if (payload.selfie) {
            formData.append('selfie', payload.selfie)
        }

        const response = await api.post<ClockInResponse>('/attendance/clock-in', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data
    },

    clockOut: async (payload: ClockInPayload): Promise<ClockInResponse> => {
        const formData = new FormData()
        formData.append('schedule_id', payload.schedule_id.toString())
        formData.append('latitude', payload.latitude.toString())
        formData.append('longitude', payload.longitude.toString())
        formData.append('accuracy', payload.accuracy.toString())

        if (payload.selfie) {
            formData.append('selfie', payload.selfie)
        }

        const response = await api.post<ClockInResponse>('/attendance/clock-out', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data
    },

    getMyLogs: async (params?: { start_date?: string; end_date?: string }): Promise<PaginatedResponse<AttendanceLog>> => {
        const response = await api.get<PaginatedResponse<AttendanceLog>>('/attendance/my-logs', { params })
        return response.data
    },
}
