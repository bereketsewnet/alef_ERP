import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    }

    return (
        <Loader2 className={cn('animate-spin text-primary', sizes[size], className)} />
    )
}

export function LoadingScreen({ message }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <Spinner size="lg" />
            {message && (
                <p className="mt-4 text-gray-500">{message}</p>
            )}
        </div>
    )
}
