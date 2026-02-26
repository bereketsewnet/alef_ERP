import { useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { ColumnDef } from "@tanstack/react-table"
import { AlertTriangle, Loader2, ArrowUpDown, Trash2 } from "lucide-react"
import { useIncidents, useDeleteIncident } from "@/services/useIncidents"
import { ReportIncidentModal } from "@/components/incidents/ReportIncidentModal"
import { ViewIncidentModal } from "@/components/incidents/ViewIncidentModal"
import type { Incident } from "@/api/endpoints/incidents"

export function IncidentsPage() {
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
    const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null)

    const { data: incidents, isLoading } = useIncidents({ page: 1 })
    const { mutate: deleteIncident } = useDeleteIncident()

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
                const reportedByName = row.original.reported_by_name
                const reportedByEmployee = row.original.reported_by
                if (reportedByName && reportedByName.trim()) {
                    return reportedByName
                } else if (reportedByEmployee) {
                    const employeeName = `${reportedByEmployee.first_name || ''} ${reportedByEmployee.last_name || ''}`.trim()
                    return employeeName || '-'
                }
                return '-'
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
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedIncident(row.original)}
                        >
                            View
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIncidentToDelete(row.original)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                        Incidents & Reports
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        View and manage security incidents and operational reports
                    </p>
                </div>
                <Button className="bg-red-600 hover:bg-red-700 shrink-0" onClick={() => setCreateModalOpen(true)}>
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

            <ConfirmDialog
                open={!!incidentToDelete}
                onOpenChange={(open) => !open && setIncidentToDelete(null)}
                title="Delete Incident"
                description={`Are you sure you want to delete this incident? This action cannot be undone. The incident report will be permanently removed from the system.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={() => {
                    if (incidentToDelete) {
                        if (window.confirm(`⚠️ WARNING: You are about to permanently delete incident #${incidentToDelete.id}.\n\nThis will remove:\n- The incident report\n- All associated data\n\nThis action CANNOT be undone.\n\nAre you absolutely sure you want to proceed?`)) {
                            deleteIncident(incidentToDelete.id, {
                                onSuccess: () => {
                                    setIncidentToDelete(null)
                                }
                            })
                        }
                    }
                }}
                variant="destructive"
            />
        </div>
    )
}
