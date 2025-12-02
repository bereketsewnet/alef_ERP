# API Integration Guide

This document provides instructions for connecting the ALEF DELTA ERP Staff Website frontend to your Laravel 12 backend.

## Current Status

All pages are implemented with **mock data**. The API client infrastructure is ready - you just need to:
1. Create endpoint modules for each domain
2. Create React Query hooks
3. Replace mock data with API calls

---

## API Client Setup ✓

Already configured in `src/api/axios.ts`:
- Base URL from `.env` (`VITE_API_URL`)
- JWT token interceptor
- Automatic token refresh on 401
- Error handling

---

## Integration Steps

### 1. Create Endpoint Modules

For each feature, create an API module in `src/api/endpoints/`:

```typescript
// src/api/endpoints/employees.ts
import apiClient from '../axios'
import { Employee, CreateEmployeeRequest, PaginatedResponse } from '@/types/employee.types'

export const employeesApi = {
  list: async (params?: Record<string, any>): Promise<PaginatedResponse<Employee>> => {
    const response = await apiClient.get('/employees', { params })
    return response.data
  },

  get: async (id: number): Promise<Employee> => {
    const response = await apiClient.get(`/employees/${id}`)
    return response.data.data
  },

  create: async (data: CreateEmployeeRequest): Promise<Employee> => {
    const response = await apiClient.post('/employees', data)
    return response.data.data
  },

  update: async (id: number, data: Partial<CreateEmployeeRequest>): Promise<Employee> => {
    const response = await apiClient.put(`/employees/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/employees/${id}`)
  },
}
```

### 2. Create React Query Hooks

Create service hooks in `src/services/`:

```typescript
// src/services/useEmployees.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi } from '@/api/endpoints/employees'
import { toast } from '@/components/ui/use-toast'

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: any) => [...employeeKeys.lists(), filters] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: number) => [...employeeKeys.details(), id] as const,
}

// List employees
export function useEmployees(filters?: Record<string, any>) {
  return useQuery({
    queryKey: employeeKeys.list(filters || {}),
    queryFn: () => employeesApi.list(filters),
  })
}

// Get employee detail
export function useEmployee(id: number) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeesApi.get(id),
    enabled: !!id,
  })
}

// Create employee
export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      toast({
        title: 'Success',
        description: 'Employee created successfully',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create employee',
      })
    },
  })
}

// Similar for update and delete...
```

### 3. Update Pages to Use API Data

Replace mock data in pages:

```typescript
// Before (Mock Data)
const mockEmployees = [...]

// After (API Data)
import { useEmployees } from '@/services/useEmployees'

export function EmployeeListPage() {
  const { data, isLoading, isError } = useEmployees()

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage />

  const employees = data?.data || []

  return (
    <DataTable columns={columns} data={employees} />
  )
}
```

---

## Feature-by-Feature Integration Checklist

### ✅ Authentication (Already Done)
- [x] Login
- [x] Logout
- [x] Refresh token
- [x] Get current user
- [x] Forgot password

### 📋 Employees
- [ ] GET `/api/employees` - List with pagination/filters
- [ ] GET `/api/employees/:id` - Get single employee
- [ ] POST `/api/employees` - Create employee
- [ ] PUT `/api/employees/:id` - Update employee
- [ ] DELETE `/api/employees/:id` - Delete/terminate
- [ ] POST `/api/employees/:id/telegram` - Link Telegram
- [ ] POST `/api/employees/:id/documents` - Upload document

### 📋 Attendance
- [ ] GET `/api/attendance` - List logs with filters
- [ ] GET `/api/attendance/:id` - Get single log
- [ ] POST `/api/attendance/:id/verify` - Manual verify
- [ ] GET `/api/attendance/export` - Export CSV

### 📋 Roster
- [ ] GET `/api/roster/shifts` - Get shifts for date range
- [ ] POST `/api/roster/shifts` - Create shift
- [ ] PUT `/api/roster/shifts/:id` - Update shift
- [ ] DELETE `/api/roster/shifts/:id` - Delete shift
- [ ] POST `/api/roster/bulk-assign` - Bulk assign shifts
- [ ] GET `/api/roster/conflicts` - Check conflicts

