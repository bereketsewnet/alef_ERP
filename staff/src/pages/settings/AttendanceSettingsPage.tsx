import { useState, useEffect } from 'react'
import { PenLine, Wifi, ToggleLeft, Check, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAttendanceMode, useSetAttendanceMode } from '@/services/useSettings'
import type { AttendanceMode } from '@/api/endpoints/settings'

interface ModeCard {
    value: AttendanceMode
    icon: React.ReactNode
    title: string
    subtitle: string
    description: string
    bullets: string[]
    color: string
    border: string
    iconBg: string
}

const MODES: ModeCard[] = [
    {
        value: 'MANUAL',
        icon: <PenLine className="h-6 w-6" />,
        title: 'Manual Only',
        subtitle: 'Agents & supervisors fill attendance',
        description:
            'Attendance is entered manually by agents (HQ) or site supervisors. The GPS / Telegram clock-in system is still available but not the primary method.',
        bullets: [
            'Default tab on Attendance page → Manual Entry',
            'Agents pick date, see all shifts, mark Present / Late / Absent',
            'Supervisors can only manage their assigned sites',
            'GPS entries still appear in the Logs tab if any come in',
        ],
        color: 'text-violet-700',
        border: 'border-violet-400 ring-violet-200',
        iconBg: 'bg-violet-100 text-violet-700',
    },
    {
        value: 'MIXED',
        icon: <ToggleLeft className="h-6 w-6" />,
        title: 'Mixed',
        subtitle: 'GPS primary, manual fills the gaps',
        description:
            'Employees who use the Telegram bot or member portal clock in via GPS. Agents and supervisors use manual entry to fill any missing or incorrect records.',
        bullets: [
            'Both Manual Entry and Logs tabs equally visible',
            'GPS-recorded entries shown in Logs tab',
            'Manual entry used for corrections and missing entries',
            'Best for a transition period',
        ],
        color: 'text-blue-700',
        border: 'border-blue-400 ring-blue-200',
        iconBg: 'bg-blue-100 text-blue-700',
    },
    {
        value: 'GPS',
        icon: <Wifi className="h-6 w-6" />,
        title: 'Full GPS',
        subtitle: 'Employees clock in via Telegram / app',
        description:
            'All employees use the Telegram bot or member portal to clock in and out with GPS verification. Manual entry is still available for emergencies and corrections.',
        bullets: [
            'Default tab on Attendance page → Logs (GPS records)',
            'Real-time GPS verification at the work site',
            'Manual entry tab available as a fallback for corrections',
            'Best for fully digitised teams',
        ],
        color: 'text-green-700',
        border: 'border-green-400 ring-green-200',
        iconBg: 'bg-green-100 text-green-700',
    },
]

export function AttendanceSettingsPage() {
    const { data, isLoading } = useAttendanceMode()
    const { mutate: setMode, isPending } = useSetAttendanceMode()

    const [selected, setSelected] = useState<AttendanceMode>('MANUAL')
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        if (data?.mode) setSelected(data.mode)
    }, [data?.mode])

    const isDirty = data?.mode !== selected

    const handleSave = () => {
        setMode(selected, {
            onSuccess: () => {
                setSaved(true)
                setTimeout(() => setSaved(false), 2500)
            },
        })
    }

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900">Attendance Mode</h1>
                <p className="text-neutral-500 mt-1">
                    Choose how attendance is recorded across the system. This setting affects all
                    agents, supervisors, and the default view on the Attendance page.
                </p>
            </div>

            {isLoading ? (
                <div className="text-neutral-500 py-8 text-center">Loading current setting…</div>
            ) : (
                <div className="space-y-4">
                    {MODES.map((mode) => {
                        const isSelected = selected === mode.value
                        return (
                            <button
                                key={mode.value}
                                type="button"
                                onClick={() => setSelected(mode.value)}
                                className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
                                    isSelected
                                        ? `${mode.border} ring-2 bg-white shadow-sm`
                                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`rounded-lg p-2 shrink-0 ${isSelected ? mode.iconBg : 'bg-neutral-100 text-neutral-500'}`}>
                                        {mode.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold text-base ${isSelected ? mode.color : 'text-neutral-800'}`}>
                                                {mode.title}
                                            </span>
                                            {isSelected && (
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${mode.iconBg}`}>
                                                    Selected
                                                </span>
                                            )}
                                            {data?.mode === mode.value && (
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-neutral-500 mt-0.5">{mode.subtitle}</p>
                                        <p className="text-sm text-neutral-700 mt-2">{mode.description}</p>
                                        <ul className="mt-3 space-y-1">
                                            {mode.bullets.map((b) => (
                                                <li key={b} className="flex items-start gap-2 text-sm text-neutral-600">
                                                    <Check className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${isSelected ? mode.color : 'text-neutral-400'}`} />
                                                    {b}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Radio indicator */}
                                    <div className={`mt-1 h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                                        isSelected ? `${mode.border.split(' ')[0]} bg-white` : 'border-neutral-300'
                                    }`}>
                                        {isSelected && (
                                            <div className={`h-2.5 w-2.5 rounded-full ${mode.iconBg.split(' ')[0].replace('bg-', 'bg-')}`} />
                                        )}
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Info note */}
            <div className="flex items-start gap-2 text-sm text-neutral-500 bg-neutral-50 border rounded-lg px-4 py-3">
                <Info className="h-4 w-4 mt-0.5 shrink-0 text-neutral-400" />
                <span>
                    Changing the mode takes effect immediately for all users. GPS clock-in endpoints
                    are always available regardless of mode — this setting only controls the default
                    view and workflow guidance shown to agents and supervisors.
                </span>
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
                <Button
                    onClick={handleSave}
                    disabled={!isDirty || isPending}
                    className="min-w-32"
                >
                    {isPending ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
                </Button>
                {isDirty && !isPending && (
                    <span className="text-sm text-neutral-500">You have unsaved changes</span>
                )}
            </div>
        </div>
    )
}
