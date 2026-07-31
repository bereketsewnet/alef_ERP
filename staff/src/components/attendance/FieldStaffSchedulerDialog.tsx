import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usersApi } from '@/api/endpoints/users'
import { clientsApi, type Client } from '@/api/endpoints/clients'
import apiClient from '@/api/axios'
import { toast } from 'sonner'

export function FieldStaffSchedulerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
    const [users, setUsers] = useState<any[]>([]), [clients, setClients] = useState<Client[]>([])
    const [userIds, setUserIds] = useState<number[]>([]), [siteId, setSiteId] = useState('')
    const [startDate, setStartDate] = useState(''), [endDate, setEndDate] = useState('')
    const [startTime, setStartTime] = useState('08:00'), [endTime, setEndTime] = useState('17:00'), [saving, setSaving] = useState(false)
    useEffect(() => { if (open) Promise.all([usersApi.list({ per_page: 500 }), clientsApi.list({ page: 1, per_page: 500 })]).then(([u, c]) => { setUsers(u.data.filter((x: any) => ['FIELD_STAFF', 'SUPERVISOR'].includes(x.role) && x.supervised_sites?.length > 0 && (!x.employee_id || x.employee?.employee_code?.startsWith('FS-')))); setClients(c.data) }) }, [open])
    const sites = useMemo(() => clients.flatMap(c => (c.sites || []).map(s => ({ ...s, company: c.company_name }))), [clients])
    const eligibleUsers = useMemo(() => {
        const selected = Number(siteId)
        return users.filter(user => user.supervised_sites?.some((site: any) => Number(site.id) === selected))
    }, [users, siteId])
    const submit = async () => {
        setSaving(true)
        try { const { data } = await apiClient.post('/roster/field-staff/bulk-assign', { site_id: Number(siteId), user_ids: userIds, start_date: startDate, end_date: endDate, start_time: startTime, end_time: endTime }); toast.success(data.message); onOpenChange(false) }
        catch (e: any) {
            const validation = e.response?.data?.errors
            const detail = validation ? Object.values(validation).flat().join(' ') : null
            toast.error(e.response?.data?.error || detail || e.response?.data?.message || 'Could not create Field Staff schedule')
        }
        finally { setSaving(false) }
    }
    return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>Schedule Field Staff</DialogTitle><DialogDescription>Create GPS attendance shifts. Existing overlapping shifts are skipped.</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Assigned site</Label><select className="mt-1 h-10 w-full rounded-md border px-3" value={siteId} onChange={e => { setSiteId(e.target.value); setUserIds([]) }}><option value="">Select site</option>{sites.map(s => <option key={s.id} value={s.id}>{s.company} — {s.site_name}</option>)}</select></div>
            <div className="sm:col-span-2"><Label>Field Staff assigned to this site (multiple)</Label><div className="mt-1 grid max-h-40 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">{!siteId && <p className="text-sm text-neutral-500">Select a site first.</p>}{siteId && !eligibleUsers.length && <p className="text-sm text-amber-700 sm:col-span-2">No Field Staff are assigned to this site. Assign a site from User Management first.</p>}{eligibleUsers.map(u => <label key={u.id} className="flex gap-2 text-sm"><input type="checkbox" checked={userIds.includes(u.id)} onChange={() => setUserIds(v => v.includes(u.id) ? v.filter(id => id !== u.id) : [...v, u.id])} />{u.username} ({u.role}){!u.employee_id && ' — profile will be linked automatically'}</label>)}</div></div>
            <div><Label>Start date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div><div><Label>End date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
            <div><Label>Start time (Addis Ababa)</Label><Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></div><div><Label>End time</Label><Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} /></div>
        </div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!siteId || !userIds.length || !startDate || !endDate || saving} onClick={submit}>{saving ? 'Creating…' : 'Create shifts'}</Button></div>
    </DialogContent></Dialog>
}
