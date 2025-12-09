
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, MapPin, User, AlertTriangle, FileText } from "lucide-react"
import type { Incident } from "@/api/endpoints/incidents"

interface ViewIncidentModalProps {
    incident: Incident | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ViewIncidentModal({ incident, open, onOpenChange }: ViewIncidentModalProps) {
    if (!incident) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <AlertTriangle className={
                            incident.report_type === 'PANIC' ? "text-red-600" : "text-orange-500"
                        } />
                        Incident Report #{incident.id}
                    </DialogTitle>
                    <DialogDescription>
                        Created on {new Date(incident.created_at).toLocaleString()}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Status Badges */}
                    <div className="flex gap-2">
                        <Badge variant="outline" className={
                            incident.report_type === 'PANIC' ? 'border-red-500 text-red-500' :
                                incident.report_type === 'INCIDENT' ? 'border-orange-500 text-orange-500' : ''
                        }>
                            {incident.report_type}
                        </Badge>
                        <Badge className={
                            incident.severity_level === 'CRITICAL' ? 'bg-red-600' :
                                incident.severity_level === 'HIGH' ? 'bg-orange-500' :
                                    incident.severity_level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                        }>
                            {incident.severity_level}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Site Info */}
                        <div className="space-y-1">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <MapPin className="h-4 w-4" /> Site
                            </h4>
                            <p className="font-medium text-lg">{incident.site?.site_name || "Unknown Site"}</p>
                            <p className="text-sm text-neutral-500">Site ID: {incident.site_id}</p>
                        </div>

                        {/* Reporter Info */}
                        <div className="space-y-1">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <User className="h-4 w-4" /> Reported By
                            </h4>
                            <p className="font-medium text-lg">
                                {incident.reported_by ? `${incident.reported_by.first_name} ${incident.reported_by.last_name}` : "Unknown User"}
                            </p>
                            {incident.reported_by && (
                                <p className="text-sm text-neutral-500">Employee ID: {incident.reported_by_employee_id}</p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Description */}
                    <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                            <FileText className="h-4 w-4" /> Description
                        </h4>
                        <div className="rounded-md bg-neutral-50 p-4 text-sm leading-relaxed whitespace-pre-wrap border">
                            {incident.description}
                        </div>
                    </div>

                    {/* Evidence (Placeholder for now) */}
                    {incident.evidence_media_urls && incident.evidence_media_urls.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground">Evidence</h4>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {incident.evidence_media_urls.map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 bg-neutral-100 rounded-md border flex items-center justify-center text-xs text-muted-foreground hover:bg-neutral-200">
                                        Attachment {i + 1}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
