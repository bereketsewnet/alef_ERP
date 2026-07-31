import apiClient from '../axios'
import type { User } from '@/types/common.types'

export type PreferredCalendar = 'EC' | 'GC'

export interface Client {
    id: number
    company_name: string
    description?: string
    contact_person: string
    contact_phone: string
    email?: string
    billing_cycle?: string
    payment_due_day?: number
    payment_grace_days?: number
    late_penalty_type?: 'FIXED' | 'PERCENTAGE'
    late_penalty_value?: number
    late_penalty_recurring?: boolean
    preferred_calendar?: PreferredCalendar // EC = Ethiopian, GC = Gregorian (Billing & Invoices)
    tin_number?: string
    address_details?: Record<string, any>
    created_at: string
    updated_at: string
    supervisors?: User[]
    sites?: ClientSite[]
    sites_count?: number
}

export interface ClientSite {
    id: number
    client_id: number
    site_name: string
    description?: string
    latitude: number
    longitude: number
    geo_radius_meters: number
    site_contact_phone?: string
    email?: string
    created_at: string
    updated_at: string
}

export interface ClientListResponse {
    current_page: number
    data: Client[]
    first_page_url: string
    from: number
    last_page: number
    last_page_url: string
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number
    total: number
}

export interface CreateClientRequest {
    company_name: string
    description?: string
    contact_person: string
    contact_phone: string
    email?: string
    billing_cycle?: string
    payment_due_day?: number
    payment_grace_days?: number
    late_penalty_type?: 'FIXED' | 'PERCENTAGE'
    late_penalty_value?: number
    late_penalty_recurring?: boolean
    preferred_calendar?: PreferredCalendar
    tin_number?: string
    address_details?: Record<string, any>
}

export interface CreateSiteRequest {
    site_name: string
    description?: string
    latitude: number
    longitude: number
    geo_radius_meters?: number
    site_contact_phone?: string
    email?: string
    supervisor_user_ids?: number[]
}

export const clientsApi = {
    list: async (params: any = { page: 1 }): Promise<ClientListResponse> => {
        const response = await apiClient.get('/clients', { params })
        return response.data
    },

    getById: async (id: number): Promise<Client> => {
        const response = await apiClient.get(`/clients/${id}`)
        return response.data
    },

    create: async (data: CreateClientRequest): Promise<Client> => {
        const response = await apiClient.post('/clients', data)
        return response.data
    },

    update: async (id: number, data: Partial<CreateClientRequest>): Promise<Client> => {
        const response = await apiClient.put(`/clients/${id}`, data)
        return response.data
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/clients/${id}`)
    },

    // Site management
    getSites: async (clientId: number): Promise<ClientSite[]> => {
        const response = await apiClient.get(`/clients/${clientId}/sites`)
        return response.data
    },

    createSite: async (clientId: number, data: CreateSiteRequest): Promise<ClientSite> => {
        const response = await apiClient.post(`/clients/${clientId}/sites`, data)
        return response.data
    },

    deleteSite: async (clientId: number, siteId: number): Promise<void> => {
        await apiClient.delete(`/clients/${clientId}/sites/${siteId}`)
    },

    updateSite: async (clientId: number, siteId: number, data: Partial<CreateSiteRequest>): Promise<ClientSite> => {
        const response = await apiClient.put(`/clients/${clientId}/sites/${siteId}`, data)
        return response.data
    },

    getSiteStaffOptions: async (): Promise<User[]> => {
        const response = await apiClient.get('/clients/site-staff-options')
        return response.data
    },

    updateSiteSupervisors: async (clientId: number, siteId: number, supervisorUserIds: number[]): Promise<ClientSite> => {
        const response = await apiClient.put(`/clients/${clientId}/sites/${siteId}/supervisors`, {
            supervisor_user_ids: supervisorUserIds,
        })
        return response.data
    },
}
