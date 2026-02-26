import { Navigate, useLocation } from 'react-router-dom'
import { useCurrentUser } from '@/services/useAuth'
import type { Permission, Role } from '@/types/common.types'
import { ADMIN_PANEL_ROLES } from '@/config/roles'

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

    const token = localStorage.getItem('auth_token')

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

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

    if (isError || !user) {
        localStorage.removeItem('auth_token')
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Only admin-panel roles can use the staff app; FIELD_STAFF use member portal
    const role = (user.role ?? '') as string
    if (!ADMIN_PANEL_ROLES.includes(role as any)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-red-500 text-6xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h1>
                    <p className="text-neutral-600 mb-6">
                        Your role does not have access to the admin panel. Use the member portal instead.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            localStorage.removeItem('auth_token')
                            window.location.href = '/login'
                        }}
                        className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        )
    }

    if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.includes(user.role as Role)
        if (!hasRequiredRole) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <div className="text-red-500 text-6xl mb-4">🚫</div>
                        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h1>
                        <p className="text-neutral-600 mb-6">
                            Required role: {requiredRoles.join(', ')}
                        </p>
                        <a href="/dashboard" className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                            Go to Dashboard
                        </a>
                    </div>
                </div>
            )
        }
    }

    if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every((p) => user.permissions?.includes(p))
        if (!hasAllPermissions) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <div className="text-red-500 text-6xl mb-4">🚫</div>
                        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h1>
                        <p className="text-neutral-600 mb-6">You don&apos;t have the required permissions.</p>
                        <a href="/dashboard" className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                            Go to Dashboard
                        </a>
                    </div>
                </div>
            )
        }
    }

    return <>{children}</>
}
