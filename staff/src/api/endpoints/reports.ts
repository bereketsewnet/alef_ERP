import apiClient from "@/api/axios"

export interface ReportDashboardStats {
    // Dashboard KPIs
    active_employees: number
    employee_growth: number
    attendance_today: number
    attendance_rate: number
    attendance_growth: number
    open_incidents: number
    incident_change: number
    total_assets: number
    assets_in_use_percent: number
    assigned_assets: number
    attendance_trend: Array<{
        date: string
        clockIns: number
        clockOuts: number
    }>
    active_clock_ins: Array<{
        id: number
        employee_name: string
        site_name: string
        latitude: number | null
        longitude: number | null
        clock_in_time: string
    }>
    asset_categories: Array<{
        category: string
        total: number
        assigned: number
        available: number
    }>
    // Legacy fields for reports
    attendance: { status: string; count: number }[]
    finance: { total_billed: number; total_paid: number; total_overdue: number }
    incidents: { severity_level: string; count: number }[]
    roster: { status: string; count: number }[]
}

export interface ReportParams {
    start_date?: string
    end_date?: string
    status?: string
    page?: number
}

export const reportsApi = {
    getDashboardStats: (params?: ReportParams) =>
        apiClient.get<ReportDashboardStats>('/reports/dashboard', { params }),

    getAttendanceReport: (params?: ReportParams) =>
        apiClient.get('/reports/attendance', { params }),

    getFinanceReport: (params?: ReportParams) =>
        apiClient.get('/reports/finance', { params }),

    getIncidentsReport: (params?: ReportParams) =>
        apiClient.get('/reports/incidents', { params }),

    getRosterReport: (params?: ReportParams) =>
        apiClient.get('/reports/roster', { params }),

    exportReport: (type: string, format: 'pdf' | 'excel', params: ReportParams) =>
        apiClient.get(`/reports/export/${type}`, {
            params: { ...params, format },
            responseType: 'blob'
        })
}
