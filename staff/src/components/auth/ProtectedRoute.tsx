import { Navigate, useLocation } from 'react-router-dom'
import { useCurrentUser } from '@/services/useAuth'
import type { Permission, Role } from '@/types/common.types'

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredPermissions?: Permission[]
    requiredRoles?: Role[]
}

export function ProtectedRoute({
    children,
    requiredPermissions = [],
    requiredRoles = [],
}: ProtectedRouteProps) {
    const location = useLocation()
    const { data: user, isLoading, isError } = useCurrentUser()

    // Check if user is authenticated
    const token = localStorage.getItem('auth_token')

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading...</p>
                </div>
            </div>
        )
    }

    // Error or no user
    if (isError || !user) {
        localStorage.removeItem('auth_token')
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Check role-based access
    if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.includes(user.role)
        if (!hasRequiredRole) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <div className="text-red-500 text-6xl mb-4">🚫</div>
                        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                            Access Denied
                        </h1>
                        <p className="text-neutral-600 mb-6">
                            You don't have permission to access this page. Required role: {requiredRoles.join(', ')}
                        </p>
                        <a
                            href="/dashboard"
                            className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            Go to Dashboard
                        </a>
                    </div>
                </div>
            )
        }
    }

    // Check permission-based access
    if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every((permission) =>
            user.permissions.includes(permission)
        )
        if (!hasAllPermissions) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <div className="text-red-500 text-6xl mb-4">🚫</div>
                        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                            Access Denied
                        </h1>
                        <p className="text-neutral-600 mb-6">
                            You don't have the required permissions to access this page.
                        </p>
                        <a
                            href="/dashboard"
                            className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            Go to Dashboard
                        </a>
                    </div>
                </div>
            )
        }
    }

    return <>{children}</>
}
