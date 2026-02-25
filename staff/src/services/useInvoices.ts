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
        email?: string
        preferred_calendar?: 'EC' | 'GC'
    }
    items?: InvoiceItem[]
    created_at: string
    // Payment fields
    payment_date?: string
    payment_description?: string
    receipt_number?: string
    proof_image_path?: string
    proof_image_url?: string
    paid_at?: string
    paid_by?: number
    attachments?: {
        id: number
        original_name?: string
        mime_type?: string
        size_bytes?: number
        url: string
    }[]
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
    },
    send: async (id: number) => {
        const response = await apiClient.post(`/invoices/${id}/send`)
        return response.data
    },
    markAsPaid: async (id: number, data: FormData) => {
        const response = await apiClient.post(`/invoices/${id}/mark-paid`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
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

export function useSendInvoice() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => invoiceApi.send(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
        },
        onError: (error: any) => {
            // Re-throw with proper structure for UI handling
            throw error
        }
    })
}

export interface MarkAsPaidData {
    payment_date: string
    payment_description?: string
    receipt_number?: string
    // Legacy single proof image (kept for backward compatibility)
    proof_image?: File
    // New: multiple attachments (images / PDFs)
    attachments?: File[]
}

export function useMarkInvoiceAsPaid() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: MarkAsPaidData }) => {
            const formData = new FormData()
            formData.append('payment_date', data.payment_date)
            if (data.payment_description) {
                formData.append('payment_description', data.payment_description)
            }
            if (data.receipt_number) {
                formData.append('receipt_number', data.receipt_number)
            }
            if (data.proof_image) {
                formData.append('proof_image', data.proof_image)
            }
            if (data.attachments && data.attachments.length > 0) {
                data.attachments.forEach((file) => {
                    formData.append('attachments[]', file)
                })
            }
            return invoiceApi.markAsPaid(id, formData)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
        },
    })
}
