import { FileText, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface NamedFileItem {
    id: string
    name: string
    file: File | null
}

interface NamedFileUploaderProps {
    value: NamedFileItem[]
    onChange: (items: NamedFileItem[]) => void
    disabled?: boolean
    error?: string
    title?: string
    description?: string
    addButtonLabel?: string
    namePlaceholder?: string
    accept?: string
    maxSizeMb?: number
}

export const NAMED_FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt'

export function createNamedFileItem(): NamedFileItem {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: '',
        file: null,
    }
}

export function NamedFileUploader({
    value,
    onChange,
    disabled = false,
    error,
    title = 'Attachments',
    description = 'Add a name and choose a file for each attachment.',
    addButtonLabel = 'Add file',
    namePlaceholder = 'e.g., Kebele ID, Fayda ID, Certificate',
    accept = NAMED_FILE_ACCEPT,
    maxSizeMb = 10,
}: NamedFileUploaderProps) {
    const updateItem = (id: string, patch: Partial<NamedFileItem>) => {
        onChange(value.map((item) => item.id === id ? { ...item, ...patch } : item))
    }

    const removeItem = (id: string) => {
        onChange(value.filter((item) => item.id !== id))
    }

    return (
        <section className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/60 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Label className="flex items-center gap-2 text-base font-medium">
                        <FileText className="h-4 w-4" />
                        {title}
                    </Label>
                    <p className="mt-1 text-xs text-neutral-500">
                        {description} PDF, image, Word, or text; maximum {maxSizeMb} MB each.
                    </p>
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={disabled}
                    onClick={() => onChange([...value, createNamedFileItem()])}
                >
                    <Plus className="mr-1 h-4 w-4" />
                    {addButtonLabel}
                </Button>
            </div>

            {value.length === 0 ? (
                <div className="rounded-md border border-dashed border-neutral-300 px-4 py-5 text-center text-sm text-neutral-500">
                    No files added. Attachments are optional.
                </div>
            ) : (
                <div className="space-y-3">
                    {value.map((item, index) => (
                        <div key={item.id} className="grid gap-2 rounded-md border bg-white p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                            <div className="space-y-1.5">
                                <Label htmlFor={`attachment-name-${item.id}`}>File name *</Label>
                                <Input
                                    id={`attachment-name-${item.id}`}
                                    value={item.name}
                                    disabled={disabled}
                                    maxLength={255}
                                    placeholder={namePlaceholder}
                                    onChange={(event) => updateItem(item.id, { name: event.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`attachment-file-${item.id}`}>Choose file *</Label>
                                <Input
                                    id={`attachment-file-${item.id}`}
                                    type="file"
                                    accept={accept}
                                    disabled={disabled}
                                    onChange={(event) => updateItem(item.id, { file: event.target.files?.[0] ?? null })}
                                />
                                {item.file && (
                                    <p className="truncate text-xs text-neutral-500" title={item.file.name}>
                                        {item.file.name} ({(item.file.size / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={disabled}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                aria-label={`Remove attachment ${index + 1}`}
                                onClick={() => removeItem(item.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </section>
    )
}
