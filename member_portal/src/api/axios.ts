import axios from 'axios'
import { getAuthToken, getRefreshToken, saveAuthToken, clearAuth } from '@/utils/storage'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
})

// Request interceptor - Add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await getAuthToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor - Handle 401 and refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // If 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshToken = await getRefreshToken()
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
                        headers: {
                            Authorization: `Bearer ${refreshToken}`,
                        },
                    })

                    const { access_token } = response.data
                    await saveAuthToken(access_token)

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access_token}`
                    return api(originalRequest)
                }
            } catch {
                // Refresh failed, clear auth and redirect to login
                await clearAuth()
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)

export default api
