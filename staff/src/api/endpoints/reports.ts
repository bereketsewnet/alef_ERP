import apiClient from "@/api/axios"

export interface ReportDashboardStats {
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
