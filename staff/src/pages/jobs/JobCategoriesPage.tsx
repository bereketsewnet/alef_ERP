import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Plus, FolderOpen, Edit, Trash2, Loader2 } from "lucide-react"
import { useJobCategories, useCreateJobCategory, useUpdateJobCategory, useDeleteJobCategory } from "@/services/useJobs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Link } from "react-router-dom"

const categorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    code: z.string().min(2, "Code must be at least 2 characters").max(10, "Code must be 10 characters or less").regex(/^[A-Z]+$/, "Code must be uppercase letters only"),
    description: z.string().optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

export function JobCategoriesPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<any>(null)
    const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null)

    const { data: categories, isLoading } = useJobCategories()
    const createCategory = useCreateJobCategory()
    const updateCategory = useUpdateJobCategory()
    const deleteCategory = useDeleteJobCategory()

    const form = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: "",
            code: "",
            description: "",
        },
    })

    const handleSubmit = (data: CategoryFormData) => {
        if (editingCategory) {
            updateCategory.mutate({ id: editingCategory.id, data }, {
                onSuccess: () => {
                    setIsCreateOpen(false)
                    setEditingCategory(null)
                    form.reset()
                }
            })
        } else {
            createCategory.mutate(data, {
                onSuccess: () => {
                    setIsCreateOpen(false)
                    form.reset()
                }
            })
        }
    }

    const handleEdit = (category: any) => {
        setEditingCategory(category)
        form.reset({
            name: category.name,
            code: category.code,
            description: category.description || "",
        })
        setIsCreateOpen(true)
    }

    const handleDelete = () => {
        if (deleteCategoryId) {
            deleteCategory.mutate(deleteCategoryId, {
                onSuccess: () => setDeleteCategoryId(null)
            })
        }
    }

    const handleCloseDialog = () => {
        setIsCreateOpen(false)
        setEditingCategory(null)
        form.reset()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Job Categories</h1>
                    <p className="text-neutral-600 mt-1">Organize jobs into categories (e.g., Security, Hospitality)</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/jobs">
                        <Button variant="outline">
                            View All Jobs
                        </Button>
                    </Link>
                    <Dialog open={isCreateOpen} onOpenChange={handleCloseDialog}>
                        <Button onClick={() => setIsCreateOpen(true)} className="bg-primary-600 hover:bg-primary-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Category
                        </Button>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Security" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="code" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category Code *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., SEC"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                    maxLength={10}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            <p className="text-xs text-neutral-500">
                                                This code is used to generate job codes (e.g., SEC-001)
                                            </p>
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Optional description..." {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )} />

                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                                            {(createCategory.isPending || updateCategory.isPending) && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            {editingCategory ? 'Update Category' : 'Create Category'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5" />
                        All Categories
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
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Jobs Count</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-neutral-500 py-8">
                                            No categories found. Create your first category to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    categories?.map(category => (
                                        <TableRow key={category.id}>
                                            <TableCell className="font-mono font-semibold">{category.code}</TableCell>
                                            <TableCell className="font-medium">{category.name}</TableCell>
                                            <TableCell className="text-neutral-600">{category.description || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{category.jobs_count || 0} jobs</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                                    {category.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => handleEdit(category)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600"
                                                        onClick={() => setDeleteCategoryId(category.id)}
                                                        disabled={!!category.jobs_count && category.jobs_count > 0}
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
                open={!!deleteCategoryId}
                onOpenChange={() => setDeleteCategoryId(null)}
                title="Delete Category"
                description="Are you sure you want to delete this category? This action cannot be undone."
                onConfirm={handleDelete}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />
        </div>
    )
}
