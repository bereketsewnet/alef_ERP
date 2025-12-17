import api from '../axios'
import type { PayrollPeriod, PayrollItem, PaginatedResponse } from '@/types'

export const payrollApi = {
    getPeriods: async (): Promise<PaginatedResponse<PayrollPeriod>> => {
        const response = await api.get<PaginatedResponse<PayrollPeriod>>('/payroll/periods')
        return response.data
    },

    getMyPayrollItem: async (periodId: number): Promise<PayrollItem | null> => {
        try {
            const response = await api.get<PayrollItem>(`/payroll/periods/${periodId}`)
            return response.data
        } catch {
            return null
        }
    },

    downloadPayslip: async (itemId: number): Promise<Blob> => {
        const response = await api.get(`/payroll/items/${itemId}/payslip`, {
            responseType: 'blob',
        })
        return response.data
    },
}
