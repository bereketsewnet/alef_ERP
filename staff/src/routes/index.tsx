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
import { BillingPage } from '@/pages/billing/BillingPage'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

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
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/billing" element={<BillingPage />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}
