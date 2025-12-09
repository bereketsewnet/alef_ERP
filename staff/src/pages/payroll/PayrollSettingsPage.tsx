
import { useState, useEffect } from "react"
import { usePayrollSettings, useUpdatePayrollSetting } from "@/services/usePayroll"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

export function PayrollSettingsPage() {
    const { data: settings, isLoading } = usePayrollSettings()
    const { mutate: updateSetting, isPending } = useUpdatePayrollSetting()

    // Helper to find setting value safely
    const getSettingValue = (key: string, defaultValue: any) => {
        const setting = settings?.find((s: any) => s.setting_key === key)
        return (setting && setting.setting_value !== null && setting.setting_value !== undefined) ? setting.setting_value : defaultValue
    }

    // Local state for forms
    const [taxBrackets, setTaxBrackets] = useState<any[]>(getSettingValue('tax_brackets', []))
    const [pensionEmployee, setPensionEmployee] = useState(getSettingValue('pension_employee_rate', 7))
    const [pensionEmployer, setPensionEmployer] = useState(getSettingValue('pension_employer_rate', 11))
    const [overtimeMult, setOvertimeMult] = useState(getSettingValue('overtime_multiplier', 1.5))
    const [penaltyLate, setPenaltyLate] = useState(getSettingValue('penalty_late_fee', 50))

    useEffect(() => {
        if (settings) {
            setTaxBrackets(getSettingValue('tax_brackets', []))
            setPensionEmployee(getSettingValue('pension_employee_rate', 7))
            setPensionEmployer(getSettingValue('pension_employer_rate', 11))
            setOvertimeMult(getSettingValue('overtime_multiplier', 1.5))
            setPenaltyLate(getSettingValue('penalty_late_fee', 50))
        }
    }, [settings])

    // Update handlers
    const handleSaveTax = () => {
        updateSetting({ key: 'tax_brackets', data: { setting_value: taxBrackets, description: 'Updated tax brackets' } })
    }

    const handleSavePension = () => {
        updateSetting({ key: 'pension_employee_rate', data: { setting_value: pensionEmployee, setting_type: 'percentage' } })
        updateSetting({ key: 'pension_employer_rate', data: { setting_value: pensionEmployer, setting_type: 'percentage' } })
    }

    const handleSaveGeneral = () => {
        updateSetting({ key: 'overtime_multiplier', data: { setting_value: overtimeMult, setting_type: 'number' } })
        updateSetting({ key: 'penalty_late_fee', data: { setting_value: penaltyLate, setting_type: 'number' } })
    }

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900">Payroll Configuration</h1>
                <p className="text-neutral-600 mt-1">Manage tax rates, pension contributions, and other payroll parameters.</p>
            </div>

            {/* Tax Brackets */}
            <Card>
                <CardHeader>
                    <CardTitle>Income Tax Brackets</CardTitle>
                    <CardDescription>Define progressive tax rates based on monthly income ranges.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {taxBrackets?.map((bracket: any, index: number) => (
                        <div key={index} className="flex items-end gap-3">
                            <div className="grid gap-2 flex-1">
                                <Label>Min Income</Label>
                                <Input
                                    type="number"
                                    value={bracket.min ?? ''}
                                    onChange={(e) => {
                                        const newBrackets = [...taxBrackets]
                                        newBrackets[index].min = parseFloat(e.target.value)
                                        setTaxBrackets(newBrackets)
                                    }}
                                />
                            </div>
                            <div className="grid gap-2 flex-1">
                                <Label>Max Income (Null for infinite)</Label>
                                <Input
                                    type="number"
                                    value={bracket.max ?? ''}
                                    placeholder="Unlimited"
                                    onChange={(e) => {
                                        const newBrackets = [...taxBrackets]
                                        newBrackets[index].max = e.target.value ? parseFloat(e.target.value) : null
                                        setTaxBrackets(newBrackets)
                                    }}
                                />
                            </div>
                            <div className="grid gap-2 w-24">
                                <Label>Rate (%)</Label>
                                <Input
                                    type="number"
                                    value={bracket.rate ?? ''}
                                    onChange={(e) => {
                                        const newBrackets = [...taxBrackets]
                                        newBrackets[index].rate = parseFloat(e.target.value)
                                        setTaxBrackets(newBrackets)
                                    }}
                                />
                            </div>
                            <div className="grid gap-2 w-32">
                                <Label>Deduction</Label>
                                <Input
                                    type="number"
                                    value={bracket.deduction ?? ''}
                                    onChange={(e) => {
                                        const newBrackets = [...taxBrackets]
                                        newBrackets[index].deduction = parseFloat(e.target.value)
                                        setTaxBrackets(newBrackets)
                                    }}
                                />
                            </div>
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => {
                                    const newBrackets = taxBrackets.filter((_, i) => i !== index)
                                    setTaxBrackets(newBrackets)
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        onClick={() => setTaxBrackets([...taxBrackets, { min: 0, max: null, rate: 0, deduction: 0 }])}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Bracket
                    </Button>
                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleSaveTax} disabled={isPending}>
                            <Save className="mr-2 h-4 w-4" /> Save Tax Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Pension Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pension & Insurance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Employee Contribution (%)</Label>
                            <Input
                                type="number"
                                value={pensionEmployee ?? ''}
                                onChange={(e) => setPensionEmployee(parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Employer Contribution (%)</Label>
                            <Input
                                type="number"
                                value={pensionEmployer ?? ''}
                                onChange={(e) => setPensionEmployer(parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="pt-2 flex justify-end">
                            <Button onClick={handleSavePension} disabled={isPending}>
                                <Save className="mr-2 h-4 w-4" /> Save
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>General Parameters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Overtime Multiplier (e.g. 1.5)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={overtimeMult ?? ''}
                                onChange={(e) => setOvertimeMult(parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Late Arrival Penalty Fee (ETB)</Label>
                            <Input
                                type="number"
                                value={penaltyLate ?? ''}
                                onChange={(e) => setPenaltyLate(parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="pt-2 flex justify-end">
                            <Button onClick={handleSaveGeneral} disabled={isPending}>
                                <Save className="mr-2 h-4 w-4" /> Save
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
