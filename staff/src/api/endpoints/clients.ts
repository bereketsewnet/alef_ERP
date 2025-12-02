import apiClient from '../axios'

export interface Client {
    id: number
    company_name: string
    contact_person: string
    contact_phone: string
    billing_cycle?: string
    tin_number?: string
    address_details?: Record<string, any>
    created_at: string
    updated_at: string
    sites?: ClientSite[]
    sites_count?: number
}

export interface ClientSite {
    id: number
    client_id: number
    site_name: string
    latitude: number
    longitude: number
    geo_radius_meters: number
    site_contact_phone?: string
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
    contact_person: string
    contact_phone: string
    billing_cycle?: string
    tin_number?: string
    address_details?: Record<string, any>
}

export interface CreateSiteRequest {
    site_name: string
    latitude: number
    longitude: number
    geo_radius_meters?: number
    site_contact_phone?: string
}

export const clientsApi = {
    list: async (page = 1): Promise<ClientListResponse> => {
        const response = await apiClient.get(`/clients?page=${page}`)
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
}
