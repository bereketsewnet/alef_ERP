import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outline' | 'elevated'
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
    const variants = {
        default: 'bg-white border border-gray-200',
        outline: 'bg-transparent border-2 border-gray-200',
        elevated: 'bg-white shadow-lg',
    }

    return (
        <div
            className={cn(
                'rounded-xl p-4',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('mb-3', className)} {...props}>
            {children}
        </div>
    )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn('text-lg font-semibold text-foreground', className)} {...props}>
            {children}
        </h3>
    )
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={cn('text-sm text-gray-500', className)} {...props}>
            {children}
        </p>
    )
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('', className)} {...props}>
            {children}
        </div>
    )
}
