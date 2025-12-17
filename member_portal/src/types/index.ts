// User & Auth Types
export interface User {
    id: number
    email: string
    phone_number: string
    role: 'ADMIN' | 'MANAGER' | 'STAFF'
    employee_id: number | null
    employee?: Employee
}

export interface Employee {
    id: number
    employee_code: string
    first_name: string
    last_name: string
    phone_number: string
    email: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    profile_photo_url?: string
    employment_status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED'
}

export interface AuthResponse {
    access_token: string
    refresh_token?: string
    token_type: string
    expires_in: number
    user: User
}

// Shift & Roster Types
export interface ShiftSchedule {
    id: number
    employee_id: number
    site_id: number
    job_id?: number
    shift_start: string
    shift_end: string
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    notes?: string
    site: ClientSite
    job?: Job
    employee?: Employee
    attendance_logs?: AttendanceLog[]
}

export interface ClientSite {
    id: number
    client_id: number
    site_name: string
    site_address: string
    latitude: number
    longitude: number
    geo_radius: number
    contact_phone?: string
    instructions?: string
}

export interface Job {
    id: number
    job_code: string
    job_name: string
    hourly_rate?: number
}

// Attendance Types
export interface AttendanceLog {
    id: number
    schedule_id: number
    employee_id?: number
    clock_in_time?: string
    clock_out_time?: string
    clock_in_latitude?: number
    clock_in_longitude?: number
    clock_out_latitude?: number
    clock_out_longitude?: number
    verification_method: 'GPS' | 'MANUAL' | 'BIOMETRIC'
    is_verified: boolean
    flagged_late: boolean
    selfie_url?: string
    created_at: string
    schedule?: ShiftSchedule
}

export interface ClockInPayload {
    schedule_id: number
    latitude: number
    longitude: number
    accuracy: number
    selfie?: File
}

export interface ClockInResponse {
    success: boolean
    message: string
    log?: AttendanceLog
    withinRadius?: boolean
    distanceMeters?: number
}

// Incident Types
export interface Incident {
    id: number
    site_id?: number
    reported_by_employee_id: number
    report_type: string
    description: string
    severity_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    evidence_media_urls?: string[]
    created_at: string
    site?: ClientSite
}

export interface IncidentPayload {
    site_id?: number
    report_type: string
    description: string
    severity_level: string
    images?: File[]
}

// Payroll Types
export interface PayrollPeriod {
    id: number
    period_name: string
    start_date: string
    end_date: string
    status: 'DRAFT' | 'GENERATED' | 'APPROVED' | 'PAID'
}

export interface PayrollItem {
    id: number
    period_id: number
    employee_id: number
    gross_salary: number
    total_deductions: number
    net_salary: number
    penalties: PayrollPenalty[]
    bonuses: PayrollBonus[]
}

export interface PayrollPenalty {
    id: number
    reason: string
    amount: number
}

export interface PayrollBonus {
    id: number
    reason: string
    amount: number
}

// Offline Queue Types
export interface QueuedAction {
    id: string
    type: 'CLOCK_IN' | 'CLOCK_OUT' | 'INCIDENT'
    payload: unknown
    timestamp: string
    status: 'PENDING' | 'SYNCING' | 'FAILED'
    retryCount: number
    error?: string
}

// GPS Types
export interface GPSPosition {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: number
}

// API Response Types
export interface PaginatedResponse<T> {
    data: T[]
    current_page: number
    last_page: number
    per_page: number
    total: number
}
