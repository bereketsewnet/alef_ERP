import apiClient from "../axios"

export interface Incident {
    id: number
    site_id: number
    reported_by_employee_id: number
    report_type: 'INCIDENT' | 'PANIC' | 'OBSERVATION' | 'MAINTENANCE'
    description: string
    severity_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    evidence_media_urls: string[] | null
    created_at: string
    updated_at: string
    site?: {
        id: number
        name: string
    }
    reported_by?: {
        id: number
        first_name: string
        last_name: string
    }
}

export interface IncidentListResponse {
    data: Incident[]
    current_page: number
    last_page: number
    total: number
}

export const incidentsApi = {
    list: async (params?: any): Promise<IncidentListResponse> => {
        const response = await apiClient.get('/incidents', { params })
        return response.data
    },
    create: async (data: any): Promise<Incident> => {
        const response = await apiClient.post('/incidents', data)
        return response.data
    },
    panic: async (data: { site_id: number, description: string }): Promise<any> => {
        const response = await apiClient.post('/incidents/panic', data)
        return response.data
    }
}
