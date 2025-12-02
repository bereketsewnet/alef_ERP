import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    subtitle?: string
    className?: string
}

export function KPICard({
    title,
    value,
    icon: Icon,
    trend,
    subtitle,
    className,
}: KPICardProps) {
    return (
        <Card className={cn("hover:shadow-lg transition-shadow", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-neutral-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-neutral-900">
                    {value}
                </div>
                {(trend || subtitle) && (
                    <div className="flex items-center gap-2 mt-1">
                        {trend && (
                            <span
                                className={cn(
                                    "text-xs font-medium",
                                    trend.isPositive
                                        ? "text-green-600"
                                        : "text-red-600"
                                )}
                            >
                                {trend.isPositive ? "+" : ""}
                                {trend.value}%
                            </span>
                        )}
                        {subtitle && (
                            <p className="text-xs text-neutral-500">
                                {subtitle}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
