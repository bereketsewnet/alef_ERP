import client from '../axios'
import type { SuccessResponse as GenericResponse } from '@/types/common.types'
import type { Employee } from './employees'

export interface PayrollPeriod {
    id: number
    start_date: string
    end_date: string
    status: 'DRAFT' | 'PROCESSING' | 'COMPLETED'
    processed_date: string | null
    created_at: string
    updated_at: string
}

export interface PayrollItem {
    id: number
    payroll_period_id: number
    employee_id: number
    employee?: Employee
    base_salary: number
    shift_allowance: number
    overtime_pay: number
    taxable_income: number
    total_gross: number
    income_tax: number
    pension_contribution: number
    pension_employer_contribution: number
    penalties: number
    bonuses: number
    asset_deductions: number
    agency_deductions: number
    loan_repayments: number
    total_deductions: number
    net_pay: number
    worked_days: number
    worked_hours: number
    overtime_hours: number
    late_days: number
    absent_days: number
    status: string
}

export interface PayrollStats {
    last_period: PayrollPeriod | null
    total_ytd_gross: number
    total_employees: number
}

export interface PayrollSetting {
    id: number
    setting_key: string
    setting_value: any
    setting_type: 'number' | 'percentage' | 'json' | 'boolean'
    description: string
    effective_from: string | null
    effective_to: string | null
    is_active: boolean
}

export interface Bonus {
    id: number
    employee_id: number
    employee?: Employee
    payroll_period_id: number | null
    amount: number
    reason: string
    bonus_date: string
    type: string
    status: string
    approved_by_user_id: number | null
}

export interface CreateBonusRequest {
    employee_id: number
    amount: number
    reason: string
    bonus_date: string
    type?: string
}

export interface Penalty {
    id: number
    employee_id: number
    employee?: Employee
    payroll_period_id: number | null
    penalty_type: string
    amount: number
    penalty_date: string
    reason: string
    status: 'PENDING' | 'APPLIED' | 'CANCELLED'
    approved_by_user_id: number | null
}

export interface CreatePenaltyRequest {
    employee_id: number
    penalty_type: string
    amount: number
    penalty_date: string
    reason?: string
}

// --- API Functions ---

// Periods
export const getPayrollPeriods = (params?: any) =>
    client.get<any>('/payroll/periods', { params }).then(res => res.data)

export const createPayrollPeriod = (data: { start_date: string, end_date: string }) =>
    client.post<PayrollPeriod>('/payroll/periods', data).then(res => res.data)

export const getPayrollPeriod = (id: number) =>
    client.get<PayrollPeriod & { payroll_items: PayrollItem[] }>(`/payroll/periods/${id}`).then(res => res.data)

export const generatePayroll = (id: number) =>
    client.post<GenericResponse>(`/payroll/periods/${id}/generate`).then(res => res.data)

export const approvePayroll = (id: number) =>
    client.post<GenericResponse>(`/payroll/periods/${id}/approve`).then(res => res.data)

export const getPayrollStats = () =>
    client.get<PayrollStats>('/payroll/stats').then(res => res.data)

// Items / Payslips
export const downloadPayslip = (itemId: number) =>
    client.get(`/payroll/items/${itemId}/payslip`, { responseType: 'blob' }).then(res => res.data)

// Penalties
export const getPenalties = (params?: any) =>
    client.get<any>('/penalties', { params }).then(res => res.data)

export const createPenalty = (data: CreatePenaltyRequest) =>
    client.post<Penalty>('/penalties', data).then(res => res.data)

export const deletePenalty = (id: number) =>
    client.delete<GenericResponse>(`/penalties/${id}`).then(res => res.data)

// Bonuses
export const getBonuses = (params?: any) =>
    client.get<any>('/bonuses', { params }).then(res => res.data)

export const createBonus = (data: CreateBonusRequest) =>
    client.post<Bonus>('/bonuses', data).then(res => res.data)

export const deleteBonus = (id: number) =>
    client.delete<GenericResponse>(`/bonuses/${id}`).then(res => res.data)

// Settings
export const getPayrollSettings = () =>
    client.get<PayrollSetting[]>('/payroll/settings').then(res => res.data)

export const updatePayrollSetting = (key: string, data: { setting_value: any, description?: string }) =>
    client.put<PayrollSetting>(`/payroll/settings/${key}`, data).then(res => res.data)
