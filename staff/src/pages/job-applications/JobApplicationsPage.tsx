import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Plus, FileText, Edit, Trash2, Loader2, ClipboardCheck, UserPlus } from "lucide-react"
import { useJobApplications, useCreateJobApplication, useUpdateJobApplication, useDeleteJobApplication } from "@/services/useJobApplications"
import { useJobs } from "@/services/useJobs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { JobApplication } from "@/api/endpoints/jobApplications"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { JobApplicationScreeningPanel } from "@/components/job-applications/JobApplicationScreeningPanel"
import { useVacancies } from "@/services/useVacancies"
import { employeesApi } from "@/api/endpoints/employees"
import { getJobApplicationScreenings } from "@/api/endpoints/jobApplicationScreenings"
import { employeeScreeningsApi } from "@/api/endpoints/employeeScreenings"

const applicationSchema = z.object({
    applicant_id: z.string().min(1, "ID is required"),
    age: z.string().min(1, "Age is required"),
    sex: z.enum(['MALE', 'FEMALE'], { message: 'Sex is required' }),
    education: z.string().min(1, "Education is required"),
    experience: z.string().min(1, "Experience is required"),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

export function JobApplicationsPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null)
    const [deleteApplicationId, setDeleteApplicationId] = useState<number | null>(null)
    const [selectedJobIds, setSelectedJobIds] = useState<number[]>([])
    const [screeningApplication, setScreeningApplication] = useState<JobApplication | null>(null)
    const [hireApplication, setHireApplication] = useState<JobApplication | null>(null)
    const [hireFirstName, setHireFirstName] = useState<string>("")
    const [hireLastName, setHireLastName] = useState<string>("")
    const [hirePhone, setHirePhone] = useState<string>("")
    const [hireEmail, setHireEmail] = useState<string>("")
    const [hireDate, setHireDate] = useState<string>("")
    const [isHiring, setIsHiring] = useState(false)
    const [vacancyId, setVacancyId] = useState<string>("none")

    const { data: applications, isLoading } = useJobApplications()
    const { data: jobs } = useJobs({ active_only: true })
    const { data: vacancies } = useVacancies(true)
    const createApplication = useCreateJobApplication()
    const updateApplication = useUpdateJobApplication()
    const deleteApplication = useDeleteJobApplication()

    const form = useForm<ApplicationFormData>({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            applicant_id: "",
            age: "",
            sex: undefined,
            education: "",
            experience: "",
        },
    })

    const handleSubmit = (data: ApplicationFormData) => {
        if (!selectedJobIds.length) {
            toast({
                title: "Please select at least one job",
                description: "Select one or more jobs the applicant is applying for.",
                variant: "destructive",
            })
            return
        }

        const payload = {
            applicant_id: data.applicant_id,
            age: Number(data.age),
            sex: data.sex,
            education: data.education,
            experience: data.experience,
            job_ids: selectedJobIds,
            vacancy_id: vacancyId && vacancyId !== "none" ? Number(vacancyId) : undefined,
        }

        if (editingApplication) {
            updateApplication.mutate(
                { id: editingApplication.id, data: payload },
                {
                    onSuccess: () => {
                        setIsCreateOpen(false)
                        setEditingApplication(null)
                        setSelectedJobIds([])
                        form.reset()
                    },
                }
            )
        } else {
            createApplication.mutate(payload, {
                onSuccess: () => {
                    setIsCreateOpen(false)
                    setSelectedJobIds([])
                    form.reset()
                },
            })
        }
    }

    const handleEdit = (application: JobApplication) => {
        setEditingApplication(application)
        form.reset({
            applicant_id: application.applicant_id,
            age: application.age !== null ? String(application.age) : "",
            sex: application.sex || undefined,
            education: application.education || "",
            experience: application.experience || "",
        })
        setSelectedJobIds(application.jobs?.map((j) => j.id) || [])
        setIsCreateOpen(true)
        setVacancyId(application.vacancy_id ? String(application.vacancy_id) : "none")
    }

    const openHireDialog = (application: JobApplication) => {
        setHireApplication(application)
        // Split full name into first and last name
        const parts = (application.applicant_id || "").trim().split(" ")
        if (parts.length > 1) {
            setHireFirstName(parts[0])
            setHireLastName(parts.slice(1).join(" "))
        } else {
            setHireFirstName(application.applicant_id)
            setHireLastName("")
        }
        setHirePhone("")
        setHireEmail("")
        const today = new Date()
        const iso = today.toISOString().split("T")[0]
        setHireDate(iso)
    }

    const resetHireState = () => {
        setHireApplication(null)
        setHireFirstName("")
        setHireLastName("")
        setHirePhone("")
        setHireEmail("")
        setHireDate("")
        setIsHiring(false)
    }

    const handleHireFromApplication = async () => {
        if (!hireApplication) return
        if (!hireFirstName || !hireLastName || !hirePhone || !hireDate) {
            toast({
                title: "Missing required fields",
                description: "First name, last name, phone, and hire date are required to create an employee.",
                variant: "destructive",
            })
            return
        }

        try {
            setIsHiring(true)
            // 1) Create employee from application
            const response = await employeesApi.create({
                first_name: hireFirstName,
                last_name: hireLastName,
                email: hireEmail || "",
                phone_number: hirePhone,
                status: "active",
                hire_date: hireDate,
            })

            const employee = response.data

            // 2) Copy screening records from job application into employee screenings
            const screenings = await getJobApplicationScreenings(hireApplication.id)

            for (const s of screenings) {
                await employeeScreeningsApi.create(employee.id, {
                    category: s.category,
                    screening_date: s.screening_date || undefined,
                    interview_passed: s.interview_passed,
                    written_exam_required: s.written_exam_required,
                    written_score: s.written_score ?? undefined,
                    written_passed: s.written_passed ?? undefined,
                    practical_exam_required: s.practical_exam_required,
                    practical_score: s.practical_score ?? undefined,
                    practical_passed: s.practical_passed ?? undefined,
                    overall_passed: s.overall_passed ?? undefined,
                    vehicle_rental_cost: s.vehicle_rental_cost ? Number(s.vehicle_rental_cost) : undefined,
                    vehicle_rental_paid_by_candidate: s.vehicle_rental_paid_by_candidate
                        ? Number(s.vehicle_rental_paid_by_candidate)
                        : undefined,
                    vehicle_rental_paid_by_company: s.vehicle_rental_paid_by_company
                        ? Number(s.vehicle_rental_paid_by_company)
                        : undefined,
                    notes: s.notes || undefined,
                })
            }

            toast({
                title: "Employee created from application",
                description: "Screening history has been copied to the employee record.",
            })
            resetHireState()
        } catch (error: any) {
            toast({
                title: "Failed to create employee",
                description: error?.message || "Please check the data and try again.",
                variant: "destructive",
            })
            setIsHiring(false)
        }
    }

    const handleDelete = () => {
        if (deleteApplicationId) {
            deleteApplication.mutate(deleteApplicationId, {
                onSuccess: () => setDeleteApplicationId(null),
            })
        }
    }

    const handleCloseDialog = () => {
        setIsCreateOpen(false)
        setEditingApplication(null)
        setSelectedJobIds([])
        form.reset()
        setVacancyId("none")
    }

    const toggleJobSelection = (jobId: number) => {
        setSelectedJobIds((prev) =>
            prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Job Application Management</h1>
                    <p className="text-neutral-600 mt-1">
                        Capture job applications filled by candidates or agents, including ID, age, education,
                        experience, and the jobs applied for.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={handleCloseDialog}>
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-primary-600 hover:bg-primary-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Application
                    </Button>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingApplication ? "Edit Application" : "Create New Application"}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="applicant_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name of applicant *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., John Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="age"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Age *</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min={15} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sex"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sex *</FormLabel>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="MALE">Male</SelectItem>
                                                        <SelectItem value="FEMALE">Female</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="education"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Education *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Diploma in Security Management" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="experience"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Experience *</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Work experience, years, and key responsibilities..."
                                                    className="min-h-[80px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-2">
                                    <FormLabel>Applying for which job(s) *</FormLabel>
                                    <p className="text-xs text-neutral-500">
                                        Select one or more jobs this application is for.
                                    </p>
                                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                                        {jobs && jobs.length > 0 ? (
                                            jobs.map((job) => (
                                                <label
                                                    key={job.id}
                                                    className="flex items-center gap-2 cursor-pointer text-sm"
                                                >
                                                    <Checkbox
                                                        checked={selectedJobIds.includes(job.id)}
                                                        onCheckedChange={() => toggleJobSelection(job.id)}
                                                    />
                                                    <span className="font-medium">
                                                        {job.job_name}{" "}
                                                        <span className="text-xs text-neutral-500">
                                                            ({job.job_code})
                                                        </span>
                                                    </span>
                                                </label>
                                            ))
                                        ) : (
                                            <p className="text-xs text-neutral-500">
                                                No jobs available. Create jobs first to link applications.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Related vacancy (optional)</Label>
                                    <p className="text-xs text-neutral-500">
                                        Link this application to a specific vacancy, if it came from a job posting.
                                    </p>
                                    <Select
                                        value={vacancyId}
                                        onValueChange={(value) => setVacancyId(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select vacancy (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                No specific vacancy
                                            </SelectItem>
                                            {vacancies?.map((vacancy) => (
                                                <SelectItem key={vacancy.id} value={String(vacancy.id)}>
                                                    {vacancy.title_en}{" "}
                                                    <span className="text-xs text-neutral-500">
                                                        ({vacancy.title_am})
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <DialogFooter className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createApplication.isPending || updateApplication.isPending}
                                    >
                                        {(createApplication.isPending || updateApplication.isPending) && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {editingApplication ? "Update Application" : "Create Application"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        All Job Applications
                    </CardTitle>
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
                                    <TableHead>Name</TableHead>
                                    <TableHead>Age</TableHead>
                                    <TableHead>Sex</TableHead>
                                    <TableHead>Education</TableHead>
                                    <TableHead>Experience</TableHead>
                                    <TableHead>Vacancy</TableHead>
                                    <TableHead>Applying For</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-neutral-500 py-8">
                                            No applications found. Add your first application to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    applications?.map((application) => (
                                        <TableRow key={application.id}>
                                            <TableCell className="font-mono text-xs">
                                                {application.applicant_id}
                                            </TableCell>
                                            <TableCell>{application.age ?? "—"}</TableCell>
                                            <TableCell>{application.sex === 'MALE' ? 'Male' : application.sex === 'FEMALE' ? 'Female' : '—'}</TableCell>
                                            <TableCell className="max-w-[180px] truncate" title={application.education || undefined}>
                                                {application.education || "—"}
                                            </TableCell>
                                            <TableCell className="max-w-[220px] truncate" title={application.experience || undefined}>
                                                {application.experience || "—"}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={application.vacancy?.title_en || undefined}>
                                                {application.vacancy
                                                    ? application.vacancy.title_en
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="max-w-[240px]">
                                                {application.jobs && application.jobs.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {application.jobs.map((job) => (
                                                            <Badge key={job.id} variant="secondary">
                                                                {job.job_name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-neutral-400">No jobs linked</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        title="Create employee from this application"
                                                        onClick={() => openHireDialog(application)}
                                                    >
                                                        <UserPlus className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        title="Open screening for this application"
                                                        onClick={() => setScreeningApplication(application)}
                                                    >
                                                        <ClipboardCheck className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEdit(application)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600"
                                                        onClick={() => setDeleteApplicationId(application.id)}
                                                    >
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
                open={!!deleteApplicationId}
                onOpenChange={() => setDeleteApplicationId(null)}
                title="Delete Application"
                description="Are you sure you want to delete this application? This action cannot be undone."
                onConfirm={handleDelete}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />

            {/* Screening dialog for pre-employment process */}
            <Dialog
                open={!!screeningApplication}
                onOpenChange={(open) => {
                    if (!open) {
                        setScreeningApplication(null)
                    }
                }}
            >
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex flex-col gap-1">
                            <span>Screening for {screeningApplication?.applicant_id}</span>
                            {screeningApplication && (
                                <span className="text-sm text-neutral-500">
                                    Applying for:{' '}
                                    {screeningApplication.jobs && screeningApplication.jobs.length > 0
                                        ? screeningApplication.jobs.map((job) => job.job_name).join(', ')
                                        : 'No jobs linked'}
                                </span>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    {screeningApplication && (
                        <JobApplicationScreeningPanel jobApplicationId={screeningApplication.id} />
                    )}
                </DialogContent>
            </Dialog>

            {/* Hire (convert to employee) dialog */}
            <Dialog
                open={!!hireApplication}
                onOpenChange={(open) => {
                    if (!open) {
                        resetHireState()
                    }
                }}
            >
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            Create Employee from Application
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-neutral-600">
                            Fill in the required employee details. Screening history for this application will
                            be copied to the employee&apos;s screening tab.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name *</Label>
                                <Input
                                    value={hireFirstName}
                                    onChange={(e) => setHireFirstName(e.target.value)}
                                    placeholder="First name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name *</Label>
                                <Input
                                    value={hireLastName}
                                    onChange={(e) => setHireLastName(e.target.value)}
                                    placeholder="Last name"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Phone Number *</Label>
                                <Input
                                    value={hirePhone}
                                    onChange={(e) => setHirePhone(e.target.value)}
                                    placeholder="+2519..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={hireEmail}
                                    onChange={(e) => setHireEmail(e.target.value)}
                                    placeholder="optional@email.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Hire Date *</Label>
                            <Input
                                type="date"
                                value={hireDate}
                                onChange={(e) => setHireDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => resetHireState()}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleHireFromApplication}
                            disabled={isHiring}
                        >
                            {isHiring && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Employee
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
