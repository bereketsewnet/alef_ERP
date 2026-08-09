import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from "recharts";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import {
  useReportDashboard,
  useExportReport,
  useAttendanceReport,
  useFinanceReport,
  useIncidentsReport,
  useRosterReport,
  useAssetReport,
  useClientSiteReport,
  useCrmReport,
  useBidReport,
} from "@/services/useReports";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

// Helper column definitions
const rosterColumns: ColumnDef<any>[] = [
  {
    accessorKey: "shift_start",
    header: "Start Time",
    cell: ({ row }) =>
      format(new Date(row.original.shift_start), "MMM dd, HH:mm"),
  },
  {
    accessorKey: "shift_end",
    header: "End Time",
    cell: ({ row }) =>
      format(new Date(row.original.shift_end), "MMM dd, HH:mm"),
  },
  { accessorKey: "site.site_name", header: "Site" },
  {
    accessorKey: "employee.first_name",
    header: "Employee",
    cell: ({ row }) =>
      `${row.original.employee?.first_name || ""} ${row.original.employee?.last_name || ""}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
  },
];

const attendanceColumns: ColumnDef<any>[] = [
  {
    accessorKey: "created_at",
    header: "Time",
    cell: ({ row }) =>
      format(new Date(row.original.created_at), "MMM dd, HH:mm"),
  },
  {
    accessorKey: "schedule.employee.first_name",
    header: "Employee",
    cell: ({ row }) =>
      `${row.original.schedule?.employee?.first_name || ""} ${row.original.schedule?.employee?.last_name || ""}`,
  },
  { accessorKey: "schedule.site.site_name", header: "Site" },
  { accessorKey: "verification_method", header: "Method" },
  {
    accessorKey: "flagged_late",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.flagged_late ? "destructive" : "default"}>
        {row.original.flagged_late ? "Late" : "On Time"}
      </Badge>
    ),
  },
];

const financeColumns: ColumnDef<any>[] = [
  { accessorKey: "invoice_number", header: "Invoice #" },
  { accessorKey: "client.company_name", header: "Client" },
  { accessorKey: "invoice_date", header: "Date" },
  {
    accessorKey: "total_amount",
    header: "Amount",
    cell: ({ row }) => `$${Number(row.original.total_amount).toLocaleString()}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.status === "PAID"
            ? "default"
            : row.original.status === "OVERDUE"
              ? "destructive"
              : "secondary"
        }
      >
        {row.original.status}
      </Badge>
    ),
  },
];

const incidentColumns: ColumnDef<any>[] = [
  {
    accessorKey: "created_at",
    header: "Reported At",
    cell: ({ row }) =>
      format(new Date(row.original.created_at), "MMM dd, HH:mm"),
  },
  { accessorKey: "site.site_name", header: "Site" },
  { accessorKey: "report_type", header: "Type" },
  {
    accessorKey: "severity_level",
    header: "Severity",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.severity_level === "CRITICAL"
            ? "destructive"
            : row.original.severity_level === "HIGH"
              ? "destructive"
              : "default"
        }
      >
        {row.original.severity_level}
      </Badge>
    ),
  },
  {
    accessorKey: "reported_by",
    header: "Reported By",
    cell: ({ row }) => {
      const reportedByName = row.original.reported_by_name;
      const reportedByEmployee = row.original.reported_by;
      if (reportedByName && reportedByName.trim()) {
        return reportedByName;
      } else if (reportedByEmployee) {
        const employeeName =
          `${reportedByEmployee.first_name || ""} ${reportedByEmployee.last_name || ""}`.trim();
        return employeeName || "-";
      }
      return "-";
    },
  },
];

const assetColumns: ColumnDef<any>[] = [
  { accessorKey: "asset_code", header: "Asset Code" },
  { accessorKey: "name", header: "Asset" },
  { accessorKey: "company", header: "Company" },
  { accessorKey: "site", header: "Site" },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "condition", header: "Condition" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
  },
  {
    accessorKey: "current_employee",
    header: "Current Employee",
    cell: ({ row }) => row.original.current_employee || "—",
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => `ETB ${Number(row.original.value).toLocaleString()}`,
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) =>
      format(new Date(row.original.created_at), "MMM dd, yyyy"),
  },
];

