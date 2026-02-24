import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getVacancies,
    getVacancy,
    createVacancy,
    updateVacancy,
    deleteVacancy,
} from '../api/endpoints/vacancies';
import type { CreateVacancyRequest } from '../api/endpoints/vacancies';

export function useVacancies(activeOnly?: boolean) {
    return useQuery({
        queryKey: ['vacancies', activeOnly],
        queryFn: () => getVacancies(activeOnly),
    });
}

export function useVacancy(id: number) {
    return useQuery({
        queryKey: ['vacancy', id],
        queryFn: () => getVacancy(id),
        enabled: !!id,
    });
}

export function useCreateVacancy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateVacancyRequest) => createVacancy(data),
        onSuccess: () => {
            toast.success('Vacancy created');
            queryClient.invalidateQueries({ queryKey: ['vacancies'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create vacancy'),
    });
}

export function useUpdateVacancy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateVacancyRequest> }) =>
            updateVacancy(id, data),
        onSuccess: (_data, variables) => {
            toast.success('Vacancy updated');
            queryClient.invalidateQueries({ queryKey: ['vacancies'] });
            queryClient.invalidateQueries({ queryKey: ['vacancy', variables.id] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update vacancy'),
    });
}

export function useDeleteVacancy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteVacancy(id),
        onSuccess: () => {
            toast.success('Vacancy deleted');
            queryClient.invalidateQueries({ queryKey: ['vacancies'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete vacancy'),
    });
}
