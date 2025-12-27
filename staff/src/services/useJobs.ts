import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getJobCategories,
    createJobCategory,
    updateJobCategory,
    deleteJobCategory,
    getJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
    addJobSkill,
    removeJobSkill,
    getEmployeeJobs,
    assignJobToEmployee,
    updateEmployeeJob,
    removeJobFromEmployee,
    setEmployeePrimaryJob,
    getSiteJobs,
    addJobToSite,
    updateSiteJob,
    removeJobFromSite,
    getEmployeesByJob,
} from '../api/endpoints/jobs';
import type {
    CreateJobCategoryRequest,
    CreateJobRequest,
    AssignJobRequest,
    AddSiteJobRequest,
} from '../api/endpoints/jobs';

// --- Job Categories ---

export function useJobCategories(activeOnly?: boolean) {
    return useQuery({
        queryKey: ['job-categories', activeOnly],
        queryFn: () => getJobCategories(activeOnly),
    });
}

export function useCreateJobCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateJobCategoryRequest) => createJobCategory(data),
        onSuccess: () => {
            toast.success('Job category created');
            queryClient.invalidateQueries({ queryKey: ['job-categories'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create category'),
    });
}

export function useUpdateJobCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateJobCategoryRequest> }) =>
            updateJobCategory(id, data),
        onSuccess: () => {
            toast.success('Job category updated');
            queryClient.invalidateQueries({ queryKey: ['job-categories'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update category'),
    });
}

export function useDeleteJobCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteJobCategory(id),
        onSuccess: () => {
            toast.success('Job category deleted');
            queryClient.invalidateQueries({ queryKey: ['job-categories'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete category'),
    });
}

// --- Jobs ---

export function useJobs(params?: { category_id?: number; active_only?: boolean; search?: string }) {
    const query = useQuery({
        queryKey: ['jobs', params],
        queryFn: () => getJobs(params),
    });
    
    // Debug logging
    if (query.data) {
        console.log('[useJobs] Query successful, received data:', query.data);
        console.log('[useJobs] Data type:', typeof query.data);
        console.log('[useJobs] Is array:', Array.isArray(query.data));
        console.log('[useJobs] Data length:', Array.isArray(query.data) ? query.data.length : 'N/A');
    }
    if (query.error) {
        console.error('[useJobs] Query error:', query.error);
    }
    
    return query;
}

export function useJob(id: number) {
    return useQuery({
        queryKey: ['job', id],
        queryFn: () => getJob(id),
        enabled: !!id,
    });
}

export function useCreateJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateJobRequest) => createJob(data),
        onSuccess: () => {
            toast.success('Job created');
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create job'),
    });
}

export function useUpdateJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateJobRequest> }) => updateJob(id, data),
        onSuccess: (_data, variables) => {
            toast.success('Job updated');
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.invalidateQueries({ queryKey: ['job', variables.id] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update job'),
    });
}

export function useDeleteJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteJob(id),
        onSuccess: () => {
            toast.success('Job deleted');
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete job'),
    });
}

// --- Job Skills ---

export function useAddJobSkill() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ jobId, data }: { jobId: number; data: { skill_name: string; is_required?: boolean } }) =>
            addJobSkill(jobId, data),
        onSuccess: (_data, variables) => {
            toast.success('Skill added');
            queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add skill'),
    });
}

export function useRemoveJobSkill() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ jobId, skillId }: { jobId: number; skillId: number }) => removeJobSkill(jobId, skillId),
        onSuccess: (_data, variables) => {
            toast.success('Skill removed');
            queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove skill'),
    });
}

// --- Employee Jobs ---

export function useEmployeeJobs(employeeId: number) {
    return useQuery({
        queryKey: ['employee-jobs', employeeId],
        queryFn: () => getEmployeeJobs(employeeId),
        enabled: !!employeeId,
    });
}

export function useAssignJobToEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, data }: { employeeId: number; data: AssignJobRequest }) =>
            assignJobToEmployee(employeeId, data),
        onSuccess: (_data, variables) => {
            toast.success('Job assigned to employee');
            queryClient.invalidateQueries({ queryKey: ['employee-jobs', variables.employeeId] });
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to assign job'),
    });
}

export function useUpdateEmployeeJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, jobId, data }: { employeeId: number; jobId: number; data: Partial<AssignJobRequest> }) =>
            updateEmployeeJob(employeeId, jobId, data),
        onSuccess: (_data, variables) => {
            toast.success('Job settings updated');
            queryClient.invalidateQueries({ queryKey: ['employee-jobs', variables.employeeId] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update job settings'),
    });
}

export function useRemoveJobFromEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, jobId }: { employeeId: number; jobId: number }) =>
            removeJobFromEmployee(employeeId, jobId),
        onSuccess: (_data, variables) => {
            toast.success('Job removed from employee');
            queryClient.invalidateQueries({ queryKey: ['employee-jobs', variables.employeeId] });
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove job'),
    });
}

export function useSetEmployeePrimaryJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, jobId }: { employeeId: number; jobId: number }) =>
            setEmployeePrimaryJob(employeeId, jobId),
        onSuccess: (_data, variables) => {
            toast.success('Primary job updated');
            queryClient.invalidateQueries({ queryKey: ['employee-jobs', variables.employeeId] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to set primary job'),
    });
}

// --- Site Jobs ---

export function useSiteJobs(siteId: number) {
    return useQuery({
        queryKey: ['site-jobs', siteId],
        queryFn: () => getSiteJobs(siteId),
        enabled: !!siteId,
    });
}

export function useAddJobToSite() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ siteId, data }: { siteId: number; data: AddSiteJobRequest }) =>
            addJobToSite(siteId, data),
        onSuccess: (_data, variables) => {
            toast.success('Job requirement added to site');
            queryClient.invalidateQueries({ queryKey: ['site-jobs', variables.siteId] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to add job requirement'),
    });
}

export function useUpdateSiteJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ siteId, jobId, data }: { siteId: number; jobId: number; data: { positions_needed: number } }) =>
            updateSiteJob(siteId, jobId, data),
        onSuccess: (_data, variables) => {
            toast.success('Positions updated');
            queryClient.invalidateQueries({ queryKey: ['site-jobs', variables.siteId] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update positions'),
    });
}

export function useRemoveJobFromSite() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ siteId, jobId }: { siteId: number; jobId: number }) =>
            removeJobFromSite(siteId, jobId),
        onSuccess: (_data, variables) => {
            toast.success('Job requirement removed from site');
            queryClient.invalidateQueries({ queryKey: ['site-jobs', variables.siteId] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove job requirement'),
    });
}

// --- Job Relations ---

export function useEmployeesByJob(jobId: number) {
    return useQuery({
        queryKey: ['employees-by-job', jobId],
        queryFn: () => getEmployeesByJob(jobId),
        enabled: !!jobId,
    });
}
