import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { Toaster } from "@/components/ui/toaster"

export function AppShell() {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden bg-neutral-50">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar />

                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
            <Toaster />
        </div>
    )
}
