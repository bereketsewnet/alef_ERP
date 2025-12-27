import api from '../axios';

// Types
export interface JobCategory {
    id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    jobs_count?: number;
    created_at: string;
    updated_at: string;
}

export interface JobSkill {
    id: number;
    job_id: number;
    skill_name: string;
    is_required: boolean;
}

export interface Job {
    id: number;
    category_id: number;
    job_code: string;
    job_name: string;
    description: string | null;
    pay_type: 'HOURLY' | 'MONTHLY';
    base_salary: number;
    hourly_rate: number;
    overtime_multiplier: number;
    tax_percent: number;
    late_penalty: number;
    absent_penalty: number;
    agency_fee_percent: number;
    is_active: boolean;
    category?: JobCategory;
    skills?: JobSkill[];
    created_at: string;
    updated_at: string;
}

export interface EmployeeJob extends Job {
    pivot: {
        is_primary: boolean;
        override_salary: number | null;
        override_hourly_rate: number | null;
        override_tax_percent: number | null;
        override_late_penalty: number | null;
        override_absent_penalty: number | null;
        override_agency_fee_percent: number | null;
        override_overtime_multiplier: number | null;
    };
}

export interface SiteJob extends Job {
    pivot: {
        positions_needed: number;
    };
}

// Request types
export interface CreateJobCategoryRequest {
    name: string;
    code: string;
    description?: string;
    is_active?: boolean;
}

export interface CreateJobRequest {
    category_id: number;
    job_name: string;
    description?: string;
    pay_type: 'HOURLY' | 'MONTHLY';
    base_salary: number;
    hourly_rate: number;
    overtime_multiplier?: number;
    tax_percent?: number;
    late_penalty?: number;
    absent_penalty?: number;
    agency_fee_percent?: number;
    is_active?: boolean;
}

export interface AssignJobRequest {
    job_id: number;
    is_primary?: boolean;
    override_salary?: number;
    override_hourly_rate?: number;
    override_tax_percent?: number;
    override_late_penalty?: number;
    override_absent_penalty?: number;
    override_agency_fee_percent?: number;
    override_overtime_multiplier?: number;
}

export interface AddSiteJobRequest {
    job_id: number;
    positions_needed?: number;
}

// Job Categories API
export const getJobCategories = async (activeOnly?: boolean): Promise<JobCategory[]> => {
    const response = await api.get('/job-categories', { params: { active_only: activeOnly } });
    return response.data;
};

export const createJobCategory = async (data: CreateJobCategoryRequest): Promise<JobCategory> => {
    const response = await api.post('/job-categories', data);
    return response.data;
};

export const updateJobCategory = async (id: number, data: Partial<CreateJobCategoryRequest>): Promise<JobCategory> => {
    const response = await api.put(`/job-categories/${id}`, data);
    return response.data;
};

export const deleteJobCategory = async (id: number): Promise<void> => {
    await api.delete(`/job-categories/${id}`);
};

// Jobs API
export const getJobs = async (params?: { category_id?: number; active_only?: boolean; search?: string }): Promise<Job[]> => {
    console.log('[API] Fetching jobs with params:', params);
    try {
        const response = await api.get('/jobs', { params });
        console.log('[API] Jobs response status:', response.status);
        console.log('[API] Jobs response data:', response.data);
        console.log('[API] Jobs count:', Array.isArray(response.data) ? response.data.length : 'Not an array');
        return response.data;
    } catch (error: any) {
        console.error('[API] Error fetching jobs:', error);
        console.error('[API] Error response:', error.response?.data);
        throw error;
    }
};

export const getJob = async (id: number): Promise<Job> => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
};

export const createJob = async (data: CreateJobRequest): Promise<Job> => {
    const response = await api.post('/jobs', data);
    return response.data;
};

export const updateJob = async (id: number, data: Partial<CreateJobRequest>): Promise<Job> => {
    const response = await api.put(`/jobs/${id}`, data);
    return response.data;
};

export const deleteJob = async (id: number): Promise<void> => {
    await api.delete(`/jobs/${id}`);
};

// Job Skills API
export const addJobSkill = async (jobId: number, data: { skill_name: string; is_required?: boolean }): Promise<JobSkill> => {
    const response = await api.post(`/jobs/${jobId}/skills`, data);
    return response.data;
};

export const removeJobSkill = async (jobId: number, skillId: number): Promise<void> => {
    await api.delete(`/jobs/${jobId}/skills/${skillId}`);
};

// Employee Jobs API
export const getEmployeeJobs = async (employeeId: number): Promise<EmployeeJob[]> => {
    const response = await api.get(`/employees/${employeeId}/jobs`);
    return response.data;
};

export const assignJobToEmployee = async (employeeId: number, data: AssignJobRequest): Promise<void> => {
    await api.post(`/employees/${employeeId}/jobs`, data);
};

export const updateEmployeeJob = async (employeeId: number, jobId: number, data: Partial<AssignJobRequest>): Promise<void> => {
    await api.put(`/employees/${employeeId}/jobs/${jobId}`, data);
};

export const removeJobFromEmployee = async (employeeId: number, jobId: number): Promise<void> => {
    await api.delete(`/employees/${employeeId}/jobs/${jobId}`);
};

export const setEmployeePrimaryJob = async (employeeId: number, jobId: number): Promise<void> => {
    await api.put(`/employees/${employeeId}/jobs/${jobId}/primary`);
};

// Site Jobs API
export const getSiteJobs = async (siteId: number): Promise<SiteJob[]> => {
    const response = await api.get(`/sites/${siteId}/jobs`);
    return response.data;
};

export const addJobToSite = async (siteId: number, data: AddSiteJobRequest): Promise<void> => {
    await api.post(`/sites/${siteId}/jobs`, data);
};

export const updateSiteJob = async (siteId: number, jobId: number, data: { positions_needed: number }): Promise<void> => {
    await api.put(`/sites/${siteId}/jobs/${jobId}`, data);
};

export const removeJobFromSite = async (siteId: number, jobId: number): Promise<void> => {
    await api.delete(`/sites/${siteId}/jobs/${jobId}`);
};

// Get employees by job
export const getEmployeesByJob = async (jobId: number): Promise<any[]> => {
    const response = await api.get(`/jobs/${jobId}/employees`);
    return response.data;
};

// Get sites by job
export const getSitesByJob = async (jobId: number): Promise<any[]> => {
    const response = await api.get(`/jobs/${jobId}/sites`);
    return response.data;
};
