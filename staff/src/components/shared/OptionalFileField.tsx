import { FileUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface OptionalFileFieldProps {
    id: string
    label: string
    description?: string
    accept?: string
    value?: File
    disabled?: boolean
    onChange: (file?: File) => void
}

export function OptionalFileField({
    id,
    label,
    description,
    accept,
    value,
    disabled,
    onChange,
}: OptionalFileFieldProps) {
    return (
        <div className="space-y-1.5 rounded-md border bg-neutral-50/60 p-3">
            <Label htmlFor={id} className="flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                {label} <span className="font-normal text-neutral-500">(optional)</span>
            </Label>
            {description && <p className="text-xs text-neutral-500">{description}</p>}
            <Input
                id={id}
                type="file"
                accept={accept}
                disabled={disabled}
                onChange={(event) => onChange(event.target.files?.[0])}
            />
            {value && (
                <p className="truncate text-xs text-neutral-500" title={value.name}>
                    {value.name} ({(value.size / 1024 / 1024).toFixed(2)} MB)
                </p>
            )}
        </div>
    )
}
