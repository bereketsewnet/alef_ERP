import apiClient from '../axios'

export interface AttendanceLog {
    id: number
    employee_id: number
    schedule_id: number | null
    clock_in_time: string
    clock_out_time: string | null
    clock_in_latitude: number | null
    clock_in_longitude: number | null
    clock_out_latitude: number | null
    clock_out_longitude: number | null
    clock_in_photo_url: string | null
    clock_out_photo_url: string | null
    is_verified: boolean
    flagged_late: boolean
    flagged_early_leave: boolean
    notes: string | null
    with_permission?: boolean
    created_at: string
    updated_at: string
    employee?: {
        id: number
        employee_code: string
        first_name: string
        last_name: string
        phone_number: string
        email?: string
        status: string
    }
    schedule?: {
        id: number
        site_id: number
        start_time?: string
        end_time?: string
        shift_start?: string
        shift_end?: string
        site?: {
            id: number
            site_name: string
            client_id: number
        }
    }
}

export interface AttendanceListResponse {
    current_page: number
    data: AttendanceLog[]
    first_page_url: string
    from: number
    last_page: number
    last_page_url: string
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number
    total: number
}

export interface AttendanceFilters {
    search?: string
    employee_id?: number
    start_date?: string
    end_date?: string
    site_id?: number
    is_verified?: boolean
    page?: number
}

export const attendanceApi = {
    list: async (filters: AttendanceFilters = {}): Promise<AttendanceListResponse> => {
        const params = new URLSearchParams()
        if (filters.search) params.append('search', filters.search)
        if (filters.employee_id) params.append('employee_id', filters.employee_id.toString())
        if (filters.start_date) params.append('start_date', filters.start_date)
        if (filters.end_date) params.append('end_date', filters.end_date)
        if (filters.site_id) params.append('site_id', filters.site_id.toString())
        if (filters.is_verified !== undefined) params.append('is_verified', filters.is_verified ? '1' : '0')
        if (filters.page) params.append('page', filters.page.toString())

        const response = await apiClient.get(`/attendance/logs?${params.toString()}`)
        return response.data
    },

    verify: async (id: number): Promise<{ message: string; data: AttendanceLog }> => {
        const response = await apiClient.put(`/attendance/logs/${id}/verify`)
        return response.data
    },

    unverify: async (id: number): Promise<{ message: string; data: AttendanceLog }> => {
        const response = await apiClient.put(`/attendance/logs/${id}/unverify`)
        return response.data
    },

    export: async (filters: Omit<AttendanceFilters, 'page'>, format: 'pdf' | 'csv' = 'csv'): Promise<Blob> => {
        const params = new URLSearchParams()
        if (filters.start_date) params.append('start_date', filters.start_date)
        if (filters.end_date) params.append('end_date', filters.end_date)
        if (filters.site_id) params.append('site_id', filters.site_id.toString())
        params.append('format', format === 'pdf' ? 'pdf' : 'excel')

        const response = await apiClient.get(`/attendance/export?${params.toString()}`, {
            responseType: 'blob'
        })
        return response.data
    },

    markPermission: async (id: number, withPermission?: boolean): Promise<{ message: string; data: AttendanceLog }> => {
        const response = await apiClient.post(`/attendance/${id}/mark-permission`, {
            with_permission: typeof withPermission === 'boolean' ? withPermission : undefined,
        })
        return response.data
    },

    setPermission: async (data: {
        employee_id: number
        date: string
        reason?: string
    }): Promise<{ message: string; updated_logs?: number; shift?: any }> => {
        try {
            const response = await apiClient.post('/attendance/permission/set', {
                employee_id: data.employee_id,
                date: data.date,
                reason: data.reason || null,
            })
            return response.data
        } catch (error: any) {
            // Log the full error for debugging
            console.error('Set permission API error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            })
            throw error
        }
    },

    removePermission: async (data: {
        employee_id: number
        date: string
    }): Promise<{ message: string; updated_logs: number }> => {
        try {
            const response = await apiClient.post('/attendance/permission/remove', {
                employee_id: data.employee_id,
                date: data.date,
            })
            return response.data
        } catch (error: any) {
            // Log the full error for debugging
            console.error('Remove permission API error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            })
            throw error
        }
    },
}
