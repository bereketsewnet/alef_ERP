import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Plus, FileText, Edit, Trash2, Loader2 } from "lucide-react"
import { useVacancies, useCreateVacancy, useUpdateVacancy, useDeleteVacancy } from "@/services/useVacancies"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { Vacancy } from "@/api/endpoints/vacancies"

const vacancySchema = z.object({
    title_en: z.string().min(1, "English job title is required"),
    title_am: z.string().min(1, "Amharic job title is required"),
    description: z.string().optional(),
    qualification: z.string().optional(),
    // Keep as string in the form (like other numeric fields) and convert to number on submit
    number_of_employees: z.string().min(1, "Number of employees is required"),
})

type VacancyFormData = z.infer<typeof vacancySchema>

export function VacanciesPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null)
    const [deleteVacancyId, setDeleteVacancyId] = useState<number | null>(null)

    const { data: vacancies, isLoading } = useVacancies()
    const createVacancy = useCreateVacancy()
    const updateVacancy = useUpdateVacancy()
    const deleteVacancy = useDeleteVacancy()

    const form = useForm<VacancyFormData>({
        resolver: zodResolver(vacancySchema),
        defaultValues: {
            title_en: "",
            title_am: "",
            description: "",
            qualification: "",
            number_of_employees: "1",
        },
    })

    const handleSubmit = (data: VacancyFormData) => {
        const numEmployees = Number(data.number_of_employees) || 1

        const payload = {
            title_en: data.title_en,
            title_am: data.title_am,
            description: data.description || undefined,
            qualification: data.qualification || undefined,
            number_of_employees: numEmployees,
        }

        if (editingVacancy) {
            updateVacancy.mutate(
                { id: editingVacancy.id, data: payload },
                {
                    onSuccess: () => {
                        setIsCreateOpen(false)
                        setEditingVacancy(null)
                        form.reset()
                    },
                }
            )
        } else {
            createVacancy.mutate(
                payload,
                {
                    onSuccess: () => {
                        setIsCreateOpen(false)
                        form.reset()
                    },
                }
            )
        }
    }

    const handleEdit = (vacancy: Vacancy) => {
        setEditingVacancy(vacancy)
        form.reset({
            title_en: vacancy.title_en,
            title_am: vacancy.title_am,
            description: vacancy.description || "",
            qualification: vacancy.qualification || "",
            number_of_employees: String(vacancy.number_of_employees),
        })
        setIsCreateOpen(true)
    }

    const handleDelete = () => {
        if (deleteVacancyId) {
            deleteVacancy.mutate(deleteVacancyId, {
                onSuccess: () => setDeleteVacancyId(null),
            })
        }
    }

    const handleCloseDialog = () => {
        setIsCreateOpen(false)
        setEditingVacancy(null)
        form.reset()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Vacancy Management</h1>
                    <p className="text-neutral-600 mt-1">
                        Job titles (Amharic & English), description, candidate qualification, and number of employees
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={handleCloseDialog}>
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-primary-600 hover:bg-primary-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Vacancy
                    </Button>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingVacancy ? "Edit Vacancy" : "Create New Vacancy"}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title_en"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Job Title (English) *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Security Guard" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="title_am"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Job Title (Amharic) *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., የደህንነት ጠባቂ" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Job Description / Requirements</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Skills, experience, and other requirements (brief note)..."
                                                    className="min-h-[80px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            <p className="text-xs text-neutral-500">
                                                Brief note: skills and other job requirements
                                            </p>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="qualification"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Candidate Qualification</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Education, certifications, experience level..."
                                                    className="min-h-[80px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="number_of_employees"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Number of Employees *</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={1} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createVacancy.isPending || updateVacancy.isPending}>
                                        {(createVacancy.isPending || updateVacancy.isPending) && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {editingVacancy ? "Update Vacancy" : "Create Vacancy"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        All Vacancies
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
                                    <TableHead>Job Title (EN)</TableHead>
                                    <TableHead>Job Title (AM)</TableHead>
                                    <TableHead>Description / Requirements</TableHead>
                                    <TableHead>Qualification</TableHead>
                                    <TableHead># Employees</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vacancies?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-neutral-500 py-8">
                                            No vacancies found. Add your first vacancy to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    vacancies?.map((vacancy) => (
                                        <TableRow key={vacancy.id}>
                                            <TableCell className="font-medium">{vacancy.title_en}</TableCell>
                                            <TableCell className="font-medium">{vacancy.title_am}</TableCell>
                                            <TableCell className="text-neutral-600 max-w-[200px] truncate" title={vacancy.description || undefined}>
                                                {vacancy.description || "—"}
                                            </TableCell>
                                            <TableCell className="text-neutral-600 max-w-[200px] truncate" title={vacancy.qualification || undefined}>
                                                {vacancy.qualification || "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{vacancy.number_of_employees}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={vacancy.is_active ? "default" : "secondary"}>
                                                    {vacancy.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => handleEdit(vacancy)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600"
                                                        onClick={() => setDeleteVacancyId(vacancy.id)}
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
                open={!!deleteVacancyId}
                onOpenChange={() => setDeleteVacancyId(null)}
                title="Delete Vacancy"
                description="Are you sure you want to delete this vacancy? This action cannot be undone."
                onConfirm={handleDelete}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />
        </div>
    )
}
