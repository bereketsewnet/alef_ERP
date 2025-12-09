import { useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { AlertTriangle, Loader2, ArrowUpDown } from "lucide-react"
import { useIncidents } from "@/services/useIncidents"
import { ReportIncidentModal } from "@/components/incidents/ReportIncidentModal"
import { ViewIncidentModal } from "@/components/incidents/ViewIncidentModal"
import type { Incident } from "@/api/endpoints/incidents"

export function IncidentsPage() {
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

    const { data: incidents, isLoading } = useIncidents({ page: 1 })

    const columns: ColumnDef<Incident>[] = [
        {
            accessorKey: "id",
            header: "ID",
            cell: ({ row }) => <span className="text-muted-foreground">#{row.getValue("id")}</span>,
        },
        {
            accessorKey: "report_type",
            header: "Type",
            cell: ({ row }) => {
                const type = row.getValue("report_type") as string
                return (
                    <Badge variant="outline" className={
                        type === 'PANIC' ? 'border-red-500 text-red-500' :
                            type === 'INCIDENT' ? 'border-orange-500 text-orange-500' : ''
                    }>
                        {type}
                    </Badge>
                )
            }
        },
        {
            accessorKey: "severity_level",
            header: "Severity",
            cell: ({ row }) => {
                const severity = row.getValue("severity_level") as string
                return (
                    <Badge className={
                        severity === 'CRITICAL' ? 'bg-red-600' :
                            severity === 'HIGH' ? 'bg-orange-500' :
                                severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                    }>
                        {severity}
                    </Badge>
                )
            }
        },
        {
            accessorKey: "site.site_name", // Access nested site name
            header: "Site",
            cell: ({ row }) => {
                // Safe access in case site is deleted or null
                const site: any = row.original.site
                return site?.name || site?.site_name || "Unknown Site"
            }
        },
        {
            accessorKey: "reported_by",
            header: "Reported By",
            cell: ({ row }) => {
                const user = row.original.reported_by
                return user ? `${user.first_name} ${user.last_name}` : "Unknown"
            }
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleString(),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedIncident(row.original)}
                    >
                        View
                    </Button>
                )
            },
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">
                        Incidents & Reports
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        View and manage security incidents and operational reports
                    </p>
                </div>
                <Button className="bg-red-600 hover:bg-red-700" onClick={() => setCreateModalOpen(true)}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Report Incident
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <DataTable columns={columns} data={incidents?.data || []} />
            )}

            <ReportIncidentModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

            <ViewIncidentModal
                incident={selectedIncident}
                open={!!selectedIncident}
                onOpenChange={(open) => !open && setSelectedIncident(null)}
            />
        </div>
    )
}
