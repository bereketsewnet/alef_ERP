import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Clock, User, MapPin, AlertCircle } from "lucide-react"

interface Activity {
    id: number
    type: "clock_in" | "clock_out" | "incident" | "shift_created"
    employee: string
    site?: string
    timestamp: string
    description: string
}

// Mock data - replace with actual API data
const mockActivities: Activity[] = [
    {
        id: 1,
        type: "clock_in",
        employee: "John Doe",
        site: "Downtown Mall",
        timestamp: "2 minutes ago",
        description: "Clocked in successfully",
    },
    {
        id: 2,
        type: "incident",
        employee: "Jane Smith",
        site: "Airport Terminal A",
        timestamp: "15 minutes ago",
        description: "Reported suspicious activity",
    },
    {
        id: 3,
        type: "clock_out",
        employee: "Mike Johnson",
        site: "Bank HQ",
        timestamp: "23 minutes ago",
        description: "Clocked out on time",
    },
    {
        id: 4,
        type: "shift_created",
        employee: "Sarah Wilson",
        site: "Shopping Center",
        timestamp: "1 hour ago",
        description: "Night shift assigned",
    },
    {
        id: 5,
        type: "clock_in",
        employee: "Tom Brown",
        site: "Hospital Main",
        timestamp: "2 hours ago",
        description: "Clocked in 5 minutes late",
    },
]

const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
        case "clock_in":
        case "clock_out":
            return Clock
        case "incident":
            return AlertCircle
        case "shift_created":
            return User
        default:
            return Clock
    }
}

const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
        case "clock_in":
            return "success"
        case "clock_out":
            return "secondary"
        case "incident":
            return "destructive"
        case "shift_created":
            return "info"
        default:
            return "default"
    }
}

export function ActivityFeed() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                        {mockActivities.map((activity) => {
                            const Icon = getActivityIcon(activity.type)
                            return (
                                <div
                                    key={activity.id}
                                    className="flex gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800 last:border-0"
                                >
                                    <div className="mt-1">
                                        <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                                            <Icon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                                    {activity.employee}
                                                </p>
                                                {activity.site && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <MapPin className="h-3 w-3 text-neutral-500" />
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                            {activity.site}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <Badge variant={getActivityColor(activity.type)}>
                                                {activity.type.replace("_", " ")}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                            {activity.description}
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                            {activity.timestamp}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
