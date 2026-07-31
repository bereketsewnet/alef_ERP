import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Users } from 'lucide-react'
import type { User } from '@/types/common.types'

interface Props {
    users: User[]
    value: number[]
    onChange: (value: number[]) => void
    disabled?: boolean
}

export function SiteSupervisorsField({ users, value, onChange, disabled }: Props) {
    const [search, setSearch] = useState('')
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        if (!term) return users
        return users.filter((user) => [
            user.username, user.email, user.phone_number,
            user.employee?.first_name, user.employee?.last_name, user.employee?.employee_code,
        ].some((item) => item?.toLowerCase().includes(term)))
    }, [search, users])

    const toggle = (id: number) => onChange(
        value.includes(id) ? value.filter((selected) => selected !== id) : [...value, id],
    )

    return <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
            <div>
                <p className="text-sm font-medium">Field Staff / Site Supervisors (Optional)</p>
                <p className="text-xs text-neutral-500">Select one or more staff members responsible for this site.</p>
            </div>
            <Badge variant="outline"><Users className="mr-1 h-3.5 w-3.5" />{value.length} selected</Badge>
        </div>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search field staff..." className="pl-9" disabled={disabled} />
        </div>
        <div className="max-h-52 space-y-1 overflow-y-auto rounded-md border p-2">
            {filtered.map((user) => {
                const name = user.employee ? `${user.employee.first_name} ${user.employee.last_name}` : user.username
                return <label key={user.id} className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-neutral-50">
                    <input type="checkbox" checked={value.includes(user.id)} onChange={() => toggle(user.id)} disabled={disabled} className="h-4 w-4" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{name}</span><span className="block truncate text-xs text-neutral-500">{user.email} · {user.role}</span></span>
                </label>
            })}
            {filtered.length === 0 && <p className="py-5 text-center text-sm text-neutral-500">No field staff found</p>}
        </div>
    </div>
}
