import api from '../axios'
import type { Incident, IncidentPayload, PaginatedResponse } from '@/types'

export const incidentApi = {
    create: async (payload: IncidentPayload): Promise<Incident> => {
        const formData = new FormData()

        if (payload.site_id) {
            formData.append('site_id', payload.site_id.toString())
        }
        formData.append('report_type', payload.report_type)
        formData.append('description', payload.description)
        formData.append('severity_level', payload.severity_level)

        if (payload.images) {
            payload.images.forEach((image) => {
                formData.append('evidence[]', image)
            })
        }

        const response = await api.post<Incident>('/incidents', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data
    },

    /**
     * Panic alert from member portal.
     * Backend expects: { site_id, description }
     */
    panic: async (site_id: number, description: string): Promise<{ message: string }> => {
        const response = await api.post('/incidents/panic', {
            site_id,
            description,
        })
        return response.data
    },

    getAll: async (): Promise<PaginatedResponse<Incident>> => {
        const response = await api.get<PaginatedResponse<Incident>>('/incidents')
        return response.data
    },
}
