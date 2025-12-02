import { useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useUsers, useDeleteUser } from '@/services/useUsers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { UserFormModal } from '@/components/settings/UserFormModal'
import type { User } from '@/types/common.types'

export function UserManagementPage() {
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [userToEdit, setUserToEdit] = useState<User | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const { data, isLoading } = useUsers({ page, search: search || undefined })
    const { mutate: deleteUser } = useDeleteUser()

    const handleDelete = (user: User) => {
        if (window.confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
            deleteUser(user.id)
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-neutral-600">
                        Manage system users and their permissions
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : data?.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.phone_number || '-'}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                            {user.role}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {user.last_login
                                            ? new Date(user.last_login).toLocaleDateString()
                                            : 'Never'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setUserToEdit(user)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(user)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data && data.meta.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-600">
                        Showing {data.data.length} of {data.meta.total} users
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={page === data.meta.last_page}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            <UserFormModal
                open={isCreateModalOpen || !!userToEdit}
                onClose={() => {
                    setIsCreateModalOpen(false)
                    setUserToEdit(null)
                }}
                user={userToEdit}
            />
        </div>
    )
}
