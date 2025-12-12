import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { EmployeeListPage } from '@/pages/employees/EmployeeListPage'
import { AttendanceLogsPage } from '@/pages/attendance/AttendanceLogsPage'
import { RosterPage } from '@/pages/roster/RosterPage'
import { ClientListPage } from '@/pages/clients/ClientListPage'
import { AssetListPage } from '@/pages/assets/AssetListPage'
import { PayrollPage } from '@/pages/payroll/PayrollPage'
import { PayrollSettingsPage } from '@/pages/payroll/PayrollSettingsPage'
import { BillingPage } from '@/pages/billing/BillingPage'
import { UserManagementPage } from '@/pages/settings/UserManagementPage'
import { JobsPage } from '@/pages/jobs/JobsPage'
import { JobCategoriesPage } from '@/pages/jobs/JobCategoriesPage'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

import { IncidentsPage } from '@/pages/incidents/IncidentsPage'
import { ReportsPage } from '@/pages/reports/ReportsPage'

export function AppRoutes() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected routes with AppShell layout */}
            <Route
                element={
                    <ProtectedRoute>
                        <AppShell />
                    </ProtectedRoute>
                }
            >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/roster" element={<RosterPage />} />
                <Route path="/employees" element={<EmployeeListPage />} />
                <Route path="/attendance" element={<AttendanceLogsPage />} />
                <Route path="/clients" element={<ClientListPage />} />
                <Route path="/assets" element={<AssetListPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/jobs/categories" element={<JobCategoriesPage />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/payroll/settings" element={<PayrollSettingsPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/incidents" element={<IncidentsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings/users" element={<UserManagementPage />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}
