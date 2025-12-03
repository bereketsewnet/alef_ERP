import apiClient from '../axios'
import type {
    LoginRequest,
    LoginResponse,
    RefreshTokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
} from '@/types/auth.types'
import type { User } from '@/types/common.types'

export const authApi = {
    // Login
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/auth/login', data)
        return response.data
    },

    // Logout
    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout')
    },

    // Refresh token
    refresh: async (): Promise<RefreshTokenResponse> => {
        const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh')
        return response.data
    },

    // Get current user
    me: async (): Promise<User> => {
        const response = await apiClient.get<{ user: User }>('/auth/me')
        return response.data.user
    },

    // Forgot password
    forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
        await apiClient.post('/auth/forgot-password', data)
    },

    // Reset password
    resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
        await apiClient.post('/auth/reset-password', data)
    },
}
