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

export interface AssetReportData {
    summary: { total: number; available: number; assigned: number; total_value: number; history_records: number }
    by_company: Array<{ name: string; count: number }>
    by_category: Array<{ name: string; count: number }>
    by_status: Array<{ name: string; count: number }>
    inventory: Array<{
        id: number; asset_code: string; name: string; company: string; site: string; category: string
        condition: string; status: string; value: number; current_employee: string | null; created_at: string
    }>
    history: Array<{
        id: number; asset_code: string; asset_name: string; company: string; category: string; employee: string
        assigned_at: string; returned_at: string | null; return_condition: string | null; notes: string | null
    }>
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

    getAssetReport: (params?: ReportParams) =>
        apiClient.get<AssetReportData>('/reports/assets', { params }),

    exportReport: (type: string, format: 'pdf' | 'excel' | 'csv', params: ReportParams) =>
        apiClient.get(`/reports/export/${type}`, {
            params: { ...params, format },
            responseType: 'blob'
        })
}
