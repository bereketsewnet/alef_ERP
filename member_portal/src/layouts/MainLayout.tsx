import { Outlet, Link } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { PanicButton } from '@/components/PanicButton'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'
import { Wifi, WifiOff, Cloud } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function MainLayout() {
    const { t, i18n } = useTranslation()
    const { isOnline, pendingCount } = useOfflineQueue()

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Status bar */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-2 safe-area-top">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <div className="flex items-center gap-2">
                        {isOnline ? (
                            <Wifi className="h-4 w-4 text-success" />
                        ) : (
                            <WifiOff className="h-4 w-4 text-error" />
                        )}
                        <span className="text-xs text-gray-500">
                            {isOnline ? t('app.online') : t('app.offline')}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                const language = i18n.language === 'am' ? 'en' : 'am'
                                localStorage.setItem('language', language)
                                i18n.changeLanguage(language)
                            }}
                            className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-semibold text-primary"
                            aria-label="Switch language"
                        >
                            {i18n.language === 'am' ? 'English' : 'አማርኛ'}
                        </button>
                        <Link to="/pending" className="flex items-center gap-1 text-xs text-primary hover:underline">
                            <Cloud className="h-4 w-4" />
                            <span>{pendingCount > 0 ? `${pendingCount} ${t('home.pendingSync')}` : (t('nav.sync') || 'Sync')}</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Page content */}
            <main className="max-w-lg mx-auto px-4 py-4">
                <Outlet />
            </main>

            {/* Panic button */}
            <PanicButton />

            {/* Bottom navigation */}
            <BottomNav />
        </div>
    )
}
