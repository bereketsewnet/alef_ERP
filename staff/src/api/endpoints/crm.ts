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

export interface CrmServiceCategory { id:number; name:string; description?:string; is_active:boolean }
export interface CrmContractDocument { id:number; name:string; original_name:string; mime_type?:string; size_bytes?:number }
export interface CrmContract {
    id:number; client_id:number; site_id?:number; title:string; reference_number?:string; start_date:string; end_date:string;
    status:'DRAFT'|'ACTIVE'|'EXPIRED'|'TERMINATED'; contract_amount?:number; payment_frequency?:string; payment_due_day?:number;
    expiry_reminder_days:number; reminder_email?:string; agreement_summary?:string; payment_terms?:string; termination_reason?:string;
    archived_at?:string; days_remaining:number; expiry_state:'OK'|'WARNING'|'URGENT'|'EXPIRED'|'TERMINATED'; issues_count:number;
    client?:{id:number;company_name:string}; site?:{id:number;site_name:string}; categories:CrmServiceCategory[]; documents:CrmContractDocument[];
}
export interface CrmIssue { id:number; client_id:number; site_id?:number; contract_id?:number; subject:string; description:string; priority:string; status:string; action_taken?:string; client?:{company_name:string}; site?:{site_name:string}; contract?:{title:string} }

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
    category_id?: number | null
    site_id?: number | null
    category?: CrmServiceCategory | null
    client?: { id:number; company_name:string; sites?:any[] } | null
    site?: { id:number; site_name:string } | null
    documents?: {id:number;name:string;original_name:string;size_bytes?:number}[]
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
    category_id: number
    site_id?: number
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
    dashboard: async () => (await apiClient.get('/crm/dashboard')).data,
    listContracts: async (params:any={}) => (await apiClient.get('/crm/contracts',{params})).data,
    saveContract: async (data:FormData,id?:number) => (await apiClient.post(`/crm/contracts${id?`/${id}`:''}`,data)).data.data as CrmContract,
    terminateContract: async (id:number,reason:string) => { await apiClient.post(`/crm/contracts/${id}/terminate`,{reason}) },
    archiveContract: async (id:number) => { await apiClient.post(`/crm/contracts/${id}/archive`) },
    restoreContract: async (id:number) => { await apiClient.post(`/crm/contracts/${id}/restore`) },
    categories: async ():Promise<CrmServiceCategory[]> => (await apiClient.get('/crm/service-categories')).data,
    createCategory: async (name:string) => (await apiClient.post('/crm/service-categories',{name})).data,
    updateCategory: async (id:number,data:Partial<CrmServiceCategory>) => (await apiClient.put(`/crm/service-categories/${id}`,data)).data,
    listIssues: async (params:any={}) => (await apiClient.get('/crm/issues',{params})).data,
    createIssue: async (data:any) => (await apiClient.post('/crm/issues',data)).data.data,
    updateIssue: async (id:number,data:any) => (await apiClient.put(`/crm/issues/${id}`,data)).data.data,
    downloadContractDocument: async (id:number) => (await apiClient.get(`/crm/contract-documents/${id}/download`,{responseType:'blob'})).data as Blob,
    renameContractDocument: async (id:number,name:string) => (await apiClient.patch(`/crm/contract-documents/${id}`,{name})).data.data,
    deleteContractDocument: async (id:number) => { await apiClient.delete(`/crm/contract-documents/${id}`) },
    exportContracts: async () => (await apiClient.get('/crm/reports/contracts.csv',{responseType:'blob'})).data as Blob,

    // Bids
    listBids: async (params: any = { page: 1 }): Promise<BidListResponse> => {
        const response = await apiClient.get("/bids", { params })
        return response.data
    },
    getBid: async (id: number): Promise<Bid> => {
        const response = await apiClient.get<{ data: Bid }>(`/bids/${id}`)
        return response.data.data
    },
    createBid: async (data: CreateBidRequest | FormData): Promise<Bid> => {
        const response = await apiClient.post<{ data: Bid }>("/bids", data)
        return response.data.data
    },
    updateBid: async (id: number, data: Partial<CreateBidRequest> | FormData): Promise<Bid> => {
        const response = data instanceof FormData
            ? await apiClient.post<{ data: Bid }>(`/bids/${id}`, data)
            : await apiClient.put<{ data: Bid }>(`/bids/${id}`, data)
        return response.data.data
    },
    downloadBidDocument: async (id:number):Promise<Blob> => (await apiClient.get(`/bids/documents/${id}/download`,{responseType:'blob'})).data,
    renameBidDocument: async (id:number,name:string) => (await apiClient.patch(`/bids/documents/${id}`,{name})).data.data,
    deleteBidDocument: async (id:number) => { await apiClient.delete(`/bids/documents/${id}`) },
    deleteBid: async (id: number): Promise<void> => {
        await apiClient.delete(`/bids/${id}`)
    },
}

