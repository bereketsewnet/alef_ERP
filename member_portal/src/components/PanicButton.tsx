import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useGPS } from '@/hooks/useGPS'
import { incidentApi } from '@/api/endpoints/incidents'
import { cn } from '@/lib/utils'

interface PanicButtonProps {
    className?: string
}

export function PanicButton({ className }: PanicButtonProps) {
    const { t } = useTranslation()
    const { requestPosition } = useGPS()
    const [showConfirm, setShowConfirm] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [result, setResult] = useState<'success' | 'error' | null>(null)

    const handlePanic = async () => {
        setIsSending(true)
        try {
            const position = await requestPosition()
            if (position) {
                await incidentApi.panic(position.latitude, position.longitude)
                setResult('success')
            } else {
                // Send without location if GPS fails
                await incidentApi.panic(0, 0, 'GPS unavailable')
                setResult('success')
            }
        } catch {
            setResult('error')
        } finally {
            setIsSending(false)
            setTimeout(() => {
                setShowConfirm(false)
                setResult(null)
            }, 3000)
        }
    }

    if (result === 'success') {
        return (
            <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
                {t('panic.sent')}
            </div>
        )
    }

    if (result === 'error') {
        return (
            <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                {t('panic.failed')}
            </div>
        )
    }

    if (showConfirm) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                    <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                        <AlertTriangle className="h-8 w-8 text-error" />
                    </div>
                    <h2 className="text-xl font-bold text-center mb-2">{t('panic.confirm')}</h2>
                    <p className="text-gray-500 text-center text-sm mb-6">
                        {t('panic.confirmMessage')}
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setShowConfirm(false)}
                            disabled={isSending}
                        >
                            {t('app.cancel')}
                        </Button>
                        <Button
                            variant="danger"
                            className="flex-1"
                            onClick={handlePanic}
                            isLoading={isSending}
                        >
                            {t('app.confirm')}
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className={cn(
                'fixed top-4 right-4 z-40',
                'w-12 h-12 rounded-full bg-error text-white',
                'flex items-center justify-center',
                'shadow-lg hover:bg-red-700 active:scale-95 transition-transform',
                className
            )}
            aria-label={t('panic.button')}
        >
            <span className="text-xs font-bold">{t('panic.button')}</span>
        </button>
    )
}
