import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Settings2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    useJobs,
    useSiteJobs,
    useAddJobToSite,
    useUpdateSiteJob,
    useRemoveJobFromSite,
} from '@/services/useJobs'
import type { Job, SiteJob } from '@/api/endpoints/jobs'

interface SiteJobsPanelProps {
    siteId: number
    siteName: string
}

export function SiteJobsPanel({ siteId, siteName }: SiteJobsPanelProps) {
    const [addJobModalOpen, setAddJobModalOpen] = useState(false)
    const [editJobId, setEditJobId] = useState<number | null>(null)
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
    const [positionsNeeded, setPositionsNeeded] = useState<number>(1)

    const { data: siteJobs, isLoading } = useSiteJobs(siteId)
    const { data: allJobsResponse } = useJobs()
    const addSiteJobMutation = useAddJobToSite()
    const updateSiteJobMutation = useUpdateSiteJob()
    const removeSiteJobMutation = useRemoveJobFromSite()

    const allJobs: Job[] = allJobsResponse || []
    const currentJobIds = siteJobs?.map((j: SiteJob) => j.id) || []
    const availableJobs = allJobs.filter((j: Job) => !currentJobIds.includes(j.id))

    const handleAddJob = () => {
        if (!selectedJobId) {
            toast.error('Please select a job')
            return
        }

        addSiteJobMutation.mutate(
            { siteId, data: { job_id: selectedJobId, positions_needed: positionsNeeded } },
            {
                onSuccess: () => {
                    toast.success('Job requirement added successfully')
                    setAddJobModalOpen(false)
                    setSelectedJobId(null)
                    setPositionsNeeded(1)
                },
                onError: (error: any) => {
                    toast.error(error.response?.data?.message || 'Failed to add job requirement')
                },
            }
        )
    }

    const handleEditPositions = (jobId: number, currentPositions: number) => {
        setEditJobId(jobId)
        setPositionsNeeded(currentPositions)
    }

    const handleUpdatePositions = () => {
        if (!editJobId) return

        updateSiteJobMutation.mutate(
            { siteId, jobId: editJobId, data: { positions_needed: positionsNeeded } },
            {
                onSuccess: () => {
                    toast.success('Positions updated successfully')
                    setEditJobId(null)
                    setPositionsNeeded(1)
                },
                onError: (error: any) => {
                    toast.error(error.response?.data?.message || 'Failed to update positions')
                },
            }
        )
    }

    const handleRemoveJob = (jobId: number, jobName: string) => {
        if (!window.confirm(`Remove "${jobName}" requirement from this site?`)) {
            return
        }

        removeSiteJobMutation.mutate(
            { siteId, jobId },
            {
                onSuccess: () => {
                    toast.success('Job requirement removed')
                },
                onError: (error: any) => {
                    toast.error(error.response?.data?.message || 'Failed to remove job')
                },
            }
        )
    }

    const totalPositions = siteJobs?.reduce((sum: number, job: SiteJob) => sum + (job.pivot?.positions_needed || 0), 0) || 0

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <span className="text-neutral-500">Loading job requirements...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-600">
                            Required Jobs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{siteJobs?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-600">
                            Total Positions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPositions}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Job Requirements List */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Job Requirements</CardTitle>
                    <Button
                        size="sm"
                        onClick={() => setAddJobModalOpen(true)}
                        disabled={availableJobs.length === 0}
                        className="bg-primary-600 hover:bg-primary-700"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Job
                    </Button>
                </CardHeader>
                <CardContent>
                    {siteJobs?.length === 0 ? (
                        <div className="text-center py-8 text-neutral-500">
                            No job requirements defined for this site.
                            <br />
                            <span className="text-sm">Add jobs to define staffing needs.</span>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Job</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Positions</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {siteJobs?.map((job) => (
                                    <TableRow key={job.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{job.job_code}</Badge>
                                                {job.job_name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{job.category?.name || '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4 text-neutral-500" />
                                                {job.pivot?.positions_needed || 1}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditPositions(job.id, job.pivot?.positions_needed || 1)}
                                                    title="Edit Positions"
                                                >
                                                    <Settings2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveJob(job.id, job.job_name)}
                                                    title="Remove Job"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Add Job Modal */}
            <Dialog open={addJobModalOpen} onOpenChange={setAddJobModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Job Requirement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Job</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={selectedJobId || ''}
                                onChange={(e) => setSelectedJobId(e.target.value ? Number(e.target.value) : null)}
                            >
                                <option value="">Select a job...</option>
                                {availableJobs.map((job) => (
                                    <option key={job.id} value={job.id}>
                                        {job.job_code} - {job.job_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Positions Needed</Label>
                            <Input
                                type="number"
                                min={1}
                                value={positionsNeeded}
                                onChange={(e) => setPositionsNeeded(parseInt(e.target.value) || 1)}
                            />
                            <p className="text-xs text-neutral-500">
                                Number of employees needed for this job at {siteName}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddJobModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddJob}
                            disabled={addSiteJobMutation.isPending}
                            className="bg-primary-600 hover:bg-primary-700"
                        >
                            {addSiteJobMutation.isPending ? 'Adding...' : 'Add Job'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Positions Modal */}
            <Dialog open={!!editJobId} onOpenChange={(open) => !open && setEditJobId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Positions Needed</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Positions Needed</Label>
                            <Input
                                type="number"
                                min={1}
                                value={positionsNeeded}
                                onChange={(e) => setPositionsNeeded(parseInt(e.target.value) || 1)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditJobId(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdatePositions}
                            disabled={updateSiteJobMutation.isPending}
                            className="bg-primary-600 hover:bg-primary-700"
                        >
                            {updateSiteJobMutation.isPending ? 'Updating...' : 'Update'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
