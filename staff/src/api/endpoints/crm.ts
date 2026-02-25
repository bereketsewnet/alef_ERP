import apiClient from "../axios"

// CRM Leads
export type LeadStage = "REACH" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST"

export interface CrmLead {
    id: number
    client_id?: number | null
    company_name: string
    contact_person?: string | null
    contact_phone?: string | null
    email?: string | null
    source?: string | null
    stage: LeadStage
    expected_value?: number | null
    probability?: number | null
    next_action_date?: string | null
    next_action_note?: string | null
    last_contacted_at?: string | null
    notes?: string | null
    assigned_to?: number | null
    created_by?: number | null
    created_at: string
    updated_at: string
}

export interface CrmLeadListResponse {
    current_page: number
    data: CrmLead[]
    first_page_url: string
    from: number | null
    last_page: number
    last_page_url: string
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number | null
    total: number
}

export interface CreateLeadRequest {
    company_name: string
    contact_person?: string
    contact_phone?: string
    email?: string
    source?: string
    stage?: LeadStage
    expected_value?: number
    probability?: number
    next_action_date?: string
    next_action_note?: string
    notes?: string
    client_id?: number
}

export interface CrmActivity {
    id: number
    lead_id: number
    type: string
    subject?: string | null
    description?: string | null
    due_at?: string | null
    completed_at?: string | null
    created_by?: number | null
    created_at: string
    updated_at: string
}

export interface CreateActivityRequest {
    type: string
    subject?: string
    description?: string
    due_at?: string
    completed_at?: string
}

// Bids
export type BidStatus = "POTENTIAL" | "APPLIED" | "WON" | "LOST" | "NOT_ELIGIBLE"

export interface Bid {
    id: number
    client_id?: number | null
    lead_id?: number | null
    title: string
    reference_number?: string | null
    issuer?: string | null
    submission_deadline?: string | null
    estimated_value?: number | null
    submitted_value?: number | null
    submitted_at?: string | null
    result_date?: string | null
    status: BidStatus
    notes?: string | null
    responsible_user_id?: number | null
    created_at: string
    updated_at: string
}

export interface BidListResponse {
    current_page: number
    data: Bid[]
    first_page_url: string
    from: number | null
    last_page: number
    last_page_url: string
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number | null
    total: number
}

export interface CreateBidRequest {
    title: string
    reference_number?: string
    issuer?: string
    submission_deadline?: string
    estimated_value?: number
    submitted_value?: number
    submitted_at?: string
    result_date?: string
    status?: BidStatus
    notes?: string
    client_id?: number
    lead_id?: number
}

export const crmApi = {
    // Leads
    listLeads: async (params: any = { page: 1 }): Promise<CrmLeadListResponse> => {
        const response = await apiClient.get("/crm/leads", { params })
        return response.data
    },
    getLead: async (id: number): Promise<CrmLead> => {
        const response = await apiClient.get<{ data: CrmLead }>(`/crm/leads/${id}`)
        return response.data.data
    },
    createLead: async (data: CreateLeadRequest): Promise<CrmLead> => {
        const response = await apiClient.post<{ data: CrmLead }>("/crm/leads", data)
        return response.data.data
    },
    updateLead: async (id: number, data: Partial<CreateLeadRequest>): Promise<CrmLead> => {
        const response = await apiClient.put<{ data: CrmLead }>(`/crm/leads/${id}`, data)
        return response.data.data
    },
    deleteLead: async (id: number): Promise<void> => {
        await apiClient.delete(`/crm/leads/${id}`)
    },
    addActivity: async (leadId: number, data: CreateActivityRequest): Promise<CrmActivity> => {
        const response = await apiClient.post<{ data: CrmActivity }>(`/crm/leads/${leadId}/activities`, data)
        return response.data.data
    },

    // Bids
    listBids: async (params: any = { page: 1 }): Promise<BidListResponse> => {
        const response = await apiClient.get("/bids", { params })
        return response.data
    },
    getBid: async (id: number): Promise<Bid> => {
        const response = await apiClient.get<{ data: Bid }>(`/bids/${id}`)
        return response.data.data
    },
    createBid: async (data: CreateBidRequest): Promise<Bid> => {
        const response = await apiClient.post<{ data: Bid }>("/bids", data)
        return response.data.data
    },
    updateBid: async (id: number, data: Partial<CreateBidRequest>): Promise<Bid> => {
        const response = await apiClient.put<{ data: Bid }>(`/bids/${id}`, data)
        return response.data.data
    },
    deleteBid: async (id: number): Promise<void> => {
        await apiClient.delete(`/bids/${id}`)
    },
}

