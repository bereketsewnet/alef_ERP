import { NavLink } from 'react-router-dom'
import { Home, Calendar, Clock, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const navItems = [
    { path: '/', icon: Home, labelKey: 'nav.home' },
    { path: '/roster', icon: Calendar, labelKey: 'nav.roster' },
    { path: '/history', icon: Clock, labelKey: 'nav.history' },
    { path: '/profile', icon: User, labelKey: 'nav.profile' },
]

export function BottomNav() {
    const { t } = useTranslation()

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
                {navItems.map((item) => (
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
                                <span className="text-xs mt-1 font-medium">{t(item.labelKey)}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
