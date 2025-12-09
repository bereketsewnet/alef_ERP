import apiClient from '../axios'

export interface ShiftSchedule {
    id: number
    employee_id: number
    site_id: number
    job_id: number | null
    shift_start: string
    shift_end: string
    is_overtime_shift: boolean
    status: string
    created_by_user_id: number
    created_at: string
    updated_at: string
    employee?: {
        id: number
        first_name: string
        last_name: string
        employee_code: string
    }
    site?: {
        id: number
        site_name: string
        client_id: number
    }
    job?: {
        id: number
        job_name: string
        job_code: string
    }
    attendance_logs?: Array<{
        id: number
        clock_in: string
        clock_out: string | null
        is_verified: boolean
    }>
}

export interface RosterListResponse {
    current_page: number
    data: ShiftSchedule[]
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

export interface BulkAssignRequest {
    site_id: number
    job_id: number
    employee_ids: number[]
    start_date: string
    end_date: string
    start_time: string
    end_time: string
}

export const rosterApi = {
    list: async (filters: { site_id?: number; date?: string; page?: number } = {}): Promise<RosterListResponse> => {
        const params = new URLSearchParams()
        if (filters.site_id) params.append('site_id', filters.site_id.toString())
        if (filters.date) params.append('date', filters.date)
        if (filters.page) params.append('page', filters.page.toString())

        const response = await apiClient.get(`/roster?${params.toString()}`)
        return response.data
    },

    bulkAssign: async (data: BulkAssignRequest): Promise<{ message: string; shifts_created: number }> => {
        const response = await apiClient.post('/roster/bulk-assign', data)
        return response.data
    },

    myRoster: async (): Promise<ShiftSchedule[]> => {
        const response = await apiClient.get('/roster/my-roster')
        return response.data
    },
}
