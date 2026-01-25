import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts"

interface AttendanceTrendChartProps {
    data?: Array<{
        date: string
        clockIns: number
        clockOuts: number
    }>
}

export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
    // Use provided data or empty array
    const chartData = data || []

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Trend (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-neutral-500">
                        No attendance data available
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Attendance Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200" />
                        <XAxis
                            dataKey="date"
                            className="text-xs text-neutral-600"
                        />
                        <YAxis className="text-xs text-neutral-600" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "6px",
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="clockIns"
                            stroke="#0B3D91"
                            strokeWidth={2}
                            name="Clock Ins"
                            dot={{ fill: "#0B3D91" }}
                        />
                        <Line
                            type="monotone"
                            dataKey="clockOuts"
                            stroke="#0FA3A3"
                            strokeWidth={2}
                            name="Clock Outs"
                            dot={{ fill: "#0FA3A3" }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
