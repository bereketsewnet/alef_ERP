import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin, Search } from 'lucide-react'
import { useClients } from '@/services/useClients'
import { useUpdateUserSites } from '@/services/useUsers'
import type { User } from '@/types/common.types'

interface Props { user: User | null; open: boolean; onClose: () => void }

export function UserSitesModal({ user, open, onClose }: Props) {
    const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([])
    const [search, setSearch] = useState('')
    const { data: clientsData, isLoading } = useClients({ page: 1, per_page: 1000 })
    const { mutate: updateSites, isPending } = useUpdateUserSites()

    useEffect(() => {
        setSelectedSiteIds(user?.supervised_sites?.map((site) => site.id) || [])
        setSearch('')
    }, [user])

    const clients = useMemo(() => {
        const term = search.trim().toLowerCase()
        return (clientsData?.data || []).map((client) => ({
            ...client,
            sites: (client.sites || []).filter((site) => !term || client.company_name.toLowerCase().includes(term) || site.site_name.toLowerCase().includes(term)),
        })).filter((client) => (client.sites?.length || 0) > 0)
    }, [clientsData, search])

    if (!user) return null
    const toggle = (siteId: number) => setSelectedSiteIds((current) => current.includes(siteId) ? current.filter((id) => id !== siteId) : [...current, siteId])

    return <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Manage Sites — {user.username}</DialogTitle>
                <DialogDescription>Add or remove sites controlled by this {user.role.toLowerCase().replace('_', ' ')} user.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company or site..." className="pl-9" />
                </div>
                <Badge variant="outline">{selectedSiteIds.length} sites assigned</Badge>
            </div>
            <div className="max-h-[55vh] space-y-3 overflow-y-auto rounded-lg border p-3">
                {isLoading && <p className="py-8 text-center text-neutral-500">Loading sites...</p>}
                {clients.map((client) => <div key={client.id} className="rounded-md border">
                    <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 font-medium"><Building2 className="h-4 w-4" />{client.company_name}</div>
                    <div className="divide-y">
                        {client.sites?.map((site) => <label key={site.id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-neutral-50">
                            <input type="checkbox" className="h-4 w-4" checked={selectedSiteIds.includes(site.id)} onChange={() => toggle(site.id)} disabled={isPending} />
                            <MapPin className="h-4 w-4 text-neutral-400" /><span>{site.site_name}</span>
                        </label>)}
                    </div>
                </div>)}
                {!isLoading && clients.length === 0 && <p className="py-8 text-center text-neutral-500">No sites found</p>}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button disabled={isPending} onClick={() => updateSites({ userId: user.id, siteIds: selectedSiteIds }, { onSuccess: onClose })}>{isPending ? 'Saving...' : 'Save Sites'}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
}
