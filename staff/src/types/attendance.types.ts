export interface AttendanceLog {
    id: number
    employee_id: number
    employee_name: string
    site_id: number
    site_name: string
    clock_type: "IN" | "OUT"
    timestamp: string
    latitude: number
    longitude: number
    distance_meters: number
    photo_url: string | null
    is_verified: boolean
    verified_by: number | null
    verified_at: string | null
    flags: string[]
    telegram_init_data: any
    created_at: string
}

export interface AttendanceFilters {
    employee_id?: number
    site_id?: number
    date_from?: string
    date_to?: string
    clock_type?: "IN" | "OUT"
    is_verified?: boolean
}
