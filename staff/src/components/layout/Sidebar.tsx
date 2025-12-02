import { cn } from "@/lib/utils"
import { useLocation, Link } from "react-router-dom"
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    ClipboardCheck,
    Building2,
    Package,
    Banknote,
    FileText,
    AlertTriangle,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLogout } from "@/services/useAuth"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    collapsed: boolean
    setCollapsed: (collapsed: boolean) => void
}

export function Sidebar({ className, collapsed, setCollapsed }: SidebarProps) {
    const location = useLocation()
    const { mutate: logout } = useLogout()

    const navItems = [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { title: "Roster", href: "/roster", icon: CalendarDays },
        { title: "Employees", href: "/employees", icon: Users },
        { title: "Attendance", href: "/attendance", icon: ClipboardCheck },
        { title: "Clients & Sites", href: "/clients", icon: Building2 },
        { title: "Assets", href: "/assets", icon: Package },
        { title: "Payroll", href: "/payroll", icon: Banknote },
        { title: "Billing", href: "/billing", icon: FileText },
        { title: "Incidents", href: "/incidents", icon: AlertTriangle },
        { title: "Reports", href: "/reports", icon: BarChart3 },
        { title: "Settings", href: "/settings", icon: Settings },
    ]

    return (
        <div className={cn("relative flex flex-col h-screen border-r bg-white transition-all duration-300", collapsed ? "w-16" : "w-64", className)}>
            <div className="flex h-16 items-center border-b px-4">
                {!collapsed && (
                    <span className="text-lg font-bold text-primary-600 truncate">
                        ALEF DELTA
                    </span>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("ml-auto", collapsed && "mx-auto")}
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid gap-1 px-2">
                    {navItems.map((item, index) => {
                        const isActive = location.pathname.startsWith(item.href)
                        return (
                            <Link
                                key={index}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-neutral-100",
                                    isActive ? "bg-primary-50 text-primary-600" : "text-neutral-500",
                                    collapsed && "justify-center px-2"
                                )}
                                title={collapsed ? item.title : undefined}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                                {!collapsed && <span>{item.title}</span>}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="border-t p-4">
                <Button
                    variant="ghost"
                    onClick={() => logout()}
                    className={cn(
                        "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50",
                        collapsed && "justify-center px-0"
                    )}
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="ml-2">Logout</span>}
                </Button>
            </div>
        </div>
    )
}
