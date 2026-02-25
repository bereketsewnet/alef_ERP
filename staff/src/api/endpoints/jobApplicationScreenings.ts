import api from '../axios';

export type ApplicationScreeningCategory =
    | 'security'
    | 'cleaning'
    | 'driving'
    | 'loading_unloading'
    | 'nursing'
    | 'general_service';

export interface JobApplicationScreening {
    id: number;
    job_application_id: number;
    category: string;
    screening_date: string | null;
    interview_passed: boolean | null;
    written_exam_required: boolean;
    written_score: number | null;
    written_passed: boolean | null;
    practical_exam_required: boolean;
    practical_score: number | null;
    practical_passed: boolean | null;
    overall_passed: boolean | null;
    vehicle_rental_cost: string | null;
    vehicle_rental_paid_by_candidate: string | null;
    vehicle_rental_paid_by_company: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateJobApplicationScreeningRequest {
    category: ApplicationScreeningCategory | string;
    screening_date?: string;
    interview_passed?: boolean | null;
    written_exam_required?: boolean;
    written_score?: number | null;
    written_passed?: boolean | null;
    practical_exam_required?: boolean;
    practical_score?: number | null;
    practical_passed?: boolean | null;
    overall_passed?: boolean | null;
    vehicle_rental_cost?: number | null;
    vehicle_rental_paid_by_candidate?: number | null;
    vehicle_rental_paid_by_company?: number | null;
    notes?: string | null;
}

export type UpdateJobApplicationScreeningRequest = Partial<CreateJobApplicationScreeningRequest>;

export const getJobApplicationScreenings = async (
    jobApplicationId: number
): Promise<JobApplicationScreening[]> => {
    const response = await api.get(`/job-applications/${jobApplicationId}/screenings`);
    return response.data;
};

export const createJobApplicationScreening = async (
    jobApplicationId: number,
    data: CreateJobApplicationScreeningRequest
): Promise<JobApplicationScreening> => {
    const response = await api.post(`/job-applications/${jobApplicationId}/screenings`, data);
    return response.data;
};

export const updateJobApplicationScreening = async (
    jobApplicationId: number,
    screeningId: number,
    data: UpdateJobApplicationScreeningRequest
): Promise<JobApplicationScreening> => {
    const response = await api.put(
        `/job-applications/${jobApplicationId}/screenings/${screeningId}`,
        data
    );
    return response.data;
};

export const deleteJobApplicationScreening = async (
    jobApplicationId: number,
    screeningId: number
): Promise<void> => {
    await api.delete(`/job-applications/${jobApplicationId}/screenings/${screeningId}`);
};

