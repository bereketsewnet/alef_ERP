import api from '../axios';
import type { Job } from './jobs';
import type { Vacancy } from './vacancies';

export interface JobApplication {
    id: number;
    vacancy_id?: number | null;
    applicant_id: string;
    age: number | null;
    sex: 'MALE' | 'FEMALE' | null;
    phone_number: string | null;
    email: string | null;
    education: string | null;
    experience: string | null;
    cv_original_name: string | null;
    cv_mime_type: string | null;
    cv_size_bytes: number | null;
    cv_download_url: string | null;
    jobs?: Job[];
    vacancy?: Vacancy | null;
    created_at: string;
    updated_at: string;
}

export interface CreateJobApplicationRequest {
    vacancy_id?: number;
    applicant_id: string;
    age: number;
    sex: 'MALE' | 'FEMALE';
    phone_number: string;
    email?: string;
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

export const downloadJobApplicationCv = async (id: number): Promise<Blob> => {
    const response = await api.get(`/job-applications/${id}/cv`, { responseType: 'blob' });
    return response.data;
};

