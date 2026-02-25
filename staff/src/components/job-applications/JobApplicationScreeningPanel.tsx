import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2, ShieldCheck, ClipboardList } from 'lucide-react'
import {
    useJobApplicationScreenings,
    useCreateJobApplicationScreening,
    useUpdateJobApplicationScreening,
    useDeleteJobApplicationScreening,
} from '@/services/useJobApplicationScreenings'
import type {
    JobApplicationScreening,
    ApplicationScreeningCategory,
} from '@/api/endpoints/jobApplicationScreenings'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface JobApplicationScreeningPanelProps {
    jobApplicationId: number
}

const CATEGORY_LABELS: { value: ApplicationScreeningCategory; label: string }[] = [
    { value: 'security', label: 'Security' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'driving', label: 'Driving' },
    { value: 'loading_unloading', label: 'Loading / Unloading' },
    { value: 'nursing', label: 'Nursing' },
    { value: 'general_service', label: 'General Service' },
]

export function JobApplicationScreeningPanel({ jobApplicationId }: JobApplicationScreeningPanelProps) {
    const { data: screenings, isLoading } = useJobApplicationScreenings(jobApplicationId)
    const createScreening = useCreateJobApplicationScreening(jobApplicationId)
    const updateScreening = useUpdateJobApplicationScreening(jobApplicationId)
    const deleteScreening = useDeleteJobApplicationScreening(jobApplicationId)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editing, setEditing] = useState<JobApplicationScreening | null>(null)
    const [category, setCategory] = useState<ApplicationScreeningCategory>('security')
    const [screeningDate, setScreeningDate] = useState<string>('')
    const [interviewPassed, setInterviewPassed] = useState<boolean>(false)
    const [writtenRequired, setWrittenRequired] = useState<boolean>(false)
    const [writtenScore, setWrittenScore] = useState<string>('')
    const [writtenPassed, setWrittenPassed] = useState<boolean>(false)
    const [practicalRequired, setPracticalRequired] = useState<boolean>(false)
    const [practicalScore, setPracticalScore] = useState<string>('')
    const [practicalPassed, setPracticalPassed] = useState<boolean>(false)
    const [overallPassed, setOverallPassed] = useState<boolean>(false)
    const [vehicleRentalCost, setVehicleRentalCost] = useState<string>('')
    const [notes, setNotes] = useState<string>('')
    const [deleteId, setDeleteId] = useState<number | null>(null)

    const resetForm = () => {
        setEditing(null)
        setCategory('security')
        setScreeningDate('')
        setInterviewPassed(false)
        setWrittenRequired(false)
        setWrittenScore('')
        setWrittenPassed(false)
        setPracticalRequired(false)
        setPracticalScore('')
        setPracticalPassed(false)
        setOverallPassed(false)
        setVehicleRentalCost('')
        setNotes('')
    }

    const openCreate = () => {
        resetForm()
        setIsModalOpen(true)
    }

    const openEdit = (s: JobApplicationScreening) => {
        setEditing(s)
        setCategory((s.category as ApplicationScreeningCategory) || 'security')
        setScreeningDate(s.screening_date || '')
        setInterviewPassed(!!s.interview_passed)
        setWrittenRequired(!!s.written_exam_required)
        setWrittenScore(s.written_score != null ? String(s.written_score) : '')
        setWrittenPassed(!!s.written_passed)
        setPracticalRequired(!!s.practical_exam_required)
        setPracticalScore(s.practical_score != null ? String(s.practical_score) : '')
        setPracticalPassed(!!s.practical_passed)
        setOverallPassed(!!s.overall_passed)
        setVehicleRentalCost(s.vehicle_rental_cost != null ? String(s.vehicle_rental_cost) : '')
        setNotes(s.notes || '')
        setIsModalOpen(true)
    }

    const handleSubmit = () => {
        const totalCost = vehicleRentalCost ? parseFloat(vehicleRentalCost) : 0
        const isDriver = category === 'driving'

        const payload = {
            category,
            screening_date: screeningDate || undefined,
            interview_passed: interviewPassed,
            written_exam_required: writtenRequired,
            written_score: writtenScore ? parseInt(writtenScore) : undefined,
            written_passed: writtenRequired ? writtenPassed : undefined,
            practical_exam_required: practicalRequired,
            practical_score: practicalScore ? parseInt(practicalScore) : undefined,
            practical_passed: practicalRequired ? practicalPassed : undefined,
            overall_passed: overallPassed,
            vehicle_rental_cost: isDriver ? totalCost : undefined,
            vehicle_rental_paid_by_candidate: isDriver && totalCost ? totalCost / 2 : undefined,
            vehicle_rental_paid_by_company: isDriver && totalCost ? totalCost / 2 : undefined,
            notes: notes || undefined,
        }

        if (editing) {
            updateScreening.mutate(
                { screeningId: editing.id, data: payload },
                {
                    onSuccess: () => {
                        setIsModalOpen(false)
                        resetForm()
                    },
                }
            )
        } else {
            createScreening.mutate(payload, {
                onSuccess: () => {
                    setIsModalOpen(false)
                    resetForm()
                },
            })
        }
    }

    const handleDelete = () => {
        if (!deleteId) return
        deleteScreening.mutate(deleteId, {
            onSuccess: () => setDeleteId(null),
        })
    }

    const renderCategoryLabel = (value: string) =>
        CATEGORY_LABELS.find((c) => c.value === value)?.label || value

    const renderResultBadge = (passed: boolean | null | undefined) => {
        if (passed === null || passed === undefined) return <Badge variant="secondary">N/A</Badge>
        return passed ? (
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Passed</Badge>
        ) : (
            <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Failed</Badge>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Screening History
                </CardTitle>
                <Button size="sm" onClick={openCreate}>
                    <ClipboardList className="h-4 w-4 mr-1" />
                    Add Screening
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                    </div>
                ) : !screenings || screenings.length === 0 ? (
                    <p className="text-neutral-500 text-sm">
                        No screening records yet. Use &quot;Add Screening&quot; to record interview/exam
                        results for this application.
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Interview</TableHead>
                                <TableHead>Written</TableHead>
                                <TableHead>Practical</TableHead>
                                <TableHead>Overall</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {screenings.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell>
                                        <Badge variant="outline">{renderCategoryLabel(s.category)}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {s.screening_date
                                            ? new Date(s.screening_date).toLocaleDateString()
                                            : '—'}
                                    </TableCell>
                                    <TableCell>{renderResultBadge(s.interview_passed)}</TableCell>
                                    <TableCell>
                                        {s.written_exam_required ? (
                                            <div className="flex flex-col gap-1">
                                                {renderResultBadge(s.written_passed)}
                                                {s.written_score != null && (
                                                    <span className="text-xs text-neutral-500">
                                                        Score: {s.written_score}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <Badge variant="secondary">N/A</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {s.practical_exam_required ? (
                                            <div className="flex flex-col gap-1">
                                                {renderResultBadge(s.practical_passed)}
                                                {s.vehicle_rental_cost && (
                                                    <span className="text-xs text-neutral-500">
                                                        Vehicle: {s.vehicle_rental_cost} ETB
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <Badge variant="secondary">N/A</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{renderResultBadge(s.overall_passed)}</TableCell>
                                    <TableCell className="max-w-xs truncate" title={s.notes || undefined}>
                                        {s.notes || '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600"
                                                onClick={() => setDeleteId(s.id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <Dialog
                open={isModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsModalOpen(false)
                        resetForm()
                    } else {
                        setIsModalOpen(true)
                    }
                }}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Screening' : 'Add Screening'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category *</Label>
                                <Select
                                    value={category}
                                    onValueChange={(value) =>
                                        setCategory(value as ApplicationScreeningCategory)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORY_LABELS.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>
                                                {c.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Screening Date</Label>
                                <Input
                                    type="date"
                                    value={screeningDate}
                                    onChange={(e) => setScreeningDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Interview Passed?</Label>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={interviewPassed}
                                        onCheckedChange={(checked) => setInterviewPassed(!!checked)}
                                    />
                                    <span className="text-sm text-neutral-600">
                                        {interviewPassed ? 'Passed' : 'Not passed / N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Written Exam</Label>
                                <div className="flex items-center gap-2 mb-1">
                                    <Switch
                                        checked={writtenRequired}
                                        onCheckedChange={(checked) => setWrittenRequired(!!checked)}
                                    />
                                    <span className="text-sm text-neutral-600">
                                        {writtenRequired ? 'Required' : 'Not required'}
                                    </span>
                                </div>
                                {writtenRequired && (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            placeholder="Score"
                                            value={writtenScore}
                                            onChange={(e) => setWrittenScore(e.target.value)}
                                        />
                                        <Switch
                                            checked={writtenPassed}
                                            onCheckedChange={(checked) => setWrittenPassed(!!checked)}
                                        />
                                        <span className="text-xs text-neutral-600">
                                            {writtenPassed ? 'Passed' : 'Failed'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Practical Exam</Label>
                                <div className="flex items-center gap-2 mb-1">
                                    <Switch
                                        checked={practicalRequired}
                                        onCheckedChange={(checked) => setPracticalRequired(!!checked)}
                                    />
                                    <span className="text-sm text-neutral-600">
                                        {practicalRequired ? 'Required' : 'Not required'}
                                    </span>
                                </div>
                                {practicalRequired && (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            placeholder="Score"
                                            value={practicalScore}
                                            onChange={(e) => setPracticalScore(e.target.value)}
                                        />
                                        <Switch
                                            checked={practicalPassed}
                                            onCheckedChange={(checked) => setPracticalPassed(!!checked)}
                                        />
                                        <span className="text-xs text-neutral-600">
                                            {practicalPassed ? 'Passed' : 'Failed'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Overall Result</Label>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={overallPassed}
                                        onCheckedChange={(checked) => setOverallPassed(!!checked)}
                                    />
                                    <span className="text-sm text-neutral-600">
                                        {overallPassed ? 'Passed screening' : 'Failed / Pending'}
                                    </span>
                                </div>
                            </div>

                            {category === 'driving' && (
                                <div className="space-y-2">
                                    <Label>Practical Exam Vehicle Rental (ETB)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        placeholder="Total vehicle rental cost"
                                        value={vehicleRentalCost}
                                        onChange={(e) => setVehicleRentalCost(e.target.value)}
                                    />
                                    {vehicleRentalCost && (
                                        <p className="text-xs text-neutral-500">
                                            Candidate pays {parseFloat(vehicleRentalCost || '0') / 2} ETB,
                                            company pays {parseFloat(vehicleRentalCost || '0') / 2} ETB.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input
                                placeholder="Short notes about interview / exam result..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsModalOpen(false)
                                resetForm()
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={createScreening.isPending || updateScreening.isPending}
                        >
                            {(createScreening.isPending || updateScreening.isPending) && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            {editing ? 'Save Changes' : 'Create Screening'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                title="Delete Screening"
                description="Are you sure you want to delete this screening record? This action cannot be undone."
                onConfirm={handleDelete}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />
        </Card>
    )
}

