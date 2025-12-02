import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Download, DollarSign } from "lucide-react"

export function PayrollPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                        Payroll
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                        Process payroll and generate payslips
                    </p>
                </div>
                <Button className="bg-primary-600 hover:bg-primary-700">
                    <Calendar className="mr-2 h-4 w-4" />
                    Run Payroll
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Total Gross (This Month)
                                </p>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                    1,245,000 ETB
                                </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            Total Deductions
                        </p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                            187,500 ETB
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            Net Payable
                        </p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                            1,057,500 ETB
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payroll History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { month: "November 2024", status: "completed", amount: 1057500 },
                            { month: "October 2024", status: "completed", amount: 1023400 },
                            { month: "September 2024", status: "completed", amount: 998200 },
                        ].map((record, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg"
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-neutral-900 dark:text-neutral-50">
                                        {record.month}
                                    </p>
                                    <p className="text-sm text-neutral-500">
                                        {record.amount.toLocaleString()} ETB
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="success">Completed</Badge>
                                    <Button variant="outline" size="sm">
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
