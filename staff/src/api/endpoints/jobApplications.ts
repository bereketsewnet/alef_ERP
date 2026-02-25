import api from '../axios';
import type { Job } from './jobs';
import type { Vacancy } from './vacancies';

export interface JobApplication {
    id: number;
    vacancy_id?: number | null;
    applicant_id: string;
    age: number | null;
    education: string | null;
    experience: string | null;
    jobs?: Job[];
    vacancy?: Vacancy | null;
    created_at: string;
    updated_at: string;
}

export interface CreateJobApplicationRequest {
    vacancy_id?: number;
    applicant_id: string;
    age: number;
    education: string;
    experience: string;
    job_ids: number[];
}

export interface UpdateJobApplicationRequest extends Partial<CreateJobApplicationRequest> {}

export const getJobApplications = async (): Promise<JobApplication[]> => {
    const response = await api.get('/job-applications');
    return response.data;
};

export const getJobApplication = async (id: number): Promise<JobApplication> => {
    const response = await api.get(`/job-applications/${id}`);
    return response.data;
};

export const createJobApplication = async (data: CreateJobApplicationRequest): Promise<JobApplication> => {
    const response = await api.post('/job-applications', data);
    return response.data;
};

export const updateJobApplication = async (
    id: number,
    data: UpdateJobApplicationRequest
): Promise<JobApplication> => {
    const response = await api.put(`/job-applications/${id}`, data);
    return response.data;
};

export const deleteJobApplication = async (id: number): Promise<void> => {
    await api.delete(`/job-applications/${id}`);
};

