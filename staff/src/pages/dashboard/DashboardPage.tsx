import { KPICard } from "@/components/dashboard/KPICard"
import { AttendanceTrendChart } from "@/components/dashboard/AttendanceTrendChart"
import { RecentRoster } from "@/components/dashboard/RecentRoster"
import { LiveMap } from "@/components/dashboard/LiveMap"
import { AssetAvailabilityChart } from "@/components/dashboard/AssetAvailabilityChart"
import { Users, ClipboardCheck, AlertTriangle, Package } from "lucide-react"
import { useReportDashboard } from "@/services/useReports"
import { Loader2 } from "lucide-react"

export function DashboardPage() {
    const { data: stats, isLoading } = useReportDashboard()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                    Dashboard
                </h1>
                <p className="text-neutral-600 mt-1">
                    Welcome back! Here's an overview of your operations.
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        <KPICard
                            title="Active Employees"
                            value={stats?.active_employees || 0}
                            icon={Users}
                            trend={stats?.employee_growth ? { 
                                value: Math.abs(stats.employee_growth), 
                                isPositive: stats.employee_growth >= 0 
                            } : undefined}
                            subtitle="vs last month"
                        />
                        <KPICard
                            title="Attendance Today"
                            value={`${stats?.attendance_today || 0}/${stats?.active_employees || 0}`}
                            icon={ClipboardCheck}
                            trend={stats?.attendance_growth ? { 
                                value: Math.abs(stats.attendance_growth), 
                                isPositive: stats.attendance_growth >= 0 
                            } : undefined}
                            subtitle={`${stats?.attendance_rate || 0}% attendance rate`}
                        />
                        <KPICard
                            title="Open Incidents"
                            value={stats?.open_incidents || 0}
                            icon={AlertTriangle}
                            trend={stats?.incident_change ? { 
                                value: Math.abs(stats.incident_change), 
                                isPositive: stats.incident_change <= 0 
                            } : undefined}
                            subtitle="vs last week"
                        />
                        <KPICard
                            title="Assets in Use"
                            value={`${stats?.assets_in_use_percent || 0}%`}
                            icon={Package}
                            subtitle={`${stats?.total_assets || 0} total assets`}
                        />
                    </div>

                    {/* Charts and Roster */}
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <AttendanceTrendChart data={stats?.attendance_trend} />
                        </div>
                        <div>
                            <RecentRoster />
                        </div>
                    </div>

                    {/* Map and Asset Chart */}
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                        <LiveMap />
                        <AssetAvailabilityChart />
                    </div>
                </>
            )}
        </div>
    )
}
