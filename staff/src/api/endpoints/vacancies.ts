import api from '../axios';

export interface Vacancy {
    id: number;
    title_en: string;
    title_am: string;
    description: string | null;
    qualification: string | null;
    more_info: string | null;
    number_of_employees: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateVacancyRequest {
    title_en: string;
    title_am: string;
    description?: string;
    qualification?: string;
    more_info?: string;
    number_of_employees: number;
    is_active?: boolean;
}

export const getVacancies = async (activeOnly?: boolean): Promise<Vacancy[]> => {
    const response = await api.get('/vacancies', { params: { active_only: activeOnly } });
    return response.data;
};

export const getVacancy = async (id: number): Promise<Vacancy> => {
    const response = await api.get(`/vacancies/${id}`);
    return response.data;
};

export const createVacancy = async (data: CreateVacancyRequest): Promise<Vacancy> => {
    const response = await api.post('/vacancies', data);
    return response.data;
};

export const updateVacancy = async (id: number, data: Partial<CreateVacancyRequest>): Promise<Vacancy> => {
    const response = await api.put(`/vacancies/${id}`, data);
    return response.data;
};

export const deleteVacancy = async (id: number): Promise<void> => {
    await api.delete(`/vacancies/${id}`);
};
