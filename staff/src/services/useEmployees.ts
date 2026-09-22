import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { employeesApi, type CreateEmployeeRequest, type UpdateEmployeeRequest } from '@/api/endpoints/employees'
import { toast } from '@/components/ui/use-toast'

// Query keys
export const employeeKeys = {
    all: ['employees'] as const,
    lists: () => [...employeeKeys.all, 'list'] as const,
    list: (filters?: any) => [...employeeKeys.lists(), filters] as const,
    details: () => [...employeeKeys.all, 'detail'] as const,
    detail: (id: number) => [...employeeKeys.details(), id] as const,
    assignmentOptions: () => [...employeeKeys.all, 'assignment-options'] as const,
}

export function useEmployeeAssignmentOptions(enabled = true) {
    return useQuery({
        queryKey: employeeKeys.assignmentOptions(),
        queryFn: employeesApi.assignmentOptions,
        enabled,
        staleTime: 60_000,
    })
}

// Get employees list with pagination
export function useEmployees(params?: {
    page?: number
    per_page?: number
    search?: string
    status?: string
    role?: string
    site_id?: number
    category_id?: number | 'none'
    job_id?: number
}) {
    return useQuery({
        queryKey: employeeKeys.list(params),
        queryFn: () => employeesApi.list(params),
    })
}

// Get employee by ID
export function useEmployee(id: number) {
    return useQuery({
        queryKey: employeeKeys.detail(id),
        queryFn: () => employeesApi.getById(id),
        enabled: !!id,
    })
}

// Create employee mutation
export function useCreateEmployee() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateEmployeeRequest) => employeesApi.create(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
            toast({
                title: 'Employee created',
                description: response.login_credentials 
                    ? 'Employee created successfully. Please save the login credentials.'
                    : 'The employee has been created successfully',
            })
            // Return the full response including credentials
            return response
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to create employee',
            })
        },
    })
}

// Update employee mutation
export function useUpdateEmployee() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateEmployeeRequest }) =>
            employeesApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
            queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) })
            toast({
                title: 'Employee updated',
                description: 'The employee has been updated successfully',
            })
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update employee',
            })
        },
    })
}

// Delete employee mutation
export function useDeleteEmployee() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => employeesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
            toast({
                title: 'Employee deleted',
                description: 'The employee has been deleted successfully',
            })
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to delete employee',
            })
        },
    })
}

export function useImportEmployees() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ file, defaultCategoryId, defaultCalendar }: {
            file: File
            defaultCategoryId: number | null
            defaultCalendar: 'EC' | 'GC'
        }) => employeesApi.importSpreadsheet(file, defaultCategoryId, defaultCalendar),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
            toast({
                title: result.summary.errors ? 'Employee import completed with errors' : 'Employee import completed',
                description: result.message,
                variant: result.summary.errors ? 'destructive' : 'default',
            })
        },
    })
}

export async function downloadEmployeeImportBundle() {
    const blob = await employeesApi.downloadImportBundle()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'employee_import_complete_package.zip'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}
