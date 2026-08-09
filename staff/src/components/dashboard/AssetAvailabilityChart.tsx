import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts"
import { useReportDashboard } from "@/services/useReports"
import { Loader2 } from "lucide-react"

const COLORS = ['#07324A', '#DDA822', '#1C6D9C', '#CA2B2B', '#2C9664', '#1D5372', '#B68816']

export function AssetAvailabilityChart() {
    const { data: dashboardData, isLoading, error } = useReportDashboard()

    const chartData = dashboardData?.asset_categories
        ?.filter((category) => category && category.category && (category.total || 0) > 0)
        ?.map((category) => ({
            name: category.category || 'Uncategorized',
            value: category.total || 0, // Show total assets per category
            assigned: category.assigned || 0,
            total: category.total || 0,
            available: category.available || 0,
        })) || []

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-sm text-neutral-600">Total: {data.total}</p>
                    <p className="text-sm text-neutral-600">Assigned: {data.assigned}</p>
                    <p className="text-sm text-neutral-600">Available: {data.available}</p>
                </div>
            )
        }
        return null
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Asset Availability Chart</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Asset Availability Chart</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] flex items-center justify-center">
                        <p className="text-red-500">Error loading asset data</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!dashboardData?.asset_categories || chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Asset Availability Chart</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] flex items-center justify-center">
                        <p className="text-neutral-500">No asset categories available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Asset Availability by Category</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="w-full" style={{ height: 400, minHeight: 400 }}>
                    <ResponsiveContainer width="100%" height={400} minHeight={300}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent, value }) => {
                                    if (percent === undefined || percent === null) return ''
                                    return `${name}\n${value} (${(percent * 100).toFixed(0)}%)`
                                }}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                formatter={(value) => value}
                                wrapperStyle={{ paddingTop: '20px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
