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
    client_id?: number | null
    site_id?: number | null
    batch_id?: string | null
    batch_name?: string | null
    client?: {
        id: number
        company_name: string
    } | null
    site?: {
        id: number
        site_name: string
    } | null
    current_assignment?: AssetAssignment
    assignments?: AssetAssignment[]
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
    assignment_document_url?: string | null
    assignment_condition_image_url?: string | null
    return_document_url?: string | null
    return_condition_image_url?: string | null
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

export interface AssetAssignmentHistoryResponse {
    current_page: number
    data: AssetAssignment[]
    total: number
    last_page: number
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

export interface AssetBatch {
    batch_id: string
    batch_name: string
    asset_name: string
    category: string
    condition: string
    quantity: number
    available_quantity: number
    assigned_quantity: number
    client?: Asset['client']
    site?: Asset['site']
    created_at: string
}

export interface AssetBatchDetails {
    batch_id: string
    batch_name: string
    quantity: number
    assets: Asset[]
}

export interface CreateAssetRequest {
    asset_code: string
    name: string
    category: string
    description?: string
    purchase_date?: string
    value?: number
    condition?: string
    client_id?: number | null
    site_id?: number | null
    quantity?: number
}

export interface UpdateAssetRequest {
    asset_code?: string
    name?: string
    category?: string
    description?: string
    purchase_date?: string
    value?: number
    condition?: string
    client_id?: number | null
    site_id?: number | null
}

export type CreateAssetResponse = Asset | {
    message: string
    count: number
    data: Asset[]
}

export interface AssignAssetRequest {
    employee_id: number
    notes?: string
    assignment_document?: File
    assignment_condition_image?: File
}

export interface ReturnAssetRequest {
    condition?: string
    notes?: string
    return_document?: File
    return_condition_image?: File
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

    create: async (data: CreateAssetRequest): Promise<CreateAssetResponse> => {
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
        const formData = new FormData()
        formData.append('employee_id', data.employee_id.toString())
        if (data.notes) formData.append('notes', data.notes)
        if (data.assignment_document) formData.append('assignment_document', data.assignment_document)
        if (data.assignment_condition_image) formData.append('assignment_condition_image', data.assignment_condition_image)
        const response = await apiClient.post(`/assets/${id}/assign`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return response.data
    },

    returnAsset: async (id: number, data: ReturnAssetRequest): Promise<AssetAssignment> => {
        const formData = new FormData()
        if (data.condition) formData.append('condition', data.condition)
        if (data.notes) formData.append('notes', data.notes)
        if (data.return_document) formData.append('return_document', data.return_document)
        if (data.return_condition_image) formData.append('return_condition_image', data.return_condition_image)
        const response = await apiClient.post(`/assets/${id}/return`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
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

    batches: async (params?: { search?: string }): Promise<{ data: AssetBatch[]; total: number }> => {
        const response = await apiClient.get('/assets/batches', { params })
        return response.data
    },

    getBatch: async (batchId: string): Promise<AssetBatchDetails> => {
        const response = await apiClient.get(`/assets/batches/${batchId}`)
        return response.data
    },

    assignmentHistory: async (params?: { page?: number; search?: string; per_page?: number }): Promise<AssetAssignmentHistoryResponse> => {
        const response = await apiClient.get('/assets/assignment-history', { params })
        return response.data
    },

    deleteAssignment: async (assetId: number, assignmentId: number): Promise<void> => {
        await apiClient.delete(`/assets/${assetId}/assignments/${assignmentId}`)
    },
}

export default assetsApi
