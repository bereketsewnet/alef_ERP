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

// Mock data - replace with actual API data
const mockData = [
    { date: "Mon", clockIns: 45, clockOuts: 43 },
    { date: "Tue", clockIns: 52, clockOuts: 50 },
    { date: "Wed", clockIns: 49, clockOuts: 49 },
    { date: "Thu", clockIns: 48, clockOuts: 46 },
    { date: "Fri", clockIns: 54, clockOuts: 53 },
    { date: "Sat", clockIns: 38, clockOuts: 37 },
    { date: "Sun", clockIns: 30, clockOuts: 29 },
]

export function AttendanceTrendChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Attendance Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
                        <XAxis
                            dataKey="date"
                            className="text-xs text-neutral-600 dark:text-neutral-400"
                        />
                        <YAxis className="text-xs text-neutral-600 dark:text-neutral-400" />
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
