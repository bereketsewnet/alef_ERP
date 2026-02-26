import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { Toaster } from "@/components/ui/toaster"
import { useCurrentUser } from "@/services/useAuth"
import { canAccessPath } from "@/config/roles"

export function AppShell() {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const location = useLocation()
    const { data: user } = useCurrentUser()
    const role = user?.role ?? ''
    const pathname = location.pathname
    const allowed = canAccessPath(role, pathname)

    if (!allowed) {
        return (
            <div className="flex h-screen items-center justify-center bg-neutral-50">
                <div className="text-center max-w-md px-4">
                    <div className="text-red-500 text-6xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h1>
                    <p className="text-neutral-600 mb-6">
                        You don&apos;t have permission to access this page.
                    </p>
                    <a
                        href="/dashboard"
                        className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-white"
                    >
                        Go to Dashboard
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden bg-neutral-50">
            {/* Mobile backdrop overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                <Topbar onMenuToggle={() => setMobileOpen(!mobileOpen)} />

                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
            <Toaster />
        </div>
    )
}
