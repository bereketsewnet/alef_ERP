import type { User } from './common.types'

export interface LoginRequest {
    login: string
    password: string
    remember?: boolean
}

export interface LoginResponse {
    access_token: string
    token_type: string
    expires_in: number
    user: User
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
