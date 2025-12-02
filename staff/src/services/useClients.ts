import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi, type CreateClientRequest, type CreateSiteRequest } from '@/api/endpoints/clients'
import { toast } from 'sonner'

export const useClients = (page = 1) => {
    return useQuery({
        queryKey: ['clients', page],
        queryFn: () => clientsApi.list(page),
    })
}

export const useClient = (id: number) => {
    return useQuery({
        queryKey: ['client', id],
        queryFn: () => clientsApi.getById(id),
        enabled: !!id,
    })
}

export const useCreateClient = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateClientRequest) => clientsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            toast.success('Client created successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create client')
        },
    })
}

export const useUpdateClient = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateClientRequest> }) =>
            clientsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            queryClient.invalidateQueries({ queryKey: ['client'] })
            toast.success('Client updated successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update client')
        },
    })
}

export const useDeleteClient = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => clientsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            toast.success('Client deleted successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete client')
        },
    })
}

export const useClientSites = (clientId: number) => {
    return useQuery({
        queryKey: ['client-sites', clientId],
        queryFn: () => clientsApi.getSites(clientId),
        enabled: !!clientId,
    })
}

export const useCreateSite = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ clientId, data }: { clientId: number; data: CreateSiteRequest }) =>
            clientsApi.createSite(clientId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            queryClient.invalidateQueries({ queryKey: ['client-sites'] })
            toast.success('Site created successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create site')
        },
    })
}
