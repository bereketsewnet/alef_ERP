import type { User } from './common.types'

export interface LoginRequest {
    email: string
    password: string
    remember?: boolean
}

export interface LoginResponse {
    token: string
    user: User
    expires_at: string
}

export interface RefreshTokenResponse {
    token: string
    expires_at: string
}

export interface ForgotPasswordRequest {
    email: string
}

export interface ResetPasswordRequest {
    email: string
    token: string
    password: string
    password_confirmation: string
}
