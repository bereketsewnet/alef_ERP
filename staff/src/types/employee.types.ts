export interface Employee {
    id: number
    first_name: string
    last_name: string
    email: string
    phone: string
    date_of_birth: string
    hire_date: string
    role: string
    salary: number
    bank_account: string | null
    telegram_id: string | null
    status: "active" | "probation" | "terminated"
    created_at: string
    updated_at: string
}

export interface Guarantor {
    id: number
    employee_id: number
    name: string
    relationship: string
    phone: string
    address: string
    created_at: string
    updated_at: string
}

export interface Document {
    id: number
    employee_id: number
    type: "police_clearance" | "id_card" | "certificate" | "other"
    file_url: string
    expires_at: string | null
    uploaded_at: string
}

export interface CreateEmployeeRequest {
    first_name: string
    last_name: string
    email: string
    phone: string
    date_of_birth: string
    hire_date: string
    role: string
    salary: number
    bank_account?: string
    guarantor?: {
        name: string
        relationship: string
        phone: string
        address: string
    }
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
    status?: Employee["status"]
}
