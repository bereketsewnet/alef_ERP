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
    ChevronRight,
    Briefcase,
    Megaphone,
    ToggleLeft,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLogout } from "@/services/useAuth"
import { useCurrentUser } from "@/services/useAuth"
import { canSeeNav } from "@/config/roles"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    collapsed: boolean
    setCollapsed: (collapsed: boolean) => void
    mobileOpen: boolean
    setMobileOpen: (open: boolean) => void
}

const ALL_NAV_ITEMS = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Jobs", href: "/jobs", icon: Briefcase },
    { title: "Vacancies", href: "/vacancies", icon: Megaphone },
    { title: "Job Applications", href: "/job-applications", icon: FileText },
    { title: "CRM Leads", href: "/crm/leads", icon: Users },
    { title: "Bids", href: "/crm/bids", icon: FileText },
    { title: "Roster", href: "/roster", icon: CalendarDays },
    { title: "Employees", href: "/employees", icon: Users },
    { title: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { title: "Clients & Sites", href: "/clients", icon: Building2 },
    { title: "Assets", href: "/assets", icon: Package },
    { title: "Payroll", href: "/payroll", icon: Banknote },
    { title: "Billing", href: "/billing", icon: FileText },
    { title: "Incidents", href: "/incidents", icon: AlertTriangle },
    { title: "Reports", href: "/reports", icon: BarChart3 },
    { title: "User & role management", href: "/settings/users", icon: Settings },
    { title: "Attendance Settings", href: "/settings/attendance", icon: ToggleLeft },
]

export function Sidebar({ className, collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
    const location = useLocation()
    const { mutate: logout } = useLogout()
    const { data: user } = useCurrentUser()
    const role = user?.role ?? ''
    const navItems = ALL_NAV_ITEMS.filter((item) => canSeeNav(role, item.href))

    const handleNavClick = () => {
        setMobileOpen(false)
    }

    return (
        <div className={cn(
            "flex flex-col h-screen border-r bg-white",
            // Mobile: fixed overlay drawer, slide in/out
            "fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ease-in-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
            // Tablet and above: static, always visible, no transform
            "md:relative md:inset-auto md:z-auto md:translate-x-0 md:transition-[width] md:duration-300",
            collapsed ? "md:w-16" : "md:w-64",
            className
        )}>
            {/* Header */}
            <div className="flex h-16 items-center border-b px-4 shrink-0">
                {!collapsed && (
                    <span className="text-lg font-bold text-primary-600 truncate">
                        ALEF DELTA
                    </span>
                )}
                {/* Close button on mobile */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto md:hidden"
                    onClick={() => setMobileOpen(false)}
                >
                    <X className="h-4 w-4" />
                </Button>
                {/* Collapse toggle on desktop */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("hidden md:flex", collapsed ? "mx-auto" : "ml-auto")}
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            {/* Nav items */}
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid gap-1 px-2">
                    {navItems.map((item, index) => {
                        const isActive = location.pathname.startsWith(item.href)
                        return (
                            <Link
                                key={index}
                                to={item.href}
                                onClick={handleNavClick}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-neutral-100",
                                    isActive ? "bg-primary-50 text-primary-600" : "text-neutral-500",
                                    collapsed && "md:justify-center md:px-2"
                                )}
                                title={collapsed ? item.title : undefined}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span className={cn(collapsed && "md:hidden")}>{item.title}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Logout */}
            <div className="border-t p-4 shrink-0">
                <Button
                    variant="ghost"
                    onClick={() => { logout(); handleNavClick() }}
                    className={cn(
                        "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50",
                        collapsed && "md:justify-center md:px-0"
                    )}
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span className={cn("ml-2", collapsed && "md:hidden")}>Logout</span>
                </Button>
            </div>
        </div>
    )
}
