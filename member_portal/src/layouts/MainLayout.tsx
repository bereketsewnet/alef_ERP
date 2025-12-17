import { Outlet } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { PanicButton } from '@/components/PanicButton'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'
import { Wifi, WifiOff, Cloud } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function MainLayout() {
    const { t } = useTranslation()
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

                    {pendingCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-warning">
                            <Cloud className="h-4 w-4" />
                            <span>{pendingCount} {t('home.pendingSync')}</span>
                        </div>
                    )}
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
