import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import assetsApi, {
    type AssignAssetRequest,
    type CreateAssetRequest,
    type ReturnAssetRequest,
    type UpdateAssetRequest
} from '@/api/endpoints/assets'
import { toast } from 'sonner'

// Query keys
export const assetKeys = {
    all: ['assets'] as const,
    lists: () => [...assetKeys.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...assetKeys.lists(), filters] as const,
    details: () => [...assetKeys.all, 'detail'] as const,
    detail: (id: number) => [...assetKeys.details(), id] as const,
    stats: () => [...assetKeys.all, 'stats'] as const,
    unreturned: () => [...assetKeys.all, 'unreturned'] as const,
}

// List assets with filters
export const useAssets = (params?: {
    page?: number
    search?: string
    category?: string
    condition?: string
    status?: string
}) => {
    return useQuery({
        queryKey: assetKeys.list(params || {}),
        queryFn: () => assetsApi.list(params),
    })
}

// Get single asset
export const useAsset = (id: number) => {
    return useQuery({
        queryKey: assetKeys.detail(id),
        queryFn: () => assetsApi.get(id),
        enabled: !!id,
    })
}

// Get asset statistics
export const useAssetStats = () => {
    return useQuery({
        queryKey: assetKeys.stats(),
        queryFn: () => assetsApi.stats(),
    })
}

// Get unreturned assets
export const useUnreturnedAssets = () => {
    return useQuery({
        queryKey: assetKeys.unreturned(),
        queryFn: () => assetsApi.unreturned(),
    })
}

// Create asset
export const useCreateAsset = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateAssetRequest) => assetsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
            queryClient.invalidateQueries({ queryKey: assetKeys.stats() })
            toast.success('Asset created successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create asset')
        },
    })
}

// Update asset
export const useUpdateAsset = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateAssetRequest }) =>
            assetsApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
            queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) })
            queryClient.invalidateQueries({ queryKey: assetKeys.stats() })
            toast.success('Asset updated successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update asset')
        },
    })
}

// Delete asset
export const useDeleteAsset = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => assetsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
            queryClient.invalidateQueries({ queryKey: assetKeys.stats() })
            toast.success('Asset deleted successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to delete asset')
        },
    })
}

// Assign asset to employee
export const useAssignAsset = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: AssignAssetRequest }) =>
            assetsApi.assign(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
            queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) })
            queryClient.invalidateQueries({ queryKey: assetKeys.stats() })
            queryClient.invalidateQueries({ queryKey: assetKeys.unreturned() })
            toast.success('Asset assigned successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to assign asset')
        },
    })
}

// Return asset from employee
export const useReturnAsset = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: ReturnAssetRequest }) =>
            assetsApi.returnAsset(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
            queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) })
            queryClient.invalidateQueries({ queryKey: assetKeys.stats() })
            queryClient.invalidateQueries({ queryKey: assetKeys.unreturned() })
            toast.success('Asset returned successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to return asset')
        },
    })
}
