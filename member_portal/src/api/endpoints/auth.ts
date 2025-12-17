import api from '../axios'
import type { AuthResponse, User } from '@/types'

export const authApi = {
    login: async (phone: string, password: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', { login: phone, password })
        return response.data
    },

    refresh: async (): Promise<{ access_token: string }> => {
        const response = await api.post('/auth/refresh')
        return response.data
    },

    me: async (): Promise<User> => {
        const response = await api.get<User>('/auth/me')
        return response.data
    },

    logout: async (): Promise<void> => {
        await api.post('/auth/logout')
    },

    updateProfile: async (data: Partial<User>): Promise<User> => {
        const response = await api.put<User>('/auth/profile', data)
        return response.data
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        await api.post('/auth/change-password', {
            current_password: currentPassword,
            new_password: newPassword,
            new_password_confirmation: newPassword,
        })
    },
}
