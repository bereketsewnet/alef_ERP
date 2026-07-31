import { NavLink } from 'react-router-dom'
import { Home, Calendar, Cloud, Clock, User, CreditCard, ClipboardCheck, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
    { path: '/', icon: Home, labelKey: 'nav.home' },
    { path: '/roster', icon: Calendar, labelKey: 'nav.roster' },
    { path: '/pending', icon: Cloud, labelKey: 'nav.sync' },
    { path: '/history', icon: Clock, labelKey: 'nav.history' },
    { path: '/salary', icon: CreditCard, labelKey: 'nav.salary' },
    { path: '/profile', icon: User, labelKey: 'nav.profile' },
]

export function BottomNav() {
    const { t } = useTranslation()
    const { user } = useAuth()
    const visibleItems = user?.is_site_controller
        ? [
            ...navItems.filter(item => item.path !== '/salary' && item.path !== '/pending'),
            { path: '/site-attendance', icon: ClipboardCheck, labelKey: 'Site' },
            { path: '/incidents', icon: TriangleAlert, labelKey: 'Incidents' },
          ]
        : navItems

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
                {visibleItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                'flex flex-col items-center justify-center flex-1 h-full px-2 py-1 transition-colors',
                                isActive
                                    ? 'text-primary'
                                    : 'text-gray-500 hover:text-primary/70'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    className={cn('h-6 w-6', isActive && 'stroke-[2.5]')}
                                />
                                <span className="text-[10px] mt-1 font-medium">{item.labelKey.includes('.') ? t(item.labelKey) : item.labelKey}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
