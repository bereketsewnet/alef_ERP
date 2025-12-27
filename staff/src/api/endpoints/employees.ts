import apiClient from '../axios'
import type { PaginatedResponse } from '@/types/common.types'

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
    site_id?: number
    telegram_chat_id?: string
    created_at: string
    updated_at: string
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
}

export const employeesApi = {
    // List employees with pagination and filters
    list: async (params?: {
        page?: number
        per_page?: number
        search?: string
        status?: string
        role?: string
        site_id?: number
    }): Promise<PaginatedResponse<Employee>> => {
        const response = await apiClient.get<PaginatedResponse<Employee>>('/employees', { params })
        return response.data
    },

    // Get employee by ID
    getById: async (id: number): Promise<Employee> => {
        const response = await apiClient.get<{ data: Employee }>(`/employees/${id}`)
        return response.data.data
    },

    // Create new employee
    create: async (data: CreateEmployeeRequest): Promise<Employee> => {
        const response = await apiClient.post<{ data: Employee }>('/employees', data)
        return response.data.data
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
}
