import { KPICard } from "@/components/dashboard/KPICard"
import { AttendanceTrendChart } from "@/components/dashboard/AttendanceTrendChart"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { Users, ClipboardCheck, AlertTriangle, Package } from "lucide-react"

export function DashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                    Dashboard
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                    Welcome back! Here's an overview of your operations.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Active Employees"
                    value="156"
                    icon={Users}
                    trend={{ value: 12, isPositive: true }}
                    subtitle="vs last month"
                />
                <KPICard
                    title="Attendance Today"
                    value="142/156"
                    icon={ClipboardCheck}
                    trend={{ value: 5, isPositive: true }}
                    subtitle="91% attendance rate"
                />
                <KPICard
                    title="Open Incidents"
                    value="3"
                    icon={AlertTriangle}
                    trend={{ value: 40, isPositive: false }}
                    subtitle="vs last week"
                />
                <KPICard
                    title="Assets in Use"
                    value="89%"
                    icon={Package}
                    subtitle="248 total assets"
                />
            </div>

            {/* Charts and Activity */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <AttendanceTrendChart />
                </div>
                <div>
                    <ActivityFeed />
                </div>
            </div>

            {/* Placeholder for Map and Additional Widgets */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="h-[400px] rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                            Live Map (Leaflet)
                        </p>
                        <p className="text-sm text-neutral-500">
                            Coming soon - will show active clock-ins
                        </p>
                    </div>
                </div>
                <div className="h-[400px] rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                            Asset Availability Chart
                        </p>
                        <p className="text-sm text-neutral-500">
                            Coming soon - pie chart by category
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
