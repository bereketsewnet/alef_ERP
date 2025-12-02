import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Clock } from "lucide-react"

export function RosterPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                        Roster Management
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                        Schedule and assign shifts to employees
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Users className="mr-2 h-4 w-4" />
                        Bulk Assign
                    </Button>
                    <Button className="bg-primary-600 hover:bg-primary-700">
                        <Calendar className="mr-2 h-4 w-4" />
                        New Shift
                    </Button>
                </div>
            </div>

            {/* Placeholder for FullCalendar */}
            <Card>
                <CardHeader>
                    <CardTitle>Shift Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[600px] flex items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                        <div className="text-center">
                            <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                                FullCalendar Integration
                            </p>
                            <p className="text-sm text-neutral-500 mb-4">
                                Drag-and-drop calendar for shift scheduling
                            </p>
                            <Button variant="outline" disabled>
                                Requires FullCalendar Installation
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Shifts This Week
                                </p>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                    342
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-primary-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Unassigned Shifts
                                </p>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                    12
                                </p>
                            </div>
                            <Calendar className="h-8 w-8 text-amber-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Conflicts Detected
                                </p>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                    3
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
