import apiClient from '../axios'

export interface Asset {
    id: number
    asset_code: string
    name: string
    category: string
    condition: string
    purchase_date: string | null
    value: string
    description: string | null
    status: string
    current_assignment_status: string
    created_at: string
    updated_at: string
    deleted_at: string | null
    current_assignment?: AssetAssignment
}

export interface AssetAssignment {
    id: number
    asset_id: number
    assigned_to_employee_id: number
    assigned_at: string
    returned_at: string | null
    return_condition: string | null
    notes: string | null
    assigned_by_user_id: number
    returned_by_user_id: number | null
    created_at: string
    updated_at: string
    employee?: {
        id: number
        first_name: string
        last_name: string
        employee_code: string
    }
    asset?: Asset
}

export interface AssetsListResponse {
    current_page: number
    data: Asset[]
    from: number
    to: number
    total: number
    last_page: number
    per_page: number
    prev_page_url: string | null
    next_page_url: string | null
}

export interface AssetStats {
    total: number
    available: number
    assigned: number
    maintenance: number
}

export interface CreateAssetRequest {
    asset_code: string
    name: string
    category: string
    description?: string
    purchase_date?: string
    value?: number
    condition?: string
}

export interface UpdateAssetRequest {
    asset_code?: string
    name?: string
    category?: string
    description?: string
    purchase_date?: string
    value?: number
    condition?: string
}

export interface AssignAssetRequest {
    employee_id: number
    notes?: string
}

export interface ReturnAssetRequest {
    condition?: string
    notes?: string
}

const assetsApi = {
    list: async (params?: {
        page?: number
        search?: string
        category?: string
        condition?: string
        status?: string
    }): Promise<AssetsListResponse> => {
        const response = await apiClient.get('/assets', { params })
        return response.data
    },

    get: async (id: number): Promise<Asset> => {
        const response = await apiClient.get(`/assets/${id}`)
        return response.data
    },

    create: async (data: CreateAssetRequest): Promise<Asset> => {
        const response = await apiClient.post('/assets', data)
        return response.data
    },

    update: async (id: number, data: UpdateAssetRequest): Promise<Asset> => {
        const response = await apiClient.put(`/assets/${id}`, data)
        return response.data
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/assets/${id}`)
    },

    assign: async (id: number, data: AssignAssetRequest): Promise<AssetAssignment> => {
        const response = await apiClient.post(`/assets/${id}/assign`, data)
        return response.data
    },

    returnAsset: async (id: number, data: ReturnAssetRequest): Promise<AssetAssignment> => {
        const response = await apiClient.post(`/assets/${id}/return`, data)
        return response.data
    },

    unreturned: async (): Promise<Asset[]> => {
        const response = await apiClient.get('/assets/unreturned')
        return response.data
    },

    stats: async (): Promise<AssetStats> => {
        const response = await apiClient.get('/assets/stats')
        return response.data
    },
}

export default assetsApi
