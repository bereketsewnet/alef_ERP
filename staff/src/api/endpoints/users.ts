import apiClient from '../axios'
import type { User } from '@/types/common.types'
import type { PaginatedResponse } from '@/types/common.types'

export interface CreateUserRequest {
    username: string
    email: string
    phone_number: string
    password: string
    password_confirmation: string
    role: string
}

export interface UpdateUserRequest {
    email?: string
    phone_number?: string
    role?: string
}

export const usersApi = {
    // List users with pagination and filters
    list: async (params?: {
        page?: number
        per_page?: number
        search?: string
        role?: string
    }): Promise<PaginatedResponse<User>> => {
        const response = await apiClient.get<PaginatedResponse<User>>('/users', { params })
        return response.data
    },

    // Get user by ID
    getById: async (id: number): Promise<User> => {
        const response = await apiClient.get<{ data: User }>(`/users/${id}`)
        return response.data.data
    },

    // Create new user
    create: async (data: CreateUserRequest): Promise<User> => {
        const response = await apiClient.post<{ data: User }>('/users', data)
        return response.data.data
    },

    // Update user
    update: async (id: number, data: UpdateUserRequest): Promise<User> => {
        const response = await apiClient.put<{ data: User }>(`/users/${id}`, data)
        return response.data.data
    },

    // Delete user
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/users/${id}`)
    },
}
