import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Briefcase, Search, Edit, Trash2, Loader2, Users, Building, Medal } from "lucide-react"
import { useJobs, useJobCategories, useCreateJob, useUpdateJob, useDeleteJob } from "@/services/useJobs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { formatCurrency } from "@/lib/utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { JobSkillsModal } from "@/components/jobs/JobSkillsModal"
import { toast } from "@/components/ui/use-toast"

const jobSchema = z.object({
    category_id: z.string().min(1, "Category is required"),
    job_name: z.string().min(1, "Job name is required"),
    description: z.string().optional(),
    pay_type: z.enum(["HOURLY", "MONTHLY"]),
    base_salary: z.string().min(1, "Base salary is required"),
    hourly_rate: z.string().min(1, "Hourly rate is required"),
    overtime_multiplier: z.string().optional(),
    tax_percent: z.string().optional(),
    late_penalty: z.string().optional(),
    absent_penalty: z.string().optional(),
    agency_fee_percent: z.string().optional(),
})

type JobFormData = z.infer<typeof jobSchema>

export function JobsPage() {
    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingJob, setEditingJob] = useState<any>(null)
    const [deleteJobId, setDeleteJobId] = useState<number | null>(null)

    // Skills Modal State
    const [skillsJob, setSkillsJob] = useState<{ id: number, name: string } | null>(null)

    const { data: jobs, isLoading } = useJobs({
        category_id: (selectedCategory && selectedCategory !== "_all") ? Number(selectedCategory) : undefined,
        search: search || undefined,
    })
    const { data: categories } = useJobCategories()
    const createJob = useCreateJob()
    const updateJob = useUpdateJob()
    const deleteJob = useDeleteJob()

    const form = useForm<JobFormData>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            category_id: "",
            job_name: "",
            description: "",
            pay_type: "MONTHLY",
            base_salary: "0",
            hourly_rate: "0",
            overtime_multiplier: "1.5",
            tax_percent: "0",
            late_penalty: "100",
            absent_penalty: "500",
            agency_fee_percent: "0",
        },
    })

    const handleSubmit = (data: JobFormData) => {
        const payload = {
            category_id: Number(data.category_id),
            job_name: data.job_name,
            description: data.description || undefined,
            pay_type: data.pay_type as "HOURLY" | "MONTHLY",
            base_salary: Number(data.base_salary),
            hourly_rate: Number(data.hourly_rate),
            overtime_multiplier: Number(data.overtime_multiplier) || 1.5,
            tax_percent: Number(data.tax_percent) || 0,
            late_penalty: Number(data.late_penalty) || 100,
            absent_penalty: Number(data.absent_penalty) || 500,
            agency_fee_percent: Number(data.agency_fee_percent) || 0,
        }

        if (editingJob) {
            updateJob.mutate({ id: editingJob.id, data: payload }, {
                onSuccess: () => {
                    setIsCreateOpen(false)
                    setEditingJob(null)
                    form.reset()
                }
            })
        } else {
            createJob.mutate(payload, {
                onSuccess: () => {
                    setIsCreateOpen(false)
                    form.reset()
                }
            })
        }
    }

    const handleEdit = (job: any) => {
        setEditingJob(job)
        form.reset({
            category_id: String(job.category_id),
            job_name: job.job_name,
            description: job.description || "",
            pay_type: job.pay_type,
            base_salary: String(job.base_salary),
            hourly_rate: String(job.hourly_rate),
            overtime_multiplier: String(job.overtime_multiplier),
            tax_percent: String(job.tax_percent),
            late_penalty: String(job.late_penalty),
            absent_penalty: String(job.absent_penalty),
            agency_fee_percent: String(job.agency_fee_percent),
        })
        setIsCreateOpen(true)
    }

    const handleDelete = () => {
        if (deleteJobId) {
            deleteJob.mutate(deleteJobId, {
                onSuccess: () => setDeleteJobId(null)
            })
        }
    }

    const handleCloseDialog = () => {
        setIsCreateOpen(false)
        setEditingJob(null)
        form.reset()
    }

    const stats = {
        total: jobs?.length || 0,
        active: jobs?.filter(j => j.is_active).length || 0,
        hourly: jobs?.filter(j => j.pay_type === 'HOURLY').length || 0,
        monthly: jobs?.filter(j => j.pay_type === 'MONTHLY').length || 0,
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Jobs</h1>
                    <p className="text-neutral-600 mt-1">Manage job types, rates, and requirements</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/jobs/categories">
                        <Button variant="outline">
                            <Briefcase className="mr-2 h-4 w-4" />
                            Manage Categories
                        </Button>
                    </Link>
                    <Dialog open={isCreateOpen} onOpenChange={handleCloseDialog}>
                        <Button onClick={() => setIsCreateOpen(true)} className="bg-primary-600 hover:bg-primary-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Job
                        </Button>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingJob ? 'Edit Job' : 'Create New Job'}</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="category_id" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category *</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {categories?.map(cat => (
                                                            <SelectItem key={cat.id} value={String(cat.id)}>
                                                                {cat.name} ({cat.code})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="job_name" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Job Name *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Security Guard" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Job description..." {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )} />

                                    <div className="grid grid-cols-3 gap-4">
                                        <FormField control={form.control} name="pay_type" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Pay Type *</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                                        <SelectItem value="HOURLY">Hourly</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="base_salary" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Base Salary (ETB) *</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="hourly_rate" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Hourly Rate (ETB) *</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <div className="grid grid-cols-4 gap-4">
                                        <FormField control={form.control} name="tax_percent" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tax %</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="late_penalty" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Late Penalty</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="absent_penalty" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Absent Penalty</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="agency_fee_percent" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Agency Fee %</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    </div>

                                    <FormField control={form.control} name="overtime_multiplier" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Overtime Multiplier</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" placeholder="1.5" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )} />

                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={createJob.isPending || updateJob.isPending}>
                                            {(createJob.isPending || updateJob.isPending) && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            {editingJob ? 'Update Job' : 'Create Job'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Briefcase className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Total Jobs</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Briefcase className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Active Jobs</p>
                                <p className="text-2xl font-bold">{stats.active}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Monthly Jobs</p>
                                <p className="text-2xl font-bold">{stats.monthly}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Building className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Hourly Jobs</p>
                                <p className="text-2xl font-bold">{stats.hourly}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Search jobs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_all">All Categories</SelectItem>
                                {categories?.map(cat => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Jobs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Job Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Pay Type</TableHead>
                                    <TableHead>Base Salary</TableHead>
                                    <TableHead>Hourly Rate</TableHead>
                                    <TableHead>Tax %</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-neutral-500 py-8">
                                            No jobs found. Create your first job to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    jobs?.map(job => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-mono text-sm">{job.job_code}</TableCell>
                                            <TableCell className="font-medium">{job.job_name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{job.category?.name}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={job.pay_type === 'MONTHLY' ? 'default' : 'secondary'}>
                                                    {job.pay_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatCurrency(job.base_salary)}</TableCell>
                                            <TableCell>{formatCurrency(job.hourly_rate)}/hr</TableCell>
                                            <TableCell>{job.tax_percent}%</TableCell>
                                            <TableCell>
                                                <Badge variant={job.is_active ? 'default' : 'secondary'}>
                                                    {job.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setSkillsJob({ id: job.id, name: job.job_name })}
                                                        title="Manage Skills"
                                                    >
                                                        <Medal className="h-4 w-4 text-amber-600" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleEdit(job)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleteJobId(job.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!deleteJobId}
                onOpenChange={() => setDeleteJobId(null)}
                title="Delete Job"
                description="Are you sure you want to delete this job? This action cannot be undone."
                onConfirm={handleDelete}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />

            {/* Job Skills Modal */}
            <JobSkillsModal
                jobId={skillsJob?.id || null}
                jobName={skillsJob?.name || ""}
                open={!!skillsJob}
                onClose={() => setSkillsJob(null)}
            />
        </div >
    )
}
