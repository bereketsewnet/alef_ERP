# Payroll System Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Payroll Generation Process](#payroll-generation-process)
4. [Salary Calculation Formula](#salary-calculation-formula)
5. [Real-World Examples](#real-world-examples)
6. [Employee Salary History](#employee-salary-history)
7. [Permission-Based Penalties](#permission-based-penalties)
8. [Client-Based Payroll](#client-based-payroll)
9. [Step-by-Step Guide](#step-by-step-guide)

---

## Overview

The Alef ERP Payroll System is a comprehensive solution for calculating employee salaries based on:
- **Base Salary**: Full monthly salary from job configuration
- **Attendance**: Worked days, late arrivals, and absences
- **Penalties**: Late and absent penalties (normal and permission-based)
- **Bonuses**: Manual bonuses added by administrators
- **Deductions**: Tax, pension, asset deductions, and agency fees
- **Client-Based Processing**: Payroll calculated per client, not globally

---

## System Architecture

### Key Components

1. **Payroll Period**: Represents a time period (start date, end date) for payroll calculation
2. **Payroll Item**: Individual employee payroll record for a specific period
3. **Client Association**: Each payroll period is associated with one client
4. **Employee Filtering**: Only employees who worked at client's sites during the period are included

### Database Schema

```
payroll_periods
├── id
├── client_id (FK to clients)
├── start_date
├── end_date
├── status (DRAFT, PROCESSING, COMPLETED)
└── processed_date

payroll_items
├── id
├── payroll_period_id (FK)
├── employee_id (FK)
├── client_id (FK)
├── base_salary
├── bonuses
├── penalties
├── income_tax
├── pension_contribution
├── total_gross
├── total_deductions
├── net_pay
├── worked_days
├── expected_days
├── normal_late_count
├── permission_late_count
├── normal_absent_count
└── permission_absent_count

attendance_logs
├── id
├── employee_id
├── schedule_id
├── clock_in_time
├── clock_out_time
├── flagged_late (boolean)
└── with_permission (boolean) - NEW
```

---

## Payroll Generation Process

### Step 1: Create Payroll Period

1. Navigate to **Payroll** page
2. Click **"Run Payroll"** button
3. Fill in the form:
   - **Client**: Select the client (required)
   - **Start Date**: First day of payroll period
   - **End Date**: Last day of payroll period
4. Click **"Create Period"**

### Step 2: Generate Payroll

1. After creating the period, click **"View Details"** on the period
2. Click **"Generate Payroll"** button
3. System will:
   - Find all employees who worked shifts at the client's sites during the period
   - Calculate salary for each employee
   - Create payroll items

### Step 3: Review and Approve

1. Review the generated payroll items
2. Click **"Approve Payroll"** to finalize
3. Status changes to **COMPLETED**

---

## Salary Calculation Formula

### Base Salary Calculation

```
Base Salary = Job's base_salary (or employee override)
```

**Important**: Base salary is the FULL amount, not prorated. If an employee worked all expected days, they get the full base salary.

### Expected Days Calculation

```
Expected Days = Count of scheduled shifts at client's sites during the period
```

### Worked Days Calculation

```
Worked Days = Count of attendance logs with clock_out_time during the period
```

### Penalty Calculation (Per Occurrence)

#### Late Penalties

For each late arrival:
- If `with_permission = true` AND `permission_late_penalty > 0`:
  - Apply `permission_late_penalty` amount
  - Increment `permission_late_count`
- Else if `late_penalty > 0`:
  - Apply `late_penalty` amount
  - Increment `normal_late_count`
- Else:
  - No penalty applied

#### Absent Penalties

For each expected shift without attendance log:
- Check if there's a penalty record with "permission" in reason
- If permission absent AND `permission_absent_penalty > 0`:
  - Apply `permission_absent_penalty` amount
  - Increment `permission_absent_count`
- Else if `absent_penalty > 0`:
  - Apply `absent_penalty` amount
  - Increment `normal_absent_count`
- Else:
  - No penalty applied

### Bonuses

```
Total Bonuses = Sum of all bonuses from bonuses table for the period
```

### Overtime

```
Overtime Hours = 0
Overtime Pay = 0
```

**Note**: Overtime is NOT automatically calculated. If overtime pay is needed, add it manually via the Bonuses section.

### Tax Calculation

```
Taxable Income = Total Gross - Non-taxable Allowance (default: 600 ETB)

Income Tax = Taxable Income × Tax Percent (from job settings)
OR
Income Tax = Calculated using Ethiopian tax brackets (if tax_percent not set)
```

### Pension

```
Employee Pension = Total Gross × 7%
Employer Pension = Total Gross × 11%
```

### Total Gross

```
Total Gross = Base Salary + Bonuses
```

### Total Deductions

```
Total Deductions = Income Tax + Employee Pension + Penalties + Asset Deductions + Agency Fees
```

### Net Pay

```
Net Pay = Total Gross - Total Deductions
```

---

## Real-World Examples

### Example 1: Employee with Perfect Attendance

**Employee**: John Doe
**Job**: Security Guard
**Base Salary**: 5,000 ETB/month
**Late Penalty**: 100 ETB
**Absent Penalty**: 500 ETB
**Tax Percent**: 10%

**Period**: January 1-31, 2026
**Client**: ABC Corporation

**Attendance**:
- Expected Days: 30
- Worked Days: 30
- Late Count: 0
- Absent Count: 0

**Bonuses**: 0 ETB
**Manual Penalties**: 0 ETB

**Calculation**:
```
Base Salary = 5,000 ETB
Bonuses = 0 ETB
Total Gross = 5,000 ETB

Penalties = 0 ETB (no late/absent occurrences)
Taxable Income = 5,000 - 600 = 4,400 ETB
Income Tax = 4,400 × 10% = 440 ETB
Pension (Employee) = 5,000 × 7% = 350 ETB
Asset Deductions = 0 ETB
Agency Fees = 0 ETB

Total Deductions = 440 + 350 + 0 + 0 + 0 = 790 ETB
Net Pay = 5,000 - 790 = 4,210 ETB
```

---

### Example 2: Employee with Late Arrivals

**Employee**: Jane Smith
**Job**: Security Guard
**Base Salary**: 5,000 ETB/month
**Late Penalty**: 100 ETB
**Permission Late Penalty**: 50 ETB
**Absent Penalty**: 500 ETB
**Tax Percent**: 10%

**Period**: January 1-31, 2026
**Client**: ABC Corporation

**Attendance**:
- Expected Days: 30
- Worked Days: 30
- Late Count: 4 occurrences
  - Normal Late: 3 (without permission)
  - Permission Late: 1 (with permission)
- Absent Count: 0

**Bonuses**: 200 ETB (performance bonus)
**Manual Penalties**: 0 ETB

**Calculation**:
```
Base Salary = 5,000 ETB
Bonuses = 200 ETB
Total Gross = 5,200 ETB

Normal Late Penalties = 3 × 100 = 300 ETB
Permission Late Penalties = 1 × 50 = 50 ETB
Total Penalties = 350 ETB

Taxable Income = 5,200 - 600 = 4,600 ETB
Income Tax = 4,600 × 10% = 460 ETB
Pension (Employee) = 5,200 × 7% = 364 ETB
Asset Deductions = 0 ETB
Agency Fees = 0 ETB

Total Deductions = 460 + 364 + 350 + 0 + 0 = 1,174 ETB
Net Pay = 5,200 - 1,174 = 4,026 ETB
```

---

### Example 3: Employee with Absences

**Employee**: Mike Johnson
**Job**: Security Guard
**Base Salary**: 5,000 ETB/month
**Late Penalty**: 100 ETB
**Absent Penalty**: 500 ETB
**Permission Absent Penalty**: 200 ETB
**Tax Percent**: 10%

**Period**: January 1-31, 2026
**Client**: ABC Corporation

**Attendance**:
- Expected Days: 30
- Worked Days: 28
- Late Count: 2 occurrences (both normal)
- Absent Count: 2 occurrences
  - Normal Absent: 1 (no permission)
  - Permission Absent: 1 (with permission - marked in penalty record)

**Bonuses**: 0 ETB
**Manual Penalties**: 0 ETB

**Calculation**:
```
Base Salary = 5,000 ETB (FULL amount, not prorated)
Bonuses = 0 ETB
Total Gross = 5,000 ETB

Normal Late Penalties = 2 × 100 = 200 ETB
Normal Absent Penalties = 1 × 500 = 500 ETB
Permission Absent Penalties = 1 × 200 = 200 ETB
Total Penalties = 900 ETB

Taxable Income = 5,000 - 600 = 4,400 ETB
Income Tax = 4,400 × 10% = 440 ETB
Pension (Employee) = 5,000 × 7% = 350 ETB
Asset Deductions = 0 ETB
Agency Fees = 0 ETB

Total Deductions = 440 + 350 + 900 + 0 + 0 = 1,690 ETB
Net Pay = 5,000 - 1,690 = 3,310 ETB
```

---

### Example 4: Employee with Manual Bonuses and Penalties

**Employee**: Sarah Wilson
**Job**: Security Guard
**Base Salary**: 5,000 ETB/month
**Late Penalty**: 100 ETB
**Absent Penalty**: 500 ETB
**Tax Percent**: 10%

**Period**: January 1-31, 2026
**Client**: ABC Corporation

**Attendance**:
- Expected Days: 30
- Worked Days: 30
- Late Count: 0
- Absent Count: 0

**Bonuses**: 
- Performance Bonus: 500 ETB
- Overtime Bonus: 300 ETB (manually added)
- Total: 800 ETB

**Manual Penalties**:
- Uniform Damage: 200 ETB
- Total: 200 ETB

**Calculation**:
```
Base Salary = 5,000 ETB
Bonuses = 800 ETB
Total Gross = 5,800 ETB

Attendance Penalties = 0 ETB (no late/absent)
Manual Penalties = 200 ETB
Total Penalties = 200 ETB

Taxable Income = 5,800 - 600 = 5,200 ETB
Income Tax = 5,200 × 10% = 520 ETB
Pension (Employee) = 5,800 × 7% = 406 ETB
Asset Deductions = 0 ETB
Agency Fees = 0 ETB

Total Deductions = 520 + 406 + 200 + 0 + 0 = 1,126 ETB
Net Pay = 5,800 - 1,126 = 4,674 ETB
```

---

## Employee Salary History

### Accessing Salary History

1. Navigate to **Employees** page
2. Click the **Dollar Sign (₦)** icon next to an employee (or click **Eye** icon and go to **Salary** tab)
3. View the salary history table

### Salary History Features

#### History Table

The history table shows:
- **Period**: Month and year
- **Client**: Client name for this payroll
- **Base Salary**: Base salary amount
- **Bonuses**: Total bonuses
- **Deductions**: Total deductions
- **Net Pay**: Final amount paid
- **Status**: DRAFT, APPROVED, etc.

#### Detailed Breakdown

Click **"View Details"** on any period to see:

1. **Salary Summary**
   - Period dates
   - Client name
   - Expected days vs Worked days

2. **Earnings**
   - Base Salary
   - Bonuses (with breakdown)
   - Total Gross

3. **Deductions**
   - Income Tax
   - Pension Contribution
   - Penalties (with breakdown)
   - Asset Deductions
   - Total Deductions

4. **Net Pay**
   - Final amount

5. **Attendance Details**
   - Normal Late Count
   - Permission Late Count
   - Normal Absent Count
   - Permission Absent Count

6. **Bonuses List**
   - All bonuses with dates and reasons

7. **Penalties List**
   - All manual penalties with dates and reasons

### Example: Viewing Salary History

**Employee**: John Doe

**History Table**:
```
Period        | Client        | Base Salary | Bonuses | Deductions | Net Pay
Jan 2026      | ABC Corp      | 5,000 ETB   | 200 ETB | 790 ETB    | 4,410 ETB
Dec 2025      | ABC Corp      | 5,000 ETB   | 0 ETB   | 790 ETB    | 4,210 ETB
Nov 2025      | XYZ Ltd       | 5,000 ETB   | 500 ETB | 1,290 ETB  | 4,210 ETB
```

Clicking "View Details" on Jan 2026 shows:
- Worked all 30 days
- 2 late arrivals (1 with permission)
- 1 performance bonus of 200 ETB
- Full breakdown of all calculations

---

## Permission-Based Penalties

### Marking Attendance with Permission

#### For Late Arrivals

1. Navigate to **Attendance** page
2. Find the attendance log for the late arrival
3. Click **"Mark Permission"** button (or use API endpoint)
4. The `with_permission` flag is toggled

#### For Absences

1. Navigate to **Payroll** → **Penalties** tab
2. Create a new penalty:
   - Type: **ABSENT**
   - Date: Date of absence
   - Reason: Include "permission" or "with permission" in the reason
   - Amount: Will use `permission_absent_penalty` if reason contains "permission"

### Permission Penalty Configuration

#### At Job Level

1. Navigate to **Jobs** page
2. Edit a job
3. Set:
   - **Permission Late Penalty**: Default 0 ETB
   - **Permission Absent Penalty**: Default 0 ETB

#### At Employee Level (Override)

1. Navigate to **Employees** page
2. Click **Eye** icon → **Jobs & Pay** tab
3. Click **"Override Settings"** for a job
4. Set:
   - **Override Permission Late Penalty**: Custom amount
   - **Override Permission Absent Penalty**: Custom amount

### Example: Permission Penalties

**Scenario**: Employee arrives late 3 times in a month:
- 2 times without permission
- 1 time with permission (sick leave with doctor's note)

**Job Settings**:
- Late Penalty: 100 ETB
- Permission Late Penalty: 30 ETB

**Calculation**:
```
Normal Late Penalties = 2 × 100 = 200 ETB
Permission Late Penalties = 1 × 30 = 30 ETB
Total Late Penalties = 230 ETB
```

---

## Client-Based Payroll

### Why Client-Based?

Each client may have different:
- Pay rates
- Working schedules
- Site locations
- Employee assignments

### How It Works

1. **Create Payroll Period** with a specific client
2. System finds all employees who:
   - Worked shifts at the client's sites during the period
   - OR are currently assigned to the client's sites
3. Calculate payroll only for those employees
4. Each payroll item is tagged with the client_id

### Example: Multiple Clients

**Scenario**: Your company works with 3 clients:
- ABC Corporation (10 employees)
- XYZ Ltd (5 employees)
- DEF Inc (8 employees)

**Process**:
1. Create payroll period for **ABC Corporation** (Jan 1-31)
   - Generates payroll for 10 employees
2. Create payroll period for **XYZ Ltd** (Jan 1-31)
   - Generates payroll for 5 employees
3. Create payroll period for **DEF Inc** (Jan 1-31)
   - Generates payroll for 8 employees

**Result**: 3 separate payroll periods, each with its own employees and calculations.

---

## Step-by-Step Guide

### Complete Payroll Generation Workflow

#### Step 1: Configure Jobs

1. Go to **Jobs** page
2. Create/edit job with:
   - Base Salary: 5,000 ETB
   - Late Penalty: 100 ETB
   - Permission Late Penalty: 50 ETB
   - Absent Penalty: 500 ETB
   - Permission Absent Penalty: 200 ETB
   - Tax Percent: 10%

#### Step 2: Assign Employees to Jobs

1. Go to **Employees** page
2. Click **Eye** icon → **Jobs & Pay** tab
3. Assign job to employee
4. Optionally set employee-specific overrides

#### Step 3: Create Shifts

1. Go to **Roster** page
2. Create shifts for employees at client sites
3. Use **Advanced Working Days Schedule** if needed

#### Step 4: Record Attendance

1. Employees clock in/out via mobile app
2. Or manually verify attendance logs
3. Mark late arrivals with permission if applicable

#### Step 5: Add Bonuses/Penalties (Optional)

1. Go to **Payroll** → **Bonuses** tab
2. Add bonuses for specific employees
3. Go to **Payroll** → **Penalties** tab
4. Add manual penalties if needed

#### Step 6: Generate Payroll

1. Go to **Payroll** page
2. Click **"Run Payroll"**
3. Select:
   - **Client**: ABC Corporation
   - **Start Date**: 2026-01-01
   - **End Date**: 2026-01-31
4. Click **"Create Period"**
5. Click **"View Details"** on the new period
6. Click **"Generate Payroll"**
7. Review the generated items
8. Click **"Approve Payroll"**

#### Step 7: View Employee Salary History

1. Go to **Employees** page
2. Click **Dollar Sign (₦)** icon next to employee
3. View salary history table
4. Click **"View Details"** on any period for full breakdown

---

## Important Notes

### Base Salary

- **Always full amount**, never prorated
- Even if employee worked fewer days, base salary remains the same
- Penalties reduce the net pay, not the base salary

### Penalties

- Applied **per occurrence**, not per day
- If employee is late 4 times, penalty is applied 4 times
- If penalty amount is 0, no deduction is made
- Permission penalties are lower than normal penalties

### Overtime

- **NOT automatically calculated**
- If overtime pay is needed, add it manually as a bonus
- Base salary remains unchanged

### Client Filtering

- Payroll is calculated **one client at a time**
- Employees must have worked at client's sites during the period
- Each payroll period belongs to one client

### Employee Overrides

- Employee-specific overrides take precedence over job defaults
- Can override: base salary, penalties, tax percent, etc.
- Useful for special cases or promotions

---

## Troubleshooting

### Issue: Employee not appearing in payroll

**Solution**: 
- Check if employee worked shifts at client's sites during the period
- Verify employee has an assigned job with base salary

### Issue: Penalties not calculated correctly

**Solution**:
- Check if penalty amounts are set (> 0) in job configuration
- Verify attendance logs are marked correctly (with_permission flag)
- Check if expected shifts match actual attendance

### Issue: Base salary seems wrong

**Solution**:
- Base salary is always the full amount from job configuration
- Check employee overrides if different amount expected
- Penalties reduce net pay, not base salary

### Issue: Can't see salary history

**Solution**:
- Click the **Dollar Sign (₦)** icon in the employee list
- Or click **Eye** icon and go to **Salary** tab
- Ensure payroll has been generated for the employee

---

## API Endpoints

### Payroll Periods

- `POST /api/payroll/periods` - Create period (requires client_id)
- `GET /api/payroll/periods` - List periods
- `GET /api/payroll/periods/{id}` - Get period details
- `POST /api/payroll/periods/{id}/generate` - Generate payroll

### Employee Salary

- `GET /api/employees/{id}/salary?period_id={period_id}` - Get salary details
- `GET /api/employees/{id}/salary/history?start_date={date}&end_date={date}` - Get history

### Attendance Permission

- `POST /api/attendance/{id}/mark-permission` - Toggle with_permission flag

---

## Summary

The Alef ERP Payroll System provides:
- ✅ Client-based payroll calculation
- ✅ Full base salary (no proration)
- ✅ Per-occurrence penalty calculation
- ✅ Permission-based penalty tracking
- ✅ Manual bonus/penalty support
- ✅ Detailed salary history for employees
- ✅ Comprehensive breakdown of all calculations

For questions or issues, refer to this documentation or contact system administrator.

