import apiClient from '../axios'
import type { PaginatedResponse } from '@/types/common.types'

interface EmployeeCategory {
    id: number
    name: string
    code: string
}

interface EmployeeJob {
    id: number
    category_id: number
    job_name: string
    job_code: string
    category?: EmployeeCategory | null
    pivot?: { is_primary: boolean }
    skills?: Array<{
        id: number
        skill_name: string
        is_required: boolean
    }>
}

export interface EmployeeAssignmentOption {
    id: number
    employee_code: string
    first_name: string
    last_name: string
    email?: string | null
    phone_number?: string | null
    status: string
    job_category?: EmployeeCategory | null
    jobs: Array<{
        id: number
        job_code: string
        job_name: string
        is_primary: boolean
        category?: EmployeeCategory | null
        skills: Array<{
            id: number
            skill_name: string
            is_required: boolean
        }>
    }>
    search_text: string
}

export interface Employee {
    id: number
    first_name: string
    last_name: string
    email: string
    phone_number: string
    role: string
    status: 'active' | 'probation' | 'inactive' | 'terminated'
    hire_date: string
    employee_id?: string
    employee_code?: string
    job_category_id?: number | null
    job_category?: EmployeeCategory | null
    jobs?: EmployeeJob[]
    site_id?: number
    telegram_chat_id?: string
    created_at: string
    updated_at: string
}

export interface EmployeeAlert {
    id: number
    site_id: number
    reported_by_employee_id: number | null
    report_type: 'INCIDENT' | 'PANIC' | 'OBSERVATION' | 'MAINTENANCE'
    description: string
    severity_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    created_at: string
    site?: {
        id: number
        site_name: string
    }
}

export interface CreateEmployeeRequest {
    first_name: string
    last_name: string
    email: string
    phone_number: string
    role?: string
    status?: string
    hire_date: string
    site_id?: number
    job_category_id?: number | null
}

export interface UpdateEmployeeRequest {
    first_name?: string
    last_name?: string
    email?: string
    phone_number?: string
    role?: string
    status?: string
    hire_date?: string
    site_id?: number
    job_category_id?: number | null
}

export interface EmployeeImportResult {
    message: string
    summary: { created: number; updated: number; unchanged: number; errors: number; empty: number }
    rows: Array<{
        row: number
        name: string
        phone_number: string
        employee_code?: string | null
        result: 'CREATED' | 'UPDATED' | 'UNCHANGED' | 'ERROR'
        message: string
        column?: string
        value?: unknown
        changes?: Array<{ column: string; old: unknown; new: unknown }>
        errors?: Array<{ column: string; value: unknown; message: string }>
    }>
}

export const employeesApi = {
    assignmentOptions: async (): Promise<{ data: EmployeeAssignmentOption[]; total: number }> => {
        const response = await apiClient.get('/employees/assignment-options')
        return response.data
    },

    downloadImportBundle: async (): Promise<Blob> => {
        const response = await apiClient.get('/employees/import/bundle', { responseType: 'blob' })
        return response.data
    },

    importSpreadsheet: async (
        file: File,
        defaultCategoryId: number | null,
        defaultCalendar: 'EC' | 'GC'
    ): Promise<EmployeeImportResult> => {
        const form = new FormData()
        form.append('file', file)
        form.append('default_calendar', defaultCalendar)
        if (defaultCategoryId) form.append('default_category_id', String(defaultCategoryId))
        const response = await apiClient.post('/employees/import', form, { timeout: 10 * 60 * 1000 })
        return response.data
    },

    // List employees with pagination and filters
    list: async (params?: {
        page?: number
        per_page?: number
        search?: string
        status?: string
        role?: string
        site_id?: number
        category_id?: number | 'none'
        job_id?: number
    }): Promise<PaginatedResponse<Employee>> => {
        const response = await apiClient.get('/employees', { params })
        const result = response.data

        // Laravel's paginator serializes metadata at the top level. Normalize it
        // once here so the employee page has one stable response contract.
        if (result.meta) return result as PaginatedResponse<Employee>

        return {
            data: result.data ?? [],
            meta: {
                current_page: result.current_page ?? 1,
                last_page: result.last_page ?? 1,
                per_page: result.per_page ?? params?.per_page ?? 25,
                total: result.total ?? 0,
                from: result.from ?? null,
                to: result.to ?? null,
            },
            links: {
                first: result.first_page_url ?? null,
                last: result.last_page_url ?? null,
                prev: result.prev_page_url ?? null,
                next: result.next_page_url ?? null,
            },
        }
    },

    // Get employee by ID
    getById: async (id: number): Promise<Employee> => {
        const response = await apiClient.get<{ data: Employee }>(`/employees/${id}`)
        return response.data.data
    },

    // Create new employee
    create: async (data: CreateEmployeeRequest): Promise<{ data: Employee; login_credentials?: { username: string; email: string; password: string; message: string } }> => {
        const response = await apiClient.post<{ data: Employee; login_credentials?: { username: string; email: string; password: string; message: string } }>('/employees', data)
        return response.data
    },

    // Update employee
    update: async (id: number, data: UpdateEmployeeRequest): Promise<Employee> => {
        const response = await apiClient.put<{ data: Employee }>(`/employees/${id}`, data)
        return response.data.data
    },

    // Delete employee
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/employees/${id}`)
    },

    // Get employee salary details for a period
    getSalary: async (id: number, periodId: number) => {
        const response = await apiClient.get(`/employees/${id}/salary`, {
            params: { period_id: periodId }
        })
        return response.data
    },

    // Get employee salary history
    getSalaryHistory: async (id: number, params?: { start_date?: string, end_date?: string }) => {
        const response = await apiClient.get(`/employees/${id}/salary/history`, { params })
        return response.data
    },

    // Add salary adjustment
    addSalaryAdjustment: async (id: number, data: {
        payroll_period_id: number
        amount: number
        reason: string
        adjustment_date: string
    }) => {
        const response = await apiClient.post(`/employees/${id}/salary/adjustment`, data)
        return response.data
    },

    // Get employee alerts (panic / incidents)
    getAlerts: async (id: number, params?: { type?: string; start_date?: string; end_date?: string }): Promise<EmployeeAlert[]> => {
        const response = await apiClient.get<EmployeeAlert[]>(`/employees/${id}/alerts`, { params })
        return response.data
    },
}
