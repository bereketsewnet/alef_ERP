import api from '../axios'
import type { PayrollPeriod, PayrollItem, PaginatedResponse } from '@/types'

export const payrollApi = {
    /**
     * List payroll periods.
     * Optional status filter will be passed as query parameter.
     * For member portal salary history we will pass only APPROVED/PAID periods.
     */
    getPeriods: async (params?: { status?: string | string[] }): Promise<PaginatedResponse<PayrollPeriod>> => {
        const response = await api.get<PaginatedResponse<PayrollPeriod>>('/payroll/periods', {
            params,
        })
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
