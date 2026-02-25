import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import {
    getJobApplications,
    getJobApplication,
    createJobApplication,
    updateJobApplication,
    deleteJobApplication,
} from '@/api/endpoints/jobApplications';
import type { CreateJobApplicationRequest, UpdateJobApplicationRequest } from '@/api/endpoints/jobApplications';

export function useJobApplications() {
    return useQuery({
        queryKey: ['job-applications'],
        queryFn: () => getJobApplications(),
    });
}

export function useJobApplication(id: number) {
    return useQuery({
        queryKey: ['job-application', id],
        queryFn: () => getJobApplication(id),
        enabled: !!id,
    });
}

export function useCreateJobApplication() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateJobApplicationRequest) => createJobApplication(data),
        onSuccess: () => {
            toast({ title: 'Job application created' });
            queryClient.invalidateQueries({ queryKey: ['job-applications'] });
        },
        onError: (err: any) =>
            toast({
                title: 'Failed to create application',
                description: err.response?.data?.message,
                variant: 'destructive',
            }),
    });
}

export function useUpdateJobApplication() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateJobApplicationRequest }) =>
            updateJobApplication(id, data),
        onSuccess: (_data, variables) => {
            toast({ title: 'Job application updated' });
            queryClient.invalidateQueries({ queryKey: ['job-applications'] });
            queryClient.invalidateQueries({ queryKey: ['job-application', variables.id] });
        },
        onError: (err: any) =>
            toast({
                title: 'Failed to update application',
                description: err.response?.data?.message,
                variant: 'destructive',
            }),
    });
}

export function useDeleteJobApplication() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteJobApplication(id),
        onSuccess: () => {
            toast({ title: 'Job application deleted' });
            queryClient.invalidateQueries({ queryKey: ['job-applications'] });
        },
        onError: (err: any) =>
            toast({
                title: 'Failed to delete application',
                description: err.response?.data?.message,
                variant: 'destructive',
            }),
    });
}

