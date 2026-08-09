import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { crmApi, type CreateLeadRequest, type CreateActivityRequest, type CreateBidRequest, type BidStatus } from "@/api/endpoints/crm"
import { toast } from "sonner"

// Leads
export const crmKeys = {
    leads: (params: any) => ["crm", "leads", params] as const,
    lead: (id: number) => ["crm", "lead", id] as const,
    bids: (params: any) => ["crm", "bids", params] as const,
    bid: (id: number) => ["crm", "bid", id] as const,
}

export const useCrmLeads = (params: any = { page: 1 }) => {
    return useQuery({
        queryKey: crmKeys.leads(params),
        queryFn: () => crmApi.listLeads(params),
    })
}

export const useCrmLead = (id: number) => {
    return useQuery({
        queryKey: crmKeys.lead(id),
        queryFn: () => crmApi.getLead(id),
        enabled: !!id,
    })
}

export const useCreateCrmLead = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateLeadRequest) => crmApi.createLead(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["crm", "leads"] })
            toast.success("Lead created successfully")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create lead")
        },
    })
}

export const useUpdateCrmLead = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateLeadRequest> }) =>
            crmApi.updateLead(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["crm", "leads"] })
            queryClient.invalidateQueries({ queryKey: ["crm", "lead"] })
            toast.success("Lead updated successfully")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update lead")
        },
    })
}

export const useDeleteCrmLead = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => crmApi.deleteLead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["crm", "leads"] })
            toast.success("Lead deleted successfully")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete lead")
        },
    })
}

export const useAddCrmActivity = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ leadId, data }: { leadId: number; data: CreateActivityRequest }) =>
            crmApi.addActivity(leadId, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: crmKeys.lead(variables.leadId) })
            queryClient.invalidateQueries({ queryKey: ["crm", "leads"] })
            toast.success("Activity added successfully")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to add activity")
        },
    })
}

// Bids
export const useBids = (params: { status?: BidStatus; page?: number; search?: string } = {}) => {
    return useQuery({
        queryKey: crmKeys.bids(params),
        queryFn: () => crmApi.listBids(params),
    })
}

export const useBid = (id: number) => {
    return useQuery({
        queryKey: crmKeys.bid(id),
        queryFn: () => crmApi.getBid(id),
        enabled: !!id,
    })
}

export const useCreateBid = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateBidRequest | FormData) => crmApi.createBid(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["crm", "bids"] })
            toast.success("Bid created successfully")
        },
        onError: (error: any) => {
            const errors = error.errors || error.response?.data?.errors
            toast.error(errors ? Object.values(errors).flat().join(" ") : error.message || error.response?.data?.message || "Failed to create bid")
        },
    })
}

export const useUpdateBid = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateBidRequest> | FormData }) =>
            crmApi.updateBid(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["crm", "bids"] })
            toast.success("Bid updated successfully")
        },
        onError: (error: any) => {
            const errors = error.errors || error.response?.data?.errors
            toast.error(errors ? Object.values(errors).flat().join(" ") : error.message || error.response?.data?.message || "Failed to update bid")
        },
    })
}

export const useDeleteBid = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => crmApi.deleteBid(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["crm", "bids"] })
            toast.success("Bid deleted successfully")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete bid")
        },
    })
}

