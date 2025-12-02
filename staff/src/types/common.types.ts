// Common types used across the application

export interface PaginatedResponse<T> {
    data: T[]
    meta: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
    links: {
        first: string | null
        last: string | null
        prev: string | null
        next: string | null
    }
}

export interface ApiError {
    message: string
    errors?: Record<string, string[]>
    status?: number
}

export interface SuccessResponse<T = any> {
    success: boolean
    message?: string
    data?: T
}

export enum Role {
    OPS_MANAGER = 'ops_manager',
    HR = 'hr',
    FINANCE = 'finance',
    SITE_SUPERVISOR = 'site_supervisor',
    ADMIN = 'admin',
}

export enum Permission {
    VIEW_DASHBOARD = 'view_dashboard',
    MANAGE_ROSTER = 'manage_roster',
    MANAGE_EMPLOYEES = 'manage_employees',
    VIEW_ATTENDANCE = 'view_attendance',
    VERIFY_ATTENDANCE = 'verify_attendance',
    MANAGE_ASSETS = 'manage_assets',
    RUN_PAYROLL = 'run_payroll',
    MANAGE_BILLING = 'manage_billing',
    VIEW_REPORTS = 'view_reports',
    MANAGE_SETTINGS = 'manage_settings',
}

export interface User {
    id: number
    name: string
    email: string
    role: Role
    permissions: Permission[]
    created_at: string
    updated_at: string
}
