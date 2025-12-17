import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authApi } from '@/api/endpoints/auth'
import { saveAuthToken, saveRefreshToken, saveUser, getAuthToken, getUser, clearAuth } from '@/utils/storage'
import type { User, AuthResponse } from '@/types'

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (phone: string, password: string) => Promise<void>
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Initialize auth state from storage
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = await getAuthToken()
                if (token) {
                    const cachedUser = await getUser()
                    if (cachedUser) {
                        setUser(cachedUser)
                    }
                    // Try to refresh user data from server
                    try {
                        const freshUser = await authApi.me()
                        setUser(freshUser)
                        await saveUser(freshUser)
                    } catch {
                        // If server unavailable, use cached user
                    }
                }
            } catch (error) {
                console.error('Auth init error:', error)
            } finally {
                setIsLoading(false)
            }
        }

        initAuth()
    }, [])

    const login = useCallback(async (phone: string, password: string) => {
        const response: AuthResponse = await authApi.login(phone, password)

        await saveAuthToken(response.access_token)
        if (response.refresh_token) {
            await saveRefreshToken(response.refresh_token)
        }
        await saveUser(response.user)

        setUser(response.user)
    }, [])

    const logout = useCallback(async () => {
        try {
            await authApi.logout()
        } catch {
            // Ignore logout errors
        }
        await clearAuth()
        setUser(null)
    }, [])

    const refreshUser = useCallback(async () => {
        try {
            const freshUser = await authApi.me()
            setUser(freshUser)
            await saveUser(freshUser)
        } catch (error) {
            console.error('Failed to refresh user:', error)
        }
    }, [])

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
