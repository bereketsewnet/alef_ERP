import { useEffect, useState } from 'react'
import { attendanceApi, type ManualStatus, type SiteShift } from '@/api/endpoints/attendance'
import type { ClientSite } from '@/types'
import { Card, CardTitle, Button, Spinner } from '@/components/ui'
import { MapPin, RefreshCw, Users } from 'lucide-react'

const statuses: { value: ManualStatus; label: string }[] = [
    { value: 'PRESENT', label: 'Present' },
    { value: 'LATE', label: 'Late' },
    { value: 'LATE_WITH_PERMISSION', label: 'Late (permission)' },
    { value: 'ABSENT', label: 'Absent' },
    { value: 'ABSENT_WITH_PERMISSION', label: 'Absent (permission)' },
    { value: 'POLICY_VIOLATION', label: 'Policy violation' },
]

function addisToday() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Addis_Ababa', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function SiteAttendancePage() {
    const [sites, setSites] = useState<ClientSite[]>([])
    const [siteId, setSiteId] = useState<number>()
    const [shifts, setShifts] = useState<SiteShift[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<number>()
    const [error, setError] = useState('')

    useEffect(() => {
        attendanceApi.getControllerSites().then(({ data }) => {
            setSites(data); setSiteId(data[0]?.id)
        }).catch(() => setError('Could not load assigned sites')).finally(() => setLoading(false))
    }, [])

    const load = async (selected = siteId) => {
        if (!selected) return
        setLoading(true); setError('')
        try { setShifts(await attendanceApi.getSiteAttendance(selected, addisToday())) }
        catch (e: any) { setError(e.response?.data?.error || 'Could not load attendance') }
        finally { setLoading(false) }
    }
    useEffect(() => { if (siteId) load(siteId) }, [siteId])

    const mark = async (shift: SiteShift, status: ManualStatus) => {
        const isViolation = status === 'POLICY_VIOLATION'
        const entered = window.prompt(isViolation ? 'Reason is required. Describe the rule violation:' : 'Optional attendance note', shift.attendance_log?.manual_note || '')
        if (entered === null || (isViolation && !entered.trim())) { if (isViolation) setError('A reason is required for a policy violation'); return }
        const note = entered.trim() || undefined
        setSaving(shift.id); setError('')
        try {
            if (shift.attendance_log?.id) await attendanceApi.updateManual(shift.attendance_log.id, status, note)
            else await attendanceApi.markManual(shift.id, status, note)
            await load()
        } catch (e: any) { setError(e.response?.data?.error || e.response?.data?.message || 'Attendance could not be saved') }
        finally { setSaving(undefined) }
    }

    if (loading && !sites.length) return <Spinner />
    return <div className="space-y-4">
        <div><h1 className="text-2xl font-bold">Site Attendance</h1><p className="text-sm text-gray-500">Manage today’s scheduled employees</p></div>
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {!sites.length ? <Card><p>No sites are assigned to your account.</p></Card> : <>
            <Card>
                <label className="text-sm font-medium flex items-center gap-2"><MapPin className="h-4 w-4" /> Assigned site</label>
                <select className="mt-2 w-full rounded-lg border p-3" value={siteId} onChange={e => setSiteId(Number(e.target.value))}>
                    {sites.map(site => <option key={site.id} value={site.id}>{site.site_name}</option>)}
                </select>
            </Card>
            <div className="flex items-center justify-between"><div className="flex gap-2"><Users className="h-5 w-5" /><b>{shifts.length} scheduled</b></div><Button variant="ghost" size="sm" onClick={() => load()}><RefreshCw className="h-4 w-4" /></Button></div>
            {!loading && !shifts.length && <Card><p className="text-gray-500">No employees are scheduled at this site today.</p></Card>}
            {shifts.map(shift => <Card key={shift.id}>
                <CardTitle>{shift.employee.first_name} {shift.employee.last_name}</CardTitle>
                <p className="text-xs text-gray-500 mb-3">{new Date(shift.shift_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(shift.shift_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <div className="mb-3 rounded bg-gray-50 px-3 py-2 text-sm">Current: <b>{shift.attendance_status.replace(/_/g, ' ')}</b></div>
                <div className="grid grid-cols-2 gap-2">
                    {statuses.map(status => <Button key={status.value} size="sm" variant={status.value.startsWith('ABSENT') ? 'danger' : status.value.startsWith('LATE') ? 'outline' : 'primary'} disabled={saving === shift.id} onClick={() => mark(shift, status.value)}>{status.label}</Button>)}
                </div>
            </Card>)}
        </>}
    </div>
}