const assetHistoryColumns: ColumnDef<any>[] = [
  { accessorKey: "asset_code", header: "Asset Code" },
  { accessorKey: "asset_name", header: "Asset" },
  { accessorKey: "company", header: "Company" },
  { accessorKey: "employee", header: "Employee" },
  {
    accessorKey: "assigned_at",
    header: "Assigned",
    cell: ({ row }) =>
      format(new Date(row.original.assigned_at), "MMM dd, yyyy HH:mm"),
  },
  {
    accessorKey: "returned_at",
    header: "Returned",
    cell: ({ row }) =>
      row.original.returned_at ? (
        format(new Date(row.original.returned_at), "MMM dd, yyyy HH:mm")
      ) : (
        <Badge>Currently assigned</Badge>
      ),
  },
  {
    accessorKey: "return_condition",
    header: "Return Condition",
    cell: ({ row }) => row.original.return_condition || "—",
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => row.original.notes || "—",
  },
];

const clientReportColumns: ColumnDef<any>[] = [
  { accessorKey: "company", header: "Company" },
  { accessorKey: "sites", header: "Sites" },
  { accessorKey: "invoices", header: "Invoices" },
  {
    accessorKey: "total_billed",
    header: "Total Billed",
    cell: ({ row }) =>
      `ETB ${Number(row.original.total_billed).toLocaleString()}`,
  },
  { accessorKey: "paid", header: "Paid" },
  { accessorKey: "overdue", header: "Overdue" },
  { accessorKey: "verified", header: "Verified" },
  { accessorKey: "on_time", header: "On Time" },
  { accessorKey: "paid_late", header: "Paid Late" },
  {
    accessorKey: "next_due_date",
    header: "Next Due",
    cell: ({ row }) => row.original.next_due_date || "—",
  },
];
const siteReportColumns: ColumnDef<any>[] = [
  { accessorKey: "company", header: "Company" },
  { accessorKey: "site", header: "Site" },
  { accessorKey: "employees", header: "Employees" },
  { accessorKey: "field_staff", header: "Field Staff" },
  { accessorKey: "total_staff", header: "Total Staff" },
  {
    accessorKey: "gps_radius",
    header: "GPS Radius",
    cell: ({ row }) => `${row.original.gps_radius} m`,
  },
];
const invoiceReportColumns: ColumnDef<any>[] = [
  { accessorKey: "invoice_number", header: "Invoice #" },
  { accessorKey: "company", header: "Company" },
  { accessorKey: "invoice_date", header: "Invoice Date" },
  { accessorKey: "due_date", header: "Due Date" },
  {
    accessorKey: "payment_date",
    header: "Payment Date",
    cell: ({ row }) => row.original.payment_date || "—",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => `ETB ${Number(row.original.amount).toLocaleString()}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.overdue ? "destructive" : "outline"}>
        {row.original.overdue ? "OVERDUE" : row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "verified",
    header: "Verified",
    cell: ({ row }) => (row.original.verified ? "Yes" : "No"),
  },
  {
    id: "timing",
    header: "Payment Timing",
    cell: ({ row }) =>
      row.original.on_time
        ? "On time"
        : row.original.paid_late
          ? "Paid late"
          : row.original.overdue
            ? "Overdue"
            : "Due",
  },
];
const crmLeadColumns: ColumnDef<any>[] = [
  { accessorKey: "company", header: "Company" },
  { accessorKey: "contact", header: "Contact" },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => <Badge variant="outline">{row.original.stage}</Badge>,
  },
  {
    accessorKey: "expected_value",
    header: "Expected Value",
    cell: ({ row }) =>
      `ETB ${Number(row.original.expected_value).toLocaleString()}`,
  },
  {
    accessorKey: "probability",
    header: "Probability",
    cell: ({ row }) => `${row.original.probability || 0}%`,
  },
  {
    accessorKey: "next_action_date",
    header: "Next Action",
    cell: ({ row }) => row.original.next_action_date || "—",
  },
];
const crmContractColumns: ColumnDef<any>[] = [
  { accessorKey: "client", header: "Client" },
  { accessorKey: "title", header: "Contract" },
  { accessorKey: "categories", header: "Services" },
  { accessorKey: "start_date", header: "Start" },
  { accessorKey: "end_date", header: "End" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
  },
  {
    accessorKey: "amount",
    header: "Value",
    cell: ({ row }) => `ETB ${Number(row.original.amount).toLocaleString()}`,
  },
  { accessorKey: "documents", header: "Docs" },
  { accessorKey: "issues", header: "Issues" },
];
const crmIssueColumns: ColumnDef<any>[] = [
  { accessorKey: "client", header: "Client" },
  { accessorKey: "subject", header: "Issue" },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <Badge
        variant={row.original.priority === "URGENT" ? "destructive" : "outline"}
      >
        {row.original.priority}
      </Badge>
    ),
  },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "created_at", header: "Created" },
  {
    accessorKey: "resolved_at",
    header: "Resolved",
    cell: ({ row }) => row.original.resolved_at || "—",
  },
];
const bidReportColumns: ColumnDef<any>[] = [
  { accessorKey: "reference", header: "Reference" },
  { accessorKey: "title", header: "Bid" },
  { accessorKey: "issuer", header: "Issuer" },
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => row.original.client || "Public tender",
  },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "deadline", header: "Deadline" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.status === "WON"
            ? "default"
            : row.original.status === "LOST" ||
                row.original.status === "NOT_ELIGIBLE"
              ? "destructive"
              : "outline"
        }
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "estimated_value",
    header: "Estimated",
    cell: ({ row }) =>
      `ETB ${Number(row.original.estimated_value).toLocaleString()}`,
  },
  {
    accessorKey: "submitted_value",
    header: "Submitted",
    cell: ({ row }) =>
      row.original.submitted_value
        ? `ETB ${Number(row.original.submitted_value).toLocaleString()}`
        : "—",
  },
  { accessorKey: "documents", header: "Docs" },
];

export function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });
  const [clientFilters, setClientFilters] = useState<{
    client_id?: number;
    site_id?: number;
    payment_status?: string;
  }>({});
  const [bidStatus, setBidStatus] = useState("");

  const params = { start_date: dateRange.start, end_date: dateRange.end };

  // Data Hooks
  const { data: stats, isLoading: isLoadingStats } = useReportDashboard(params);
  const { data: rosterData, isLoading: isLoadingRoster } =
    useRosterReport(params);
  const { data: attendanceData, isLoading: isLoadingAttendance } =
    useAttendanceReport(params);
  const { data: financeData, isLoading: isLoadingFinance } =
    useFinanceReport(params);
  const { data: incidentData, isLoading: isLoadingIncidents } =
    useIncidentsReport(params);
  const { data: assetData, isLoading: isLoadingAssets } =
    useAssetReport(params);
  const clientSiteParams = { ...params, ...clientFilters };
  const { data: clientSiteData, isLoading: isLoadingClientSites } =
    useClientSiteReport(clientSiteParams);
  const { data: crmData, isLoading: isLoadingCrm } = useCrmReport(params);
  const bidParams = { ...params, status: bidStatus || undefined };
  const { data: bidData, isLoading: isLoadingBids } = useBidReport(bidParams);

  const { mutate: exportFile, isPending: isExporting } = useExportReport();

  const handleExport = (type: string, format: "pdf" | "excel" | "csv") => {
    exportFile({
      type,
      format,
      params:
        type === "clients-sites"
          ? clientSiteParams
          : type === "bids"
            ? bidParams
            : params,
    });
  };

  if (isLoadingStats) return <div className="p-8">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            Advanced Reports
          </h1>
          <p className="text-neutral-600">
            Analytics and exports for the current month
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm bg-white">
            <CalendarIcon className="h-4 w-4 text-neutral-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="bg-transparent border-none focus:outline-none h-auto p-0 text-sm"
            />
            <span className="text-neutral-400">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="bg-transparent border-none focus:outline-none h-auto p-0 text-sm"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="clients-sites">Clients & Sites</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="bids">Bids</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Key Metrics Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Billed
                </CardTitle>
                <span className="text-2xl font-bold">
                  ${stats?.finance?.total_billed?.toLocaleString() ?? 0}
                </span>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collected</CardTitle>
                <span className="text-2xl font-bold text-green-600">
                  ${stats?.finance?.total_paid?.toLocaleString() ?? 0}
                </span>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <span className="text-2xl font-bold text-red-600">
                  ${stats?.finance?.total_overdue?.toLocaleString() ?? 0}
                </span>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Incidents</CardTitle>
                <span className="text-2xl font-bold">
                  {stats?.incidents?.reduce(
                    (a: any, b: any) => a + b.count,
                    0,
                  ) ?? 0}
                </span>
              </CardHeader>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card className="col-span-1 min-w-0">
              <CardHeader>
                <CardTitle>Attendance Status</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] min-h-[300px]">
                <ResponsiveContainer width="100%" height={300} minWidth={0}>
                  <RechartsPie>
                    <Pie
                      data={stats?.attendance}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                    >
                      {stats?.attendance?.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1 min-w-0">
              <CardHeader>
                <CardTitle>Incident Severity</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] min-h-[300px]">
                <ResponsiveContainer width="100%" height={300} minWidth={0}>
                  <RechartsBar
                    data={stats?.incidents}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="severity_level"
                      type="category"
                      width={80}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#ef4444" name="Incidents" />
                  </RechartsBar>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roster">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Roster Report</CardTitle>
                <CardDescription>Detailed shift schedule data</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => handleExport("roster", "pdf")}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" /> Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingRoster ? (
                <div>Loading...</div>
              ) : (
                <DataTable
                  columns={rosterColumns}
                  data={rosterData?.data || []}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Attendance Report</CardTitle>
                <CardDescription>Clock-in/out records</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => handleExport("attendance", "pdf")}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" /> Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingAttendance ? (
                <div>Loading...</div>
              ) : (
                <DataTable
                  columns={attendanceColumns}
                  data={attendanceData?.data || []}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Finance Report</CardTitle>
                <CardDescription>Invoicing and payments</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => handleExport("finance", "pdf")}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" /> Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingFinance ? (
                <div>Loading...</div>
              ) : (
                <DataTable
                  columns={financeColumns}
                  data={financeData?.data || []}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Incident Report</CardTitle>
                <CardDescription>
                  Operational incidents and alerts
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => handleExport("incidents", "pdf")}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" /> Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingIncidents ? (
                <div>Loading...</div>
              ) : (
                <DataTable
                  columns={incidentColumns}
                  data={incidentData?.data || []}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="mt-6 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Asset Inventory and History
              </h2>
              <p className="text-sm text-neutral-500">
                Inventory created in the selected dates, plus assignment and
                return activity during those dates.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handleExport("assets", "csv")}
                disabled={isExporting || isLoadingAssets}
              >
                <Download className="mr-2 h-4 w-4" /> Download CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport("assets", "pdf")}
                disabled={isExporting || isLoadingAssets}
              >
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            </div>
          </div>

          {isLoadingAssets ? (
            <Card>
              <CardContent className="py-12 text-center">
                Loading asset report...
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                {[
                  ["Total Assets", assetData?.summary.total ?? 0],
                  ["Available", assetData?.summary.available ?? 0],
                  ["Assigned", assetData?.summary.assigned ?? 0],
                  [
                    "Total Value",
                    `ETB ${(assetData?.summary.total_value ?? 0).toLocaleString()}`,
                  ],
                  ["History Records", assetData?.summary.history_records ?? 0],
                ].map(([label, value]) => (
                  <Card key={String(label)}>
                    <CardContent className="p-4 sm:p-5">
                      <p className="text-sm text-neutral-500">{label}</p>
                      <p className="mt-1 text-xl font-bold sm:text-2xl">
                        {value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle>Assets by Company</CardTitle>
                    <CardDescription>
                      Quantity supplied by each client company
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBar
                        data={assetData?.by_company || []}
                        margin={{ top: 10, right: 10, left: 0, bottom: 55 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-35}
                          textAnchor="end"
                          interval={0}
                          height={75}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" name="Assets" fill="#07324A" />
                      </RechartsBar>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle>Assets by Category</CardTitle>
                    <CardDescription>
                      Inventory distribution by asset category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={assetData?.by_category || []}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={95}
                          label
                        >
                          {assetData?.by_category.map((_, index) => (
                            <Cell
                              key={index}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Full Asset Inventory</CardTitle>
                  <CardDescription>
                    {assetData?.inventory.length ?? 0} assets match the selected
                    date range
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <DataTable
                    columns={assetColumns}
                    data={assetData?.inventory || []}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Assignment and Return History</CardTitle>
                  <CardDescription>
                    All asset assignment or return activity during the selected
                    date range
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <DataTable
                    columns={assetHistoryColumns}
                    data={assetData?.history || []}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        <TabsContent value="clients-sites" className="mt-6 space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Clients, Sites and Payments
              </h2>
              <p className="text-sm text-neutral-500">
                Site staffing is based on distinct employees rostered during the
                selected period. Payment metrics use invoices issued during the
                period.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handleExport("clients-sites", "csv")}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport("clients-sites", "excel")}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport("clients-sites", "pdf")}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={clientFilters.client_id || ""}
                onChange={(e) =>
                  setClientFilters((v) => ({
                    ...v,
                    client_id: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                    site_id: undefined,
                  }))
                }
              >
                <option value="">All companies</option>
                {clientSiteData?.clients.map((c) => (
                  <option key={c.client_id} value={c.client_id}>
                    {c.company}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={clientFilters.site_id || ""}
                onChange={(e) =>
                  setClientFilters((v) => ({
                    ...v,
                    site_id: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
              >
                <option value="">All sites</option>
                {clientSiteData?.staff_by_site.map((s) => (
                  <option key={s.site_id} value={s.site_id}>
                    {s.company} — {s.site}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={clientFilters.payment_status || ""}
                onChange={(e) =>
                  setClientFilters((v) => ({
                    ...v,
                    payment_status: e.target.value || undefined,
                  }))
                }
              >
                <option value="">All payment statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent/Due</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </CardContent>
          </Card>
          {isLoadingClientSites ? (
            <Card>
              <CardContent className="py-12 text-center">
                Loading client and site report…
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {[
                  ["Clients", clientSiteData?.summary.clients || 0],
                  ["Sites", clientSiteData?.summary.sites || 0],
                  ["Employees", clientSiteData?.summary.employees || 0],
                  ["Field Staff", clientSiteData?.summary.field_staff || 0],
                  ["Paid", clientSiteData?.summary.paid || 0],
                  ["Due", clientSiteData?.summary.due || 0],
                  ["Overdue", clientSiteData?.summary.overdue || 0],
                  ["Verified", clientSiteData?.summary.verified || 0],
                  ["On Time", clientSiteData?.summary.on_time || 0],
                  ["Paid Late", clientSiteData?.summary.paid_late || 0],
                  [
                    "Total Billed",
                    `ETB ${(clientSiteData?.summary.total_billed || 0).toLocaleString()}`,
                  ],
                ].map(([label, value]) => (
                  <Card key={String(label)}>
                    <CardContent className="p-4">
                      <p className="text-xs text-neutral-500 sm:text-sm">
                        {label}
                      </p>
                      <p className="mt-1 text-xl font-bold break-words">
                        {value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle>Staffing by Site</CardTitle>
                    <CardDescription>
                      Employees and Field Staff with roster shifts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBar
                        data={clientSiteData?.staff_by_site || []}
                        margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="site"
                          angle={-35}
                          textAnchor="end"
                          interval={0}
                          height={85}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="employees"
                          name="Employees"
                          stackId="a"
                          fill="#07324A"
                        />
                        <Bar
                          dataKey="field_staff"
                          name="Field Staff"
                          stackId="a"
                          fill="#DDA822"
                        />
                      </RechartsBar>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle>Payment Performance</CardTitle>
                    <CardDescription>
                      Due, overdue and payment timing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={clientSiteData?.payment_status || []}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={105}
                          label
                        >
                          {clientSiteData?.payment_status.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Client Payment Summary</CardTitle>
                  <CardDescription>
                    Billing, verification and payment performance by company
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <DataTable
                    columns={clientReportColumns}
                    data={clientSiteData?.clients || []}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Site Staffing Detail</CardTitle>
                  <CardDescription>
                    Distinct rostered personnel for every site
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <DataTable
                    columns={siteReportColumns}
                    data={clientSiteData?.staff_by_site || []}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Invoice and Payment Detail</CardTitle>
                  <CardDescription>
                    Invoice date, due date, actual payment date and verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <DataTable
                    columns={invoiceReportColumns}
                    data={clientSiteData?.invoices || []}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        <TabsContent value="crm" className="mt-6 space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">CRM Performance Report</h2>
              <p className="text-sm text-neutral-500">
                Leads and issues created during the selected period; contracts
                whose duration overlaps it.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["csv", "excel", "pdf"] as const).map((f) => (
                <Button
                  key={f}
                  variant="outline"
                  onClick={() => handleExport("crm", f)}
                  disabled={isExporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {f === "excel" ? "Excel" : f.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          {isLoadingCrm ? (
            <Card>
              <CardContent className="py-12 text-center">
                Loading CRM report…
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
                {[
                  ["Leads", crmData?.summary.leads],
                  ["Pipeline ETB", crmData?.summary.pipeline_value],
                  ["Won Leads", crmData?.summary.won_leads],
                  ["Contracts", crmData?.summary.contracts],
                  ["Active", crmData?.summary.active_contracts],
                  ["Contract ETB", crmData?.summary.contract_value],
                  ["Open Issues", crmData?.summary.open_issues],
                  ["Urgent", crmData?.summary.urgent_issues],
                ].map(([l, v]) => (
                  <Card key={String(l)}>
                    <CardContent className="p-4">
                      <div className="text-xs text-neutral-500">{l}</div>
                      <div className="mt-1 break-words text-xl font-bold">
                        {Number(v || 0).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid min-w-0 gap-4 lg:grid-cols-3">
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle>Lead Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBar data={crmData?.lead_stages}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#07324A" />
                      </RechartsBar>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle>Contract Status</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={crmData?.contract_statuses}
                          dataKey="count"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={85}
                        >
                          {crmData?.contract_statuses.map(
                            (_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ),
                          )}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle>Issue Status</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={crmData?.issue_statuses}
                          dataKey="count"
                          nameKey="name"
                          outerRadius={85}
                        >
                          {crmData?.issue_statuses.map((_: any, i: number) => (
                            <Cell
                              key={i}
                              fill={COLORS[(i + 2) % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Lead Detail</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <DataTable
                    columns={crmLeadColumns}
                    data={crmData?.leads || []}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Contract Detail</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <DataTable
                    columns={crmContractColumns}
                    data={crmData?.contracts || []}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Customer Issues</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <DataTable
                    columns={crmIssueColumns}
                    data={crmData?.issues || []}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        <TabsContent value="bids" className="mt-6 space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Bid Performance Report</h2>
              <p className="text-sm text-neutral-500">
                Tender pipeline, values, outcomes, categories and document
                completeness.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="h-10 rounded-md border bg-white px-3"
                value={bidStatus}
                onChange={(e) => setBidStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                {["POTENTIAL", "APPLIED", "WON", "LOST", "NOT_ELIGIBLE"].map(
                  (x) => (
                    <option key={x}>{x}</option>
                  ),
                )}
              </select>
              {(["csv", "excel", "pdf"] as const).map((f) => (
                <Button
                  key={f}
                  variant="outline"
                  onClick={() => handleExport("bids", f)}
                  disabled={isExporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {f === "excel" ? "Excel" : f.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          {isLoadingBids ? (
            <Card>
              <CardContent className="py-12 text-center">
                Loading bid report…
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
                {[
                  ["Total", bidData?.summary.total],
                  ["Potential", bidData?.summary.potential],
                  ["Applied", bidData?.summary.applied],
                  ["Won", bidData?.summary.won],
                  ["Lost", bidData?.summary.lost],
                  ["Not Eligible", bidData?.summary.not_eligible],
                  ["Won Value ETB", bidData?.summary.won_value],
                  ["Win Rate %", bidData?.summary.win_rate],
                ].map(([l, v]) => (
                  <Card key={String(l)}>
                    <CardContent className="p-4">
                      <div className="text-xs text-neutral-500">{l}</div>
                      <div className="mt-1 break-words text-xl font-bold">
                        {Number(v || 0).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid min-w-0 gap-4 lg:grid-cols-3">
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle>Bids by Status</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={bidData?.by_status}
                          dataKey="count"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={85}
                        >
                          {bidData?.by_status.map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle>Bids by Category</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBar data={bidData?.by_category}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#DDA822" />
                      </RechartsBar>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle>Monthly Bid Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBar data={bidData?.timeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Total" fill="#07324A" />
                        <Bar dataKey="won" name="Won" fill="#2C9664" />
                      </RechartsBar>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Complete Bid Detail</CardTitle>
                  <CardDescription>
                    Values, deadlines, outcomes and number of supporting
                    documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <DataTable
                    columns={bidReportColumns}
                    data={bidData?.bids || []}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
