import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/api/axios"

export interface InvoiceItem {
    id?: number
    description: string
    quantity: number
    unit_price: number
    total?: number
}

export interface Invoice {
    id: number
    client_id: number
    invoice_number: string
    invoice_date: string
    due_date: string
    total_amount: number
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE'
    client?: {
        id: number
        company_name: string
    }
    items?: InvoiceItem[]
    created_at: string
}

export interface InvoiceStats {
    total_invoiced: number
    paid: number
    pending: number
    overdue: number
    count_total: number
    count_paid: number
}

export const invoiceKeys = {
    all: ['invoices'] as const,
    list: (params: any) => [...invoiceKeys.all, 'list', params] as const,
    details: (id: number) => [...invoiceKeys.all, 'detail', id] as const,
    stats: () => [...invoiceKeys.all, 'stats'] as const,
}

const invoiceApi = {
    list: async (params?: any) => {
        const response = await apiClient.get('/invoices', { params })
        return response.data
    },
    get: async (id: number) => {
        const response = await apiClient.get<{ data: Invoice }>(`/invoices/${id}`)
        return response.data.data
    },
    create: async (data: any) => {
        const response = await apiClient.post('/invoices', data)
        return response.data
    },
    getStats: async () => {
        const response = await apiClient.get<{ data: InvoiceStats }>('/invoices/stats')
        return response.data.data
    },
    download: async (id: number) => {
        const response = await apiClient.get(`/invoices/${id}/download`, { responseType: 'blob' })
        return response.data
    }
}

export function useInvoices(params?: any) {
    return useQuery({
        queryKey: invoiceKeys.list(params),
        queryFn: () => invoiceApi.list(params),
    })
}

export function useInvoice(id: number) {
    return useQuery({
        queryKey: invoiceKeys.details(id),
        queryFn: () => invoiceApi.get(id),
        enabled: !!id,
    })
}

export function useInvoiceStats() {
    return useQuery({
        queryKey: invoiceKeys.stats(),
        queryFn: () => invoiceApi.getStats(),
    })
}

export function useCreateInvoice() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: invoiceApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
        },
    })
}

export function useDownloadInvoice() {
    return useMutation({
        mutationFn: (id: number) => invoiceApi.download(id),
    })
}
