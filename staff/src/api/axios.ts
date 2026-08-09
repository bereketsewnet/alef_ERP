import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/types/common.types'

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4002/api`
console.log('Backend API URL used by Staff Portal:', API_URL);
let refreshPromise: Promise<string> | null = null

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
})

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('auth_token')
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }
        // Never keep the JSON default for FormData. The browser must generate the
        // multipart boundary; setting Content-Type manually makes PHP treat real
        // files as ordinary fields and Laravel reports "must be a file".
        if (config.data instanceof FormData && config.headers) {
            config.headers.delete('Content-Type')
        }
        // Log API requests for debugging
        if (import.meta.env.DEV) {
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
                params: config.params,
                hasToken: !!token,
                headers: config.headers,
            });
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
    (response) => {
        // Log API responses for debugging
        if (import.meta.env.DEV) {
            console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
                status: response.status,
                data: response.data,
                headers: response.headers,
            });
        }
        return response
    },
    async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && originalRequest && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh')) {
            try {
                const expiredToken = localStorage.getItem('auth_token')
                if (!expiredToken) throw new Error('No authentication token')

                if (!refreshPromise) {
                    refreshPromise = axios.post(`${API_URL}/auth/refresh`, null, {
                        headers: { Authorization: `Bearer ${expiredToken}`, Accept: 'application/json' },
                    }).then((response) => {
                        const token = response.data.access_token as string
                        localStorage.setItem('auth_token', token)
                        return token
                    }).finally(() => {
                        refreshPromise = null
                    })
                }

                const token = await refreshPromise
                if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`
                return apiClient(originalRequest)
            } catch (refreshError) {
                // Refresh failed, redirect to login
                localStorage.removeItem('auth_token')
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        // Handle other errors
        const apiError: ApiError = {
            message: error.response?.data?.message || error.message || 'An error occurred',
            error: error.response?.data?.error, // Capture specific error message
            errors: error.response?.data?.errors,
            status: error.response?.status,
        }

        return Promise.reject(apiError)
    }
)

export default apiClient
