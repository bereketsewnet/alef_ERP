import api from '../axios'
import type { AttendanceLog, ClockInPayload, ClockInResponse, PaginatedResponse, ClientSite } from '@/types'

export type ManualStatus = 'PRESENT' | 'LATE' | 'LATE_WITH_PERMISSION' | 'ABSENT' | 'ABSENT_WITH_PERMISSION' | 'POLICY_VIOLATION'
export interface SiteShift {
    id: number; employee_id: number; site_id: number; shift_start: string; shift_end: string
    attendance_status: ManualStatus | 'PENDING'; attendance_log?: AttendanceLog
    employee: { id: number; first_name: string; last_name: string; employee_code?: string }
    site: ClientSite
}

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
    getControllerSites: async (): Promise<{ data: ClientSite[]; is_controller: boolean }> =>
        (await api.get('/attendance/controller-sites')).data,
    getSiteAttendance: async (siteId: number, date: string): Promise<SiteShift[]> =>
        (await api.get('/attendance/pending-shifts', { params: { site_id: siteId, date } })).data,
    markManual: async (scheduleId: number, attendance_status: ManualStatus, manual_note?: string) =>
        (await api.post('/attendance/manual', { schedule_id: scheduleId, attendance_status, manual_note })).data,
    updateManual: async (logId: number, attendance_status: ManualStatus, manual_note?: string) =>
        (await api.put(`/attendance/${logId}/manual`, { attendance_status, manual_note })).data,
}
