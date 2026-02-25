import apiClient from '../axios'

export type EmployeeDocumentType =
    | 'MEDICAL_PAPER'
    | 'POLICE_REPORT'
    | 'GUARANTOR_ID'
    | 'EMPLOYEE_PHOTO'
    | 'GUARANTOR_PHOTO'
    | 'OTHER'

export interface EmployeeDocument {
    id: number
    employee_id: number
    type: EmployeeDocumentType | string
    name: string
    file_path: string
    url?: string | null
    valid_until: string | null
    created_at: string
    updated_at: string
}

export interface UploadEmployeeDocumentRequest {
    type: EmployeeDocumentType | string
    name: string
    valid_until?: string
    file: File
}

export const employeeDocumentsApi = {
    list: async (employeeId: number): Promise<EmployeeDocument[]> => {
        const response = await apiClient.get<EmployeeDocument[]>(`/employees/${employeeId}/documents`)
        return response.data
    },

    upload: async (employeeId: number, data: UploadEmployeeDocumentRequest): Promise<EmployeeDocument> => {
        const formData = new FormData()
        formData.append('type', data.type)
        formData.append('name', data.name)
        if (data.valid_until) {
            formData.append('valid_until', data.valid_until)
        }
        formData.append('file', data.file)

        const response = await apiClient.post<EmployeeDocument>(
            `/employees/${employeeId}/documents`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        )
        return response.data
    },

    delete: async (employeeId: number, documentId: number): Promise<void> => {
        await apiClient.delete(`/employees/${employeeId}/documents/${documentId}`)
    },
}

