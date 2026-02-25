import apiClient from '../axios'

export type ScreeningCategory =
    | 'security'
    | 'cleaning'
    | 'driving'
    | 'loading_unloading'
    | 'nursing'
    | 'general_service'

export interface EmployeeScreening {
    id: number
    employee_id: number
    category: string
    screening_date: string | null
    interview_passed: boolean | null
    written_exam_required: boolean
    written_score: number | null
    written_passed: boolean | null
    practical_exam_required: boolean
    practical_score: number | null
    practical_passed: boolean | null
    overall_passed: boolean | null
    vehicle_rental_cost: string | null
    vehicle_rental_paid_by_candidate: string | null
    vehicle_rental_paid_by_company: string | null
    notes: string | null
    created_at: string
    updated_at: string
}

export interface CreateEmployeeScreeningRequest {
    category: ScreeningCategory | string
    screening_date?: string
    interview_passed?: boolean | null
    written_exam_required?: boolean
    written_score?: number | null
    written_passed?: boolean | null
    practical_exam_required?: boolean
    practical_score?: number | null
    practical_passed?: boolean | null
    overall_passed?: boolean | null
    vehicle_rental_cost?: number | null
    vehicle_rental_paid_by_candidate?: number | null
    vehicle_rental_paid_by_company?: number | null
    notes?: string | null
}

export type UpdateEmployeeScreeningRequest = Partial<CreateEmployeeScreeningRequest>

export const employeeScreeningsApi = {
    list: async (employeeId: number): Promise<EmployeeScreening[]> => {
        const response = await apiClient.get<EmployeeScreening[]>(`/employees/${employeeId}/screenings`)
        return response.data
    },

    create: async (employeeId: number, data: CreateEmployeeScreeningRequest): Promise<EmployeeScreening> => {
        const response = await apiClient.post<EmployeeScreening>(`/employees/${employeeId}/screenings`, data)
        return response.data
    },

    update: async (
        employeeId: number,
        screeningId: number,
        data: UpdateEmployeeScreeningRequest
    ): Promise<EmployeeScreening> => {
        const response = await apiClient.put<EmployeeScreening>(
            `/employees/${employeeId}/screenings/${screeningId}`,
            data
        )
        return response.data
    },

    delete: async (employeeId: number, screeningId: number): Promise<void> => {
        await apiClient.delete(`/employees/${employeeId}/screenings/${screeningId}`)
    },
}

