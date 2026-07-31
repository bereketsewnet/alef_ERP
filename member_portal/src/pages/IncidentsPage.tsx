import { useEffect, useState } from 'react'
import { attendanceApi } from '@/api/endpoints/attendance'
import { incidentApi } from '@/api/endpoints/incidents'
import type { ClientSite, Incident } from '@/types'
import { Card, Button } from '@/components/ui'

export function IncidentsPage() {
    const [sites, setSites] = useState<ClientSite[]>([])
    const [history, setHistory] = useState<Incident[]>([])
    const [siteId, setSiteId] = useState<number>()
    const [description, setDescription] = useState('')
    const [severity, setSeverity] = useState('LOW')
    const [files, setFiles] = useState<File[]>([])
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const refresh = () => incidentApi.getAll().then(r => setHistory(r.data))
    useEffect(() => { attendanceApi.getControllerSites().then(r => { setSites(r.data); setSiteId(r.data[0]?.id) }); refresh() }, [])
    const submit = async (e: React.FormEvent) => {
        e.preventDefault(); if (!siteId) return
        setSaving(true); setMessage('')
        try { await incidentApi.create({ site_id: siteId, report_type: 'INCIDENT', description, severity_level: severity, images: files }); setDescription(''); setFiles([]); setMessage('Incident submitted'); refresh() }
        catch (err: any) { setMessage(err.response?.data?.error || 'Could not submit incident') }
        finally { setSaving(false) }
    }
    return <div className="space-y-4">
        <div><h1 className="text-2xl font-bold">Incidents</h1><p className="text-sm text-gray-500">Report and review your site incidents</p></div>
        <Card><form className="space-y-3" onSubmit={submit}>
            <select required className="w-full rounded-lg border p-3" value={siteId || ''} onChange={e => setSiteId(Number(e.target.value))}><option value="">Select site</option>{sites.map(s => <option value={s.id} key={s.id}>{s.site_name}</option>)}</select>
            <select className="w-full rounded-lg border p-3" value={severity} onChange={e => setSeverity(e.target.value)}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select>
            <textarea required maxLength={2000} className="min-h-28 w-full rounded-lg border p-3" placeholder="What happened?" value={description} onChange={e => setDescription(e.target.value)} />
            <input multiple accept="image/*,.pdf,.doc,.docx,.txt" type="file" onChange={e => setFiles(Array.from(e.target.files || []))} />
            {message && <p className="text-sm">{message}</p>}<Button type="submit" className="w-full" isLoading={saving}>Submit incident</Button>
        </form></Card>
        <h2 className="font-semibold">My reports</h2>
        {history.map(item => <Card key={item.id}><div className="flex justify-between"><b>{item.site?.site_name || 'Site'}</b><span className="text-xs">{item.severity_level}</span></div><p className="mt-2 text-sm">{item.description}</p><p className="mt-2 text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p></Card>)}
    </div>
}
