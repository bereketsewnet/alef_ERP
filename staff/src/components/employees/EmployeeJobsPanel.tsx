import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, Star, StarOff, Settings, Loader2, Briefcase } from 'lucide-react'
import { useEmployeeJobs, useAssignJobToEmployee, useRemoveJobFromEmployee, useSetEmployeePrimaryJob, useUpdateEmployeeJob, useJobs } from '@/services/useJobs'
import { formatCurrency } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { EmployeeJob } from '@/api/endpoints/jobs'

interface EmployeeJobsPanelProps {
    employeeId: number
    employeeName: string
}

export function EmployeeJobsPanel({ employeeId, employeeName }: EmployeeJobsPanelProps) {
    const [assignModalOpen, setAssignModalOpen] = useState(false)
    const [overrideModalOpen, setOverrideModalOpen] = useState(false)
    const [selectedJob, setSelectedJob] = useState<EmployeeJob | null>(null)
    const [removeJobId, setRemoveJobId] = useState<number | null>(null)

    // Form states for assign modal
    const [selectedJobId, setSelectedJobId] = useState<string>('')
    const [isPrimary, setIsPrimary] = useState(false)

    // Override form states
    const [overrideSalary, setOverrideSalary] = useState<string>('')
    const [overrideHourlyRate, setOverrideHourlyRate] = useState<string>('')
    const [overrideTax, setOverrideTax] = useState<string>('')
    const [overrideLatePenalty, setOverrideLatePenalty] = useState<string>('')
    const [overrideAbsentPenalty, setOverrideAbsentPenalty] = useState<string>('')
    const [overrideAgencyFee, setOverrideAgencyFee] = useState<string>('')
    const [overrideOvertimeMultiplier, setOverrideOvertimeMultiplier] = useState<string>('')

    const { data: employeeJobs, isLoading } = useEmployeeJobs(employeeId)
    const { data: allJobs } = useJobs({ active_only: true })
    const assignJob = useAssignJobToEmployee()
    const removeJob = useRemoveJobFromEmployee()
    const setPrimaryJob = useSetEmployeePrimaryJob()
    const updateJob = useUpdateEmployeeJob()

    // Filter out jobs already assigned
    const availableJobs = allJobs?.filter(
        job => !employeeJobs?.some(ej => ej.id === job.id)
    ) || []

    const handleAssignJob = () => {
        if (!selectedJobId) return

        assignJob.mutate({
            employeeId,
            data: {
                job_id: parseInt(selectedJobId),
                is_primary: isPrimary,
            }
        }, {
            onSuccess: () => {
                setAssignModalOpen(false)
                setSelectedJobId('')
                setIsPrimary(false)
            }
        })
    }

    const handleRemoveJob = () => {
        if (!removeJobId) return
        removeJob.mutate({ employeeId, jobId: removeJobId }, {
            onSuccess: () => setRemoveJobId(null)
        })
    }

    const handleSetPrimary = (jobId: number) => {
        setPrimaryJob.mutate({ employeeId, jobId })
    }

    const openOverrideModal = (job: EmployeeJob) => {
        setSelectedJob(job)
        setOverrideSalary(job.pivot.override_salary?.toString() || '')
        setOverrideHourlyRate(job.pivot.override_hourly_rate?.toString() || '')
        setOverrideTax(job.pivot.override_tax_percent?.toString() || '')
        setOverrideLatePenalty(job.pivot.override_late_penalty?.toString() || '')
        setOverrideAbsentPenalty(job.pivot.override_absent_penalty?.toString() || '')
        setOverrideAgencyFee(job.pivot.override_agency_fee_percent?.toString() || '')
        setOverrideOvertimeMultiplier(job.pivot.override_overtime_multiplier?.toString() || '')
        setOverrideModalOpen(true)
    }

    const handleSaveOverrides = () => {
        if (!selectedJob) return

        updateJob.mutate({
            employeeId,
            jobId: selectedJob.id,
            data: {
                override_salary: overrideSalary ? parseFloat(overrideSalary) : undefined,
                override_hourly_rate: overrideHourlyRate ? parseFloat(overrideHourlyRate) : undefined,
                override_tax_percent: overrideTax ? parseFloat(overrideTax) : undefined,
                override_late_penalty: overrideLatePenalty ? parseFloat(overrideLatePenalty) : undefined,
                override_absent_penalty: overrideAbsentPenalty ? parseFloat(overrideAbsentPenalty) : undefined,
                override_agency_fee_percent: overrideAgencyFee ? parseFloat(overrideAgencyFee) : undefined,
                override_overtime_multiplier: overrideOvertimeMultiplier ? parseFloat(overrideOvertimeMultiplier) : undefined,
            }
        }, {
            onSuccess: () => {
                setOverrideModalOpen(false)
                setSelectedJob(null)
            }
        })
    }

    const hasOverrides = (job: EmployeeJob) => {
        return job.pivot.override_salary != null ||
            job.pivot.override_hourly_rate != null ||
            job.pivot.override_tax_percent != null ||
            job.pivot.override_late_penalty != null ||
            job.pivot.override_absent_penalty != null ||
            job.pivot.override_agency_fee_percent != null ||
            job.pivot.override_overtime_multiplier != null
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Assigned Jobs
                </CardTitle>
                <Button size="sm" onClick={() => setAssignModalOpen(true)} disabled={availableJobs.length === 0}>
                    <Plus className="h-4 w-4 mr-1" />
                    Assign Job
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                    </div>
                ) : employeeJobs?.length === 0 ? (
                    <p className="text-center text-neutral-500 py-4">
                        No jobs assigned. Click "Assign Job" to add the first one.
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Job</TableHead>
                                <TableHead>Pay Type</TableHead>
                                <TableHead>Base Salary</TableHead>
                                <TableHead>Hourly Rate</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employeeJobs?.map(job => (
                                <TableRow key={job.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm text-neutral-500">{job.job_code}</span>
                                            <span className="font-medium">{job.job_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{job.pay_type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {job.pivot.override_salary != null ? (
                                            <span className="text-green-600">{formatCurrency(job.pivot.override_salary)}</span>
                                        ) : (
                                            formatCurrency(job.base_salary)
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {job.pivot.override_hourly_rate != null ? (
                                            <span className="text-green-600">{formatCurrency(job.pivot.override_hourly_rate)}/hr</span>
                                        ) : (
                                            <span>{formatCurrency(job.hourly_rate)}/hr</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {job.pivot.is_primary && (
                                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                                    Primary
                                                </Badge>
                                            )}
                                            {hasOverrides(job) && (
                                                <Badge variant="secondary">Overrides</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleSetPrimary(job.id)}
                                                disabled={job.pivot.is_primary || setPrimaryJob.isPending}
                                                title={job.pivot.is_primary ? 'Already primary' : 'Set as primary'}
                                            >
                                                {job.pivot.is_primary ? (
                                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                ) : (
                                                    <StarOff className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => openOverrideModal(job)}
                                                title="Configure overrides"
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-red-600"
                                                onClick={() => setRemoveJobId(job.id)}
                                                title="Remove job"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            {/* Assign Job Modal */}
            <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Job to {employeeName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Job</Label>
                            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a job..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableJobs.map(job => (
                                        <SelectItem key={job.id} value={job.id.toString()}>
                                            {job.job_code} - {job.job_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {employeeJobs?.length === 0 && (
                            <p className="text-sm text-neutral-500">
                                This will be set as the primary job automatically.
                            </p>
                        )}
                        {employeeJobs && employeeJobs.length > 0 && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isPrimary"
                                    checked={isPrimary}
                                    onChange={e => setIsPrimary(e.target.checked)}
                                    className="rounded border-neutral-300"
                                />
                                <Label htmlFor="isPrimary">Set as primary job</Label>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssignJob} disabled={!selectedJobId || assignJob.isPending}>
                            {assignJob.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Assign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Override Settings Modal */}
            <Dialog open={overrideModalOpen} onOpenChange={setOverrideModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Override Settings for {selectedJob?.job_name}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-neutral-500 mb-4">
                        Leave fields empty to use the job's default values.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Base Salary (ETB)</Label>
                            <Input
                                type="number"
                                placeholder={selectedJob?.base_salary?.toString() || 'Default'}
                                value={overrideSalary}
                                onChange={e => setOverrideSalary(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Hourly Rate (ETB)</Label>
                            <Input
                                type="number"
                                placeholder={selectedJob?.hourly_rate?.toString() || 'Default'}
                                value={overrideHourlyRate}
                                onChange={e => setOverrideHourlyRate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tax %</Label>
                            <Input
                                type="number"
                                placeholder={selectedJob?.tax_percent?.toString() || 'Default'}
                                value={overrideTax}
                                onChange={e => setOverrideTax(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Agency Fee %</Label>
                            <Input
                                type="number"
                                placeholder={selectedJob?.agency_fee_percent?.toString() || 'Default'}
                                value={overrideAgencyFee}
                                onChange={e => setOverrideAgencyFee(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Late Penalty (ETB)</Label>
                            <Input
                                type="number"
                                placeholder={selectedJob?.late_penalty?.toString() || 'Default'}
                                value={overrideLatePenalty}
                                onChange={e => setOverrideLatePenalty(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Absent Penalty (ETB)</Label>
                            <Input
                                type="number"
                                placeholder={selectedJob?.absent_penalty?.toString() || 'Default'}
                                value={overrideAbsentPenalty}
                                onChange={e => setOverrideAbsentPenalty(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Overtime Multiplier</Label>
                            <Input
                                type="number"
                                step="0.1"
                                placeholder={selectedJob?.overtime_multiplier?.toString() || 'Default'}
                                value={overrideOvertimeMultiplier}
                                onChange={e => setOverrideOvertimeMultiplier(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setOverrideModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveOverrides} disabled={updateJob.isPending}>
                            {updateJob.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Overrides
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Confirmation */}
            <ConfirmDialog
                open={!!removeJobId}
                onOpenChange={() => setRemoveJobId(null)}
                title="Remove Job"
                description="Are you sure you want to remove this job from the employee?"
                onConfirm={handleRemoveJob}
                confirmText="Remove"
                cancelText="Cancel"
                variant="destructive"
            />
        </Card>
    )
}
