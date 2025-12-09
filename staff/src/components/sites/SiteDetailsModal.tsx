import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Phone, Briefcase, Ruler } from 'lucide-react'
import { SiteJobsPanel } from './SiteJobsPanel'

interface Site {
    id: number
    site_name: string
    latitude: number
    longitude: number
    geo_radius_meters?: number
    site_contact_phone?: string
    is_active?: boolean
}

interface SiteDetailsModalProps {
    open: boolean
    onClose: () => void
    site: Site | null
}

export function SiteDetailsModal({ open, onClose, site }: SiteDetailsModalProps) {
    if (!site) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {site.site_name}
                        <Badge variant={site.is_active !== false ? 'success' : 'destructive'} className="ml-2">
                            {site.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="info" className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="info" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location Info
                        </TabsTrigger>
                        <TabsTrigger value="jobs" className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Job Requirements
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="mt-4 space-y-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-neutral-500 text-sm">
                                            <MapPin className="h-4 w-4" />
                                            Coordinates
                                        </div>
                                        <p className="font-mono font-medium">
                                            {Number(site.latitude).toFixed(6)}, {Number(site.longitude).toFixed(6)}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-neutral-500 text-sm">
                                            <Ruler className="h-4 w-4" />
                                            GPS Radius
                                        </div>
                                        <p className="font-medium">{site.geo_radius_meters || 100} meters</p>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-neutral-500 text-sm">
                                            <Phone className="h-4 w-4" />
                                            Site Contact
                                        </div>
                                        <p className="font-medium">{site.site_contact_phone || '-'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Map Placeholder */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="aspect-video bg-neutral-100 rounded-lg flex items-center justify-center">
                                    <div className="text-center text-neutral-500">
                                        <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>Map view coming soon</p>
                                        <p className="text-xs mt-1">
                                            Location: {Number(site.latitude).toFixed(4)}, {Number(site.longitude).toFixed(4)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="jobs" className="mt-4">
                        <SiteJobsPanel
                            siteId={site.id}
                            siteName={site.site_name}
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
