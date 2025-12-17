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
            payload.images.forEach((image, index) => {
                formData.append(`images[${index}]`, image)
            })
        }

        const response = await api.post<Incident>('/incidents', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data
    },

    panic: async (latitude: number, longitude: number, note?: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.post('/incidents/panic', {
            latitude,
            longitude,
            note,
        })
        return response.data
    },

    getAll: async (): Promise<PaginatedResponse<Incident>> => {
        const response = await api.get<PaginatedResponse<Incident>>('/incidents')
        return response.data
    },
}
