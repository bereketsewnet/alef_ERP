import { useEffect, useMemo, useState } from 'react'
import { BriefcaseBusiness, CheckCheck, Search, Tags, UserCheck, Users, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { EmployeeAssignmentOption } from '@/api/endpoints/employees'
import type { Job, JobCategory } from '@/api/endpoints/jobs'
import { cn } from '@/lib/utils'

interface EmployeeAssignmentPickerProps {
    employees: EmployeeAssignmentOption[]
    categories: JobCategory[]
    jobs: Job[]
    assignmentJobId: string
    value: string[]
    onChange: (employeeIds: string[]) => void
    isLoading?: boolean
}

const normalizeSearch = (value: string) => value
    .toLocaleLowerCase()
    .replace(/[.,/_()\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export function EmployeeAssignmentPicker({
    employees,
    categories,
    jobs,
    assignmentJobId,
    value,
    onChange,
    isLoading = false,
}: EmployeeAssignmentPickerProps) {
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [jobFilter, setJobFilter] = useState('all')
    const [selectedOnly, setSelectedOnly] = useState(false)

    useEffect(() => {
        // Keep all employees visible after the assignment job changes. Staff
        // can still narrow by assigned job, while unqualified employees remain
        // visible with a clear configuration hint instead of an empty list.
        setJobFilter('all')
    }, [assignmentJobId])

    const selectedIds = useMemo(() => new Set(value), [value])
    const selectedJobId = assignmentJobId ? Number(assignmentJobId) : null
    const selectedJob = jobs.find((job) => job.id === selectedJobId)

    const hasDirectJob = (employee: EmployeeAssignmentOption) => (
        selectedJobId !== null && employee.jobs.some((job) => job.id === selectedJobId)
    )
    const hasMatchingCategory = (employee: EmployeeAssignmentOption) => {
        if (!selectedJob?.category_id) return false
        return employee.job_category?.id === selectedJob.category_id
            || employee.jobs.some((job) => job.category?.id === selectedJob.category_id)
    }
    const isQualified = (employee: EmployeeAssignmentOption) => hasDirectJob(employee) || hasMatchingCategory(employee)

    const filteredEmployees = useMemo(() => {
        const tokens = normalizeSearch(search).split(' ').filter(Boolean)
        return employees.filter((employee) => {
            if (selectedOnly && !selectedIds.has(String(employee.id))) return false

            const employeeCategoryIds = new Set([
                employee.job_category?.id,
                ...employee.jobs.map((job) => job.category?.id),
            ].filter((id): id is number => typeof id === 'number'))
            if (categoryFilter !== 'all' && !employeeCategoryIds.has(Number(categoryFilter))) return false
            if (jobFilter !== 'all' && !employee.jobs.some((job) => job.id === Number(jobFilter))) return false

            if (tokens.length > 0) {
                const haystack = normalizeSearch(employee.search_text || [
                    employee.first_name,
                    employee.last_name,
                    employee.employee_code,
                    employee.phone_number,
                    employee.email,
                ].filter(Boolean).join(' '))
                if (!tokens.every((token) => haystack.includes(token))) return false
            }
            return true
        })
    }, [employees, search, categoryFilter, jobFilter, selectedOnly, selectedIds])

    const qualifiedVisibleIds = filteredEmployees
        .filter(isQualified)
        .map((employee) => String(employee.id))
    const selectedEmployees = employees.filter((employee) => selectedIds.has(String(employee.id)))
    const qualifiedCount = employees.filter(isQualified).length

    const toggle = (employee: EmployeeAssignmentOption, checked: boolean) => {
        if (!isQualified(employee)) return
        const next = new Set(value)
        if (checked) next.add(String(employee.id))
        else next.delete(String(employee.id))
        onChange(Array.from(next))
    }

    const selectAllVisible = () => onChange(Array.from(new Set([...value, ...qualifiedVisibleIds])))
    const clearVisible = () => {
        const visible = new Set(filteredEmployees.map((employee) => String(employee.id)))
        onChange(value.filter((id) => !visible.has(id)))
    }

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b bg-primary-50/70 p-3 sm:p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2 font-semibold text-primary">
                            <Users className="h-4 w-4" /> Employee selection
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {employees.length} active employees · {filteredEmployees.length} match filters · {qualifiedCount} qualified for {selectedJob?.job_name || 'the selected job'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={selectAllVisible} disabled={!assignmentJobId || qualifiedVisibleIds.length === 0}>
                            <CheckCheck className="mr-1.5 h-4 w-4" /> Select visible ({qualifiedVisibleIds.length})
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={clearVisible} disabled={value.length === 0}>Clear visible</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])} disabled={value.length === 0}>Clear all</Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-3 border-b p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-[minmax(220px,1fr)_190px_220px_auto]">
                <div className="relative sm:col-span-2 xl:col-span-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search name, ID, phone, work, or skill…"
                        className="pl-9"
                    />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger aria-label="Filter employees by category"><SelectValue placeholder="All categories" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={jobFilter} onValueChange={setJobFilter}>
                    <SelectTrigger aria-label="Filter employees by assigned job"><SelectValue placeholder="All assigned jobs" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All assigned jobs</SelectItem>
                        {jobs.map((job) => <SelectItem key={job.id} value={String(job.id)}>{job.job_code} — {job.job_name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button
                    type="button"
                    variant={selectedOnly ? 'default' : 'outline'}
                    onClick={() => setSelectedOnly((current) => !current)}
                    className="justify-center"
                >
                    <UserCheck className="mr-2 h-4 w-4" /> Selected ({value.length})
                </Button>
            </div>

            {!assignmentJobId && (
                <div className="m-3 rounded-lg border border-accent-300 bg-accent-50 px-3 py-2 text-sm text-primary sm:m-4">
                    Select the Job Type above first. The system will then show qualified employees and prevent incompatible assignments.
                </div>
            )}

            {selectedEmployees.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2 sm:px-4">
                    <span className="mr-1 text-xs font-medium text-muted-foreground">Selected:</span>
                    {selectedEmployees.slice(0, 8).map((employee) => (
                        <Badge key={employee.id} variant="secondary" className="gap-1 pr-1">
                            {employee.first_name} {employee.last_name}
                            <button type="button" aria-label={`Remove ${employee.first_name} ${employee.last_name}`} onClick={() => toggle(employee, false)} className="rounded-full p-0.5 hover:bg-border">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                    {selectedEmployees.length > 8 && <Badge variant="outline">+{selectedEmployees.length - 8} more</Badge>}
                </div>
            )}

            <ScrollArea className="h-[360px] sm:h-[420px]">
                <div className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4">
                    {isLoading ? (
                        <div className="col-span-full py-12 text-center text-sm text-muted-foreground">Loading active employees…</div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="col-span-full py-12 text-center">
                            <Users className="mx-auto h-9 w-9 text-muted-foreground/50" />
                            <p className="mt-2 font-medium">No employees match these filters</p>
                            <button type="button" className="mt-1 text-sm text-primary underline" onClick={() => { setSearch(''); setCategoryFilter('all'); setJobFilter('all'); setSelectedOnly(false) }}>Reset employee filters</button>
                        </div>
                    ) : filteredEmployees.map((employee) => {
                        const id = String(employee.id)
                        const checked = selectedIds.has(id)
                        const qualified = isQualified(employee)
                        const categoryNames = Array.from(new Set([
                            employee.job_category?.name,
                            ...employee.jobs.map((job) => job.category?.name),
                        ].filter((name): name is string => Boolean(name))))
                        const skills = Array.from(new Set(employee.jobs.flatMap((job) => job.skills?.map((skill) => skill.skill_name) || [])))
                        const directJob = hasDirectJob(employee)
                        const categoryMatchesAssignment = hasMatchingCategory(employee)

                        return (
                            <div
                                key={employee.id}
                                className={cn(
                                    'rounded-lg border p-3 transition-colors',
                                    checked && 'border-primary bg-primary-50/70 ring-1 ring-primary/20',
                                    !checked && qualified && 'hover:border-primary/50 hover:bg-muted/40',
                                    !qualified && 'bg-muted/30 opacity-70',
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={checked}
                                        disabled={!qualified}
                                        onCheckedChange={(next) => toggle(employee, next === true)}
                                        aria-label={`Select ${employee.first_name} ${employee.last_name}`}
                                        className="mt-1"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <div className="font-semibold leading-tight">{employee.first_name} {employee.last_name}</div>
                                                <div className="mt-1 text-xs text-muted-foreground">{employee.employee_code}{employee.phone_number ? ` · ${employee.phone_number}` : ''}</div>
                                            </div>
                                            {!qualified && assignmentJobId && <Badge variant="outline" className="border-accent-400 text-accent-700">Not qualified</Badge>}
                                            {!directJob && categoryMatchesAssignment && <Badge variant="outline" className="border-info-300 text-info-700">Category match · job linked on assign</Badge>}
                                        </div>

                                        {categoryNames.length > 0 && (
                                            <div className="mt-2 flex flex-wrap items-center gap-1">
                                                <Tags className="h-3.5 w-3.5 text-accent-700" />
                                                {categoryNames.map((category) => <Badge key={category} variant="secondary" className="bg-accent-50 text-primary">{category}</Badge>)}
                                            </div>
                                        )}
                                        {employee.jobs.length > 0 && (
                                            <div className="mt-2 flex flex-wrap items-center gap-1">
                                                <BriefcaseBusiness className="h-3.5 w-3.5 text-primary" />
                                                {employee.jobs.map((job) => <Badge key={job.id} variant={job.is_primary ? 'info' : 'outline'}>{job.job_name}{job.is_primary ? ' · Primary' : ''}</Badge>)}
                                            </div>
                                        )}
                                        {skills.length > 0 && (
                                            <div className="mt-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">Skills:</span> {skills.join(', ')}</div>
                                        )}
                                        {!qualified && assignmentJobId && (
                                            <div className="mt-2 text-xs text-muted-foreground">Assign “{selectedJob?.job_name}” in the employee configuration before scheduling.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
        </div>
    )
}
