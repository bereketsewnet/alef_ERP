import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Copy, RotateCcw } from "lucide-react"

interface DaySchedule {
    enabled: boolean
    start_time: string
    end_time: string
}

interface WorkingDaysSchedule {
    monday: DaySchedule
    tuesday: DaySchedule
    wednesday: DaySchedule
    thursday: DaySchedule
    friday: DaySchedule
    saturday: DaySchedule
    sunday: DaySchedule
}

interface WorkingDaysSelectorProps {
    defaultStartTime?: string
    defaultEndTime?: string
    value?: WorkingDaysSchedule | null
    onChange?: (schedule: WorkingDaysSchedule | null) => void
}

const defaultSchedule = (startTime: string, endTime: string): WorkingDaysSchedule => ({
    monday: { enabled: true, start_time: startTime, end_time: endTime },
    tuesday: { enabled: true, start_time: startTime, end_time: endTime },
    wednesday: { enabled: true, start_time: startTime, end_time: endTime },
    thursday: { enabled: true, start_time: startTime, end_time: endTime },
    friday: { enabled: true, start_time: startTime, end_time: endTime },
    saturday: { enabled: false, start_time: startTime, end_time: endTime },
    sunday: { enabled: false, start_time: startTime, end_time: endTime },
})

export function WorkingDaysSelector({
    defaultStartTime = "08:00",
    defaultEndTime = "17:00",
    value,
    onChange,
}: WorkingDaysSelectorProps) {
    const [schedule, setSchedule] = useState<WorkingDaysSchedule>(
        value || defaultSchedule(defaultStartTime, defaultEndTime)
    )
    const [useAdvanced, setUseAdvanced] = useState(false)

    const dayLabels: Record<keyof WorkingDaysSchedule, string> = {
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
        sunday: "Sunday",
    }

    const updateSchedule = (day: keyof WorkingDaysSchedule, updates: Partial<DaySchedule>) => {
        const newSchedule = {
            ...schedule,
            [day]: { ...schedule[day], ...updates },
        }
        setSchedule(newSchedule)
        onChange?.(newSchedule)
    }

    const applyToAll = (field: 'start_time' | 'end_time', value: string) => {
        const newSchedule = { ...schedule }
        Object.keys(newSchedule).forEach((day) => {
            newSchedule[day as keyof WorkingDaysSchedule][field] = value
        })
        setSchedule(newSchedule)
        onChange?.(newSchedule)
    }

    const resetToDefaults = () => {
        const newSchedule = defaultSchedule(defaultStartTime, defaultEndTime)
        setSchedule(newSchedule)
        onChange?.(newSchedule)
    }

    // If not using advanced mode, show simple toggle
    if (!useAdvanced) {
        return (
            <div className="space-y-3 p-4 border-2 border-neutral-200 rounded-lg bg-white hover:border-primary-300 transition-colors">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <Label className="text-sm font-semibold text-neutral-900 block mb-1">
                            Advanced Working Days Schedule
                        </Label>
                        <p className="text-xs text-neutral-600">
                            Enable to set different working days and hours (e.g., Monday-Wednesday-Friday only, or half-day Saturday)
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 bg-white px-3 py-2 rounded-lg border border-neutral-200">
                        <span className={`text-sm font-semibold ${!useAdvanced ? 'text-neutral-600' : 'text-neutral-400'}`}>
                            Simple
                        </span>
                        <Switch
                            checked={useAdvanced}
                            onCheckedChange={(checked) => {
                                setUseAdvanced(checked)
                                if (checked) {
                                    const newSchedule = defaultSchedule(defaultStartTime, defaultEndTime)
                                    setSchedule(newSchedule)
                                    onChange?.(newSchedule)
                                } else {
                                    onChange?.(null)
                                }
                            }}
                            className="cursor-pointer"
                            disabled={false}
                        />
                        <span className={`text-sm font-semibold ${useAdvanced ? 'text-primary-600' : 'text-neutral-400'}`}>
                            Advanced
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Card className="border-2 border-primary-200">
            <CardHeader className="bg-primary-50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Working Days & Hours Schedule</CardTitle>
                        <p className="text-xs text-neutral-600 mt-1">Configure which days employees work and their specific hours</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const allStartTime = schedule.monday.start_time
                                const allEndTime = schedule.monday.end_time
                                applyToAll('start_time', allStartTime)
                                applyToAll('end_time', allEndTime)
                            }}
                        >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Monday to All
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={resetToDefaults}
                        >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset
                        </Button>
                        <div className="flex items-center gap-3 border-l pl-3">
                            <span className={`text-sm font-medium ${!useAdvanced ? 'text-neutral-500' : 'text-neutral-900'}`}>
                                Disabled
                            </span>
                            <Switch
                                checked={useAdvanced}
                                onCheckedChange={(checked) => {
                                    setUseAdvanced(checked)
                                    if (!checked) {
                                        onChange?.(null)
                                    }
                                }}
                                className="cursor-pointer"
                            />
                            <span className={`text-sm font-medium ${useAdvanced ? 'text-primary-600' : 'text-neutral-500'}`}>
                                Enabled
                            </span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.entries(dayLabels).map(([dayKey, dayLabel]) => {
                    const day = dayKey as keyof WorkingDaysSchedule
                    const daySchedule = schedule[day]

                    return (
                        <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                            <div className="flex items-center gap-3 flex-1">
                                <Switch
                                    checked={daySchedule.enabled}
                                    onCheckedChange={(enabled) => {
                                        updateSchedule(day, { enabled })
                                    }}
                                />
                                <Label className="font-medium min-w-[100px]">{dayLabel}</Label>
                            </div>
                            {daySchedule.enabled && (
                                <div className="flex items-center gap-2 flex-1">
                                    <div className="flex-1">
                                        <Label className="text-xs text-neutral-500">Start</Label>
                                        <Input
                                            type="time"
                                            value={daySchedule.start_time}
                                            onChange={(e) => {
                                                updateSchedule(day, { start_time: e.target.value })
                                            }}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-xs text-neutral-500">End</Label>
                                        <Input
                                            type="time"
                                            value={daySchedule.end_time}
                                            onChange={(e) => {
                                                updateSchedule(day, { end_time: e.target.value })
                                            }}
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                            )}
                            {!daySchedule.enabled && (
                                <div className="flex-1 text-sm text-neutral-400">Day off</div>
                            )}
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}

