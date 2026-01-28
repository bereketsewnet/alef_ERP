import api from '../axios'
import type { PayrollItem } from '@/types'

export interface SalaryHistoryItem extends PayrollItem {
    payroll_period?: {
        id: number
        period_name: string
        start_date: string
        end_date: string
        client?: {
            id: number
            company_name: string
        }
    }
}

export const salaryApi = {
    getMySalaryHistory: async (employeeId: number): Promise<SalaryHistoryItem[]> => {
        const response = await api.get<SalaryHistoryItem[]>(`/employees/${employeeId}/salary/history`)
        return response.data
    },
}

