import { useState } from "react"
import { Bell, Search, User, LogOut, Users, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentUser, useLogout } from "@/services/useAuth"
import { useIncidents } from "@/services/useIncidents"
import { useNavigate } from "react-router-dom"

interface TopbarProps {
    onMenuToggle?: () => void
}

export function Topbar({ onMenuToggle }: TopbarProps) {
    const { data: user } = useCurrentUser()
    const { mutate: logout } = useLogout()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")

    const { data: panicIncidents } = useIncidents({ report_type: 'PANIC' })
    const panicCount = panicIncidents?.total ?? panicIncidents?.data?.length ?? 0

    const getInitials = (name?: string) => {
        if (!name) return 'AD'
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2)
    }

    const displayName = user?.name || user?.username || 'Admin User'

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const q = searchQuery.trim()
        if (!q) return
        navigate(`/clients?search=${encodeURIComponent(q)}`)
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 sm:gap-4 border-b bg-white px-4 sm:px-6 shadow-sm">
            {/* Hamburger — only on mobile/tablet */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden shrink-0"
                onClick={onMenuToggle}
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
            </Button>

            {/* Logo text visible on mobile (sidebar is hidden) */}
            <span className="font-bold text-primary-600 text-sm md:hidden">ALEF DELTA</span>

            <div className="flex flex-1 items-center gap-4">
                <form className="hidden sm:block lg:w-96" onSubmit={handleSearchSubmit}>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                        <Input
                            type="search"
                            placeholder="Search sites..."
                            className="w-full bg-neutral-50 pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </form>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => navigate('/incidents')}
                >
                    <Bell className="h-5 w-5" />
                    {panicCount > 0 && (
                        <span className="absolute -right-1 -top-1 min-h-[16px] min-w-[16px] rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center px-1">
                            {panicCount > 9 ? '9+' : panicCount}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="/avatars/01.png" alt={displayName} />
                                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{displayName}</p>
                                <p className="text-xs leading-none text-neutral-500">
                                    {user?.email || 'admin@alefdelta.com'}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        {(user?.role === 'OWNER' || user?.role === 'GM') && (
                            <DropdownMenuItem onClick={() => navigate('/settings/users')}>
                                <Users className="mr-2 h-4 w-4" />
                                <span>User management</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