### 📋 Clients & Sites
- [ ] GET `/api/clients` - List clients
- [ ] GET `/api/clients/:id` - Get client detail
- [ ] POST `/api/clients` - Create client
- [ ] GET `/api/sites` - List sites
- [ ] POST `/api/sites` - Create site
- [ ] PUT `/api/sites/:id` - Update site (GPS, radius)
- [ ] POST `/api/sites/:id/test-gps` - Test GPS point

### 📋 Assets
- [ ] GET `/api/assets` - List assets
- [ ] GET `/api/assets/:id` - Get asset detail
- [ ] POST `/api/assets` - Create asset
- [ ] POST `/api/assets/:id/assign` - Assign to employee
- [ ] POST `/api/assets/:id/return` - Return asset
- [ ] GET `/api/assets/reports/unreturned` - Unreturned assets

### 📋 Payroll
- [ ] POST `/api/payroll/calculate` - Calculate payroll for period
- [ ] GET `/api/payroll/preview/:period` - Get preview
- [ ] POST `/api/payroll/run` - Run payroll (background job)
- [ ] GET `/api/payroll/history` - List payroll runs
- [ ] GET `/api/payroll/payslip/:id/pdf` - Download PDF
- [ ] POST `/api/payroll/adjustments` - Add manual adjustment

### 📋 Billing
- [ ] GET `/api/invoices` - List invoices
- [ ] GET `/api/invoices/:id` - Get invoice detail
- [ ] POST `/api/invoices/generate` - Generate invoice
- [ ] GET `/api/invoices/:id/pdf` - Download PDF
- [ ] POST `/api/invoices/:id/mark-paid` - Mark as paid

### 📋 Dashboard
- [ ] GET `/api/dashboard/stats` - KPI statistics
- [ ] GET `/api/dashboard/attendance-trend` - 7-day trend
- [ ] GET `/api/dashboard/activity-feed` - Recent activities
- [ ] GET `/api/dashboard/live-map` - Active clock-ins with GPS

---

## Environment Variables

Update your `.env` file:

```bash
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=ALEF DELTA ERP
```

For production:

```bash
VITE_API_URL=https://your-domain.com/api
VITE_APP_NAME=ALEF DELTA ERP
```

---

## Error Handling

The API client automatically handles:
- 401 Unauthorized → Token refresh → Retry
- 403 Forbidden → Show access denied page
- Network errors → Show error toast
- Validation errors → Display in forms

Custom error handling in hooks:

```typescript
const { mutate } = useCreateEmployee()

mutate(data, {
  onSuccess: () => {
    // Success handling
  },
  onError: (error) => {
    // Custom error handling
    console.error(error)
  },
})
```

---

## Testing API Integration

1. **Start Laravel backend**: `php artisan serve`
2. **Start frontend dev server**: `npm run dev`
3. **Test authentication**: Login with valid credentials
4. **Check network tab**: Verify API calls are being made
5. **Inspect responses**: Ensure data structure matches types

---

## Common Issues

### CORS Errors
Add to Laravel `config/cors.php`:

```php
'paths' => ['api/*'],
'allowed_origins' => ['http://localhost:5173'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

### Token Not Sent
Check that JWT token is in localStorage:
```javascript
console.log(localStorage.getItem('auth_token'))
```

### Data Structure Mismatch
Update TypeScript interfaces in `/src/types/` to match backend responses.

---

## Next Steps

1. Review your Laravel backend API endpoints
2. Start with **Authentication** (already done)
3. Move to **Dashboard** (simple, verifies connection)
4. Then **Employees** → **Attendance** → **Roster**
5. Finally **Clients**, **Assets**, **Payroll**, **Billing**

**Estimated Time**: 2-3 days for full integration

---

**Questions?** Refer to:
- `src/api/axios.ts` - API client configuration
- `src/services/useAuth.ts` - Example of complete hooks
- `src/types/` - TypeScript interfaces
