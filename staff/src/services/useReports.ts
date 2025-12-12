import { useQuery, useMutation } from "@tanstack/react-query"
import type { AxiosResponse } from "axios"
import { reportsApi, type ReportParams, type ReportDashboardStats } from "@/api/endpoints/reports"

export function useReportDashboard(params?: ReportParams) {
    return useQuery({
        queryKey: ['reports', 'dashboard', params],
        queryFn: () => reportsApi.getDashboardStats(params).then((res: AxiosResponse<ReportDashboardStats>) => res.data),
    })
}

export function useAttendanceReport(params?: ReportParams) {
    return useQuery({
        queryKey: ['reports', 'attendance', params],
        queryFn: () => reportsApi.getAttendanceReport(params).then(res => res.data),
    })
}

export function useFinanceReport(params?: ReportParams) {
    return useQuery({
        queryKey: ['reports', 'finance', params],
        queryFn: () => reportsApi.getFinanceReport(params).then(res => res.data),
    })
}

export function useIncidentsReport(params?: ReportParams) {
    return useQuery({
        queryKey: ['reports', 'incidents', params],
        queryFn: () => reportsApi.getIncidentsReport(params).then(res => res.data),
    })
}

export function useRosterReport(params?: ReportParams) {
    return useQuery({
        queryKey: ['reports', 'roster', params],
        queryFn: () => reportsApi.getRosterReport(params).then(res => res.data),
    })
}

export function useExportReport() {
    return useMutation({
        mutationFn: async ({ type, format, params }: { type: string, format: 'pdf' | 'excel', params: ReportParams }) => {
            const response = await reportsApi.exportReport(type, format, params)

            // Create a blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${type}_report.${format}`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        }
    })
}
