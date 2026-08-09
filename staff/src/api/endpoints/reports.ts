import apiClient from "@/api/axios";

export interface ReportDashboardStats {
  // Dashboard KPIs
  active_employees: number;
  employee_growth: number;
  attendance_today: number;
  attendance_rate: number;
  attendance_growth: number;
  open_incidents: number;
  incident_change: number;
  total_assets: number;
  assets_in_use_percent: number;
  assigned_assets: number;
  attendance_trend: Array<{
    date: string;
    clockIns: number;
    clockOuts: number;
  }>;
  active_clock_ins: Array<{
    id: number;
    employee_name: string;
    site_name: string;
    latitude: number | null;
    longitude: number | null;
    clock_in_time: string;
  }>;
  asset_categories: Array<{
    category: string;
    total: number;
    assigned: number;
    available: number;
  }>;
  // Legacy fields for reports
  attendance: { status: string; count: number }[];
  finance: { total_billed: number; total_paid: number; total_overdue: number };
  incidents: { severity_level: string; count: number }[];
  roster: { status: string; count: number }[];
}

export interface ReportParams {
  start_date?: string;
  end_date?: string;
  status?: string;
  page?: number;
  client_id?: number;
  site_id?: number;
  payment_status?: string;
  category_id?: number;
}

export interface CrmReportData {
  summary: Record<string, number>;
  lead_stages: Array<{ name: string; count: number; value: number }>;
  contract_statuses: Array<{ name: string; count: number }>;
  issue_statuses: Array<{ name: string; count: number }>;
  leads: any[];
  contracts: any[];
  issues: any[];
}
export interface BidReportData {
  summary: Record<string, number>;
  by_status: Array<{ name: string; count: number; value: number }>;
  by_category: Array<{ name: string; count: number; value: number }>;
  timeline: Array<{ name: string; count: number; won: number }>;
  bids: any[];
}

export interface ClientSiteReportData {
  summary: {
    clients: number;
    sites: number;
    employees: number;
    field_staff: number;
    total_billed: number;
    paid: number;
    due: number;
    overdue: number;
    verified: number;
    on_time: number;
    paid_late: number;
  };
  payment_status: Array<{ name: string; count: number }>;
  staff_by_site: Array<{
    site_id: number;
    client_id: number;
    company: string;
    site: string;
    employees: number;
    field_staff: number;
    total_staff: number;
    gps_radius: number;
  }>;
  clients: Array<{
    client_id: number;
    company: string;
    sites: number;
    contact: string;
    phone: string;
    email: string;
    billing_cycle: string;
    invoices: number;
    total_billed: number;
    paid: number;
    verified: number;
    on_time: number;
    paid_late: number;
    overdue: number;
    next_due_date: string | null;
  }>;
  invoices: Array<{
    id: number;
    invoice_number: string;
    company: string;
    invoice_date: string;
    due_date: string;
    payment_date: string | null;
    amount: number;
    status: string;
    verified: boolean;
    on_time: boolean;
    paid_late: boolean;
    overdue: boolean;
  }>;
}

export interface AssetReportData {
  summary: {
    total: number;
    available: number;
    assigned: number;
    total_value: number;
    history_records: number;
  };
  by_company: Array<{ name: string; count: number }>;
  by_category: Array<{ name: string; count: number }>;
  by_status: Array<{ name: string; count: number }>;
  inventory: Array<{
    id: number;
    asset_code: string;
    name: string;
    company: string;
    site: string;
    category: string;
    condition: string;
    status: string;
    value: number;
    current_employee: string | null;
    created_at: string;
  }>;
  history: Array<{
    id: number;
    asset_code: string;
    asset_name: string;
    company: string;
    category: string;
    employee: string;
    assigned_at: string;
    returned_at: string | null;
    return_condition: string | null;
    notes: string | null;
  }>;
}

export const reportsApi = {
  getDashboardStats: (params?: ReportParams) =>
    apiClient.get<ReportDashboardStats>("/reports/dashboard", { params }),

  getAttendanceReport: (params?: ReportParams) =>
    apiClient.get("/reports/attendance", { params }),

  getFinanceReport: (params?: ReportParams) =>
    apiClient.get("/reports/finance", { params }),

  getIncidentsReport: (params?: ReportParams) =>
    apiClient.get("/reports/incidents", { params }),

  getRosterReport: (params?: ReportParams) =>
    apiClient.get("/reports/roster", { params }),

  getAssetReport: (params?: ReportParams) =>
    apiClient.get<AssetReportData>("/reports/assets", { params }),

  getClientSiteReport: (params?: ReportParams) =>
    apiClient.get<ClientSiteReportData>("/reports/clients-sites", { params }),

  getCrmReport: (params?: ReportParams) =>
    apiClient.get<CrmReportData>("/reports/crm", { params }),
  getBidReport: (params?: ReportParams) =>
    apiClient.get<BidReportData>("/reports/bids", { params }),

  exportReport: (
    type: string,
    format: "pdf" | "excel" | "csv",
    params: ReportParams,
  ) =>
    apiClient.get(`/reports/export/${type}`, {
      params: { ...params, format },
      responseType: "blob",
    }),
};
