import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeDocumentsApi, type UploadEmployeeDocumentRequest } from '@/api/endpoints/employeeDocuments'
import { toast } from '@/components/ui/use-toast'

export const employeeDocumentKeys = {
    all: ['employee-documents'] as const,
    list: (employeeId: number) => [...employeeDocumentKeys.all, 'list', employeeId] as const,
}

export function useEmployeeDocuments(employeeId: number) {
    return useQuery({
        queryKey: employeeDocumentKeys.list(employeeId),
        queryFn: () => employeeDocumentsApi.list(employeeId),
        enabled: !!employeeId,
    })
}

export function useUploadEmployeeDocument(employeeId: number) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: UploadEmployeeDocumentRequest) =>
            employeeDocumentsApi.upload(employeeId, data),
        onSuccess: () => {
            toast({ title: 'Document uploaded' })
            queryClient.invalidateQueries({ queryKey: employeeDocumentKeys.list(employeeId) })
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Failed to upload document',
                description: error.message,
            })
        },
    })
}

export function useDeleteEmployeeDocument(employeeId: number) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (documentId: number) =>
            employeeDocumentsApi.delete(employeeId, documentId),
        onSuccess: () => {
            toast({ title: 'Document deleted' })
            queryClient.invalidateQueries({ queryKey: employeeDocumentKeys.list(employeeId) })
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Failed to delete document',
                description: error.message,
            })
        },
    })
}

