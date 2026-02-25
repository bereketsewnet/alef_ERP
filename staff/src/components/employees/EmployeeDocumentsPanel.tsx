import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, FileText, Upload, Trash2, ExternalLink } from 'lucide-react'
import { useEmployeeDocuments, useUploadEmployeeDocument, useDeleteEmployeeDocument } from '@/services/useEmployeeDocuments'
import type { EmployeeDocumentType } from '@/api/endpoints/employeeDocuments'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface EmployeeDocumentsPanelProps {
    employeeId: number
}

const DOCUMENT_TYPE_LABELS: { value: EmployeeDocumentType; label: string }[] = [
    { value: 'MEDICAL_PAPER', label: 'Medical paper' },
    { value: 'POLICE_REPORT', label: 'Police report (አሻራ)' },
    { value: 'GUARANTOR_ID', label: 'Guarantor ID' },
    { value: 'EMPLOYEE_PHOTO', label: 'Employee photo' },
    { value: 'GUARANTOR_PHOTO', label: 'Guarantor photo' },
    { value: 'OTHER', label: 'Other' },
]

export function EmployeeDocumentsPanel({ employeeId }: EmployeeDocumentsPanelProps) {
    const { data: documents, isLoading } = useEmployeeDocuments(employeeId)
    const uploadDocument = useUploadEmployeeDocument(employeeId)
    const deleteDocument = useDeleteEmployeeDocument(employeeId)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [docType, setDocType] = useState<EmployeeDocumentType>('MEDICAL_PAPER')
    const [name, setName] = useState<string>('')
    const [validUntil, setValidUntil] = useState<string>('')
    const [file, setFile] = useState<File | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    const resetForm = () => {
        setDocType('MEDICAL_PAPER')
        setName('')
        setValidUntil('')
        setFile(null)
    }

    const handleSubmit = () => {
        if (!file || !name) return

        uploadDocument.mutate(
            {
                type: docType,
                name,
                valid_until: validUntil || undefined,
                file,
            },
            {
                onSuccess: () => {
                    setIsModalOpen(false)
                    resetForm()
                },
            }
        )
    }

    const handleDelete = () => {
        if (!deleteId) return
        deleteDocument.mutate(deleteId, {
            onSuccess: () => setDeleteId(null),
        })
    }

    const renderTypeLabel = (value: string) =>
        DOCUMENT_TYPE_LABELS.find((t) => t.value === value)?.label || value

    const renderValidity = (validUntil: string | null) => {
        if (!validUntil) return <span className="text-xs text-neutral-500">No expiry</span>
        const date = new Date(validUntil)
        return (
            <span className="text-xs text-neutral-600">
                Valid until {date.toLocaleDateString()}
            </span>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Employee Documents
                </CardTitle>
                <Button size="sm" onClick={() => setIsModalOpen(true)}>
                    <Upload className="h-4 w-4 mr-1" />
                    Add Document
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                    </div>
                ) : !documents || documents.length === 0 ? (
                    <p className="text-neutral-500 text-sm">
                        No documents uploaded yet. Use &quot;Add Document&quot; to upload medical paper,
                        police report, guarantor details, and photos.
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Validity</TableHead>
                                <TableHead>Uploaded</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell>
                                        <Badge variant="outline">{renderTypeLabel(doc.type)}</Badge>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate" title={doc.name}>
                                        {doc.name}
                                    </TableCell>
                                    <TableCell>{renderValidity(doc.valid_until)}</TableCell>
                                    <TableCell>
                                        <span className="text-xs text-neutral-600">
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {doc.url && (
                                                <a
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center text-xs text-primary-600 hover:underline"
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-1" />
                                                    View
                                                </a>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600"
                                                onClick={() => setDeleteId(doc.id)}
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
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Document</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Document Type *</Label>
                            <Select
                                value={docType}
                                onValueChange={(value) =>
                                    setDocType(value as EmployeeDocumentType)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DOCUMENT_TYPE_LABELS.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Document Name / Description *</Label>
                            <Input
                                placeholder="e.g., Medical paper Jan 2026"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Valid Until</Label>
                            <Input
                                type="date"
                                value={validUntil}
                                onChange={(e) => setValidUntil(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>File *</Label>
                            <Input
                                type="file"
                                onChange={(e) => {
                                    const f = e.target.files?.[0] || null
                                    setFile(f)
                                }}
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
                            disabled={uploadDocument.isPending || !file || !name}
                        >
                            {uploadDocument.isPending && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                title="Delete Document"
                description="Are you sure you want to delete this document? This action cannot be undone."
                onConfirm={handleDelete}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />
        </Card>
    )
}

