# ALEF ERP – Default Accounts & Roles

This document lists all default **admin/office** accounts and their roles. Only these roles can access the **Admin Panel** (staff app). Field staff use the **Member Portal**.

---

## Roles & Access

| Role | Description | Admin panel access |
|------|-------------|--------------------|
| **OWNER** | Super Admin – full system access | All modules + User & role management |
| **GM** | General Manager (admin) | All modules + User & role management |
| **HR** | Human Resources | Vacancy, recruitment, attendance approval, roster, employees |
| **FINANCE** | Finance | Expenses, billing, payroll, reports |
| **OPERATIONS** | Operations | Employee assignment to clients, follow-up, attendance, shift, allocation, incidents, reports |
| **MARKETING** | Marketing | CRM leads, bids |
| **PROCUREMENT** | Procurement | Assets (fuel, uniform, office rental, car rental, utility – as implemented) |
| **FIELD_STAFF** | Field staff | Member portal only (no admin panel) |

---

## Default Admin Accounts

Created by `AdminSeeder`. Use **username** or **email** to log in.

| Role | Username | Email | Password |
|------|----------|-------|----------|
| **Owner** | `owner` | `owner@alefdelta.com` | `owner123` |
| **GM** | `gm` | `gm@alefdelta.com` | `gm123` |
| **HR** | `hr` | `hr@alefdelta.com` | `hr123` |
| **Finance** | `finance` | `finance@alefdelta.com` | `finance123` |
| **Operations** | `operations` | `operations@alefdelta.com` | `operations123` |
| **Marketing** | `marketing` | `marketing@alefdelta.com` | `marketing123` |
| **Procurement** | `procurement` | `procurement@alefdelta.com` | `procurement123` |

**Legacy:** If you had an existing `admin@alefdelta.com` account, it is updated to role **OWNER** and password `owner123` when you run the seeders.

---

## What Each Role Sees in the Admin Panel

- **OWNER / GM:** Dashboard, Jobs, Vacancies, Job Applications, CRM Leads, Bids, Roster, Employees, Attendance, Clients & Sites, Assets, Payroll, Billing, Incidents, Reports, **User & role management**.
- **HR:** Dashboard, Vacancies, Job Applications, Roster, Employees, Attendance, Reports.
- **FINANCE:** Dashboard, Payroll, Billing, Reports.
- **OPERATIONS:** Dashboard, Jobs, Roster, Employees, Attendance, Clients & Sites, Assets, Incidents, Reports.
- **MARKETING:** Dashboard, CRM Leads, Bids.
- **PROCUREMENT:** Dashboard, Assets (and future: fuel, uniform, office rental, car rental, utility as added).

Only **OWNER** and **GM** can open **User & role management** (`/settings/users`). All admin roles can access **Profile** via the top bar.

---

## Quick Reference

**Super Admin (Owner):**
- Login: `owner` or `owner@alefdelta.com`
- Password: `owner123`

**GM:**
- Login: `gm` or `gm@alefdelta.com`
- Password: `gm123`

**HR:**
- Login: `hr` or `hr@alefdelta.com`
- Password: `hr123`

**Finance:**
- Login: `finance` or `finance@alefdelta.com`
- Password: `finance123`

**Operations:**
- Login: `operations` or `operations@alefdelta.com`
- Password: `operations123`

**Marketing:**
- Login: `marketing` or `marketing@alefdelta.com`
- Password: `marketing123`

**Procurement:**
- Login: `procurement` or `procurement@alefdelta.com`
- Password: `procurement123`

---

## Login Instructions

### API

```http
POST /api/auth/login
Content-Type: application/json

{
  "login": "owner",
  "password": "owner123"
}
```

`login` can be **username**, **email**, or **phone number** (if set).

### Admin Panel (Staff App)

1. Open: `http://<host>:5176/login` (or your staff app URL).
2. Enter **username** or **email** and **password**.
3. After login, only menu items and pages allowed for your role are shown; direct URL access to other pages returns “Access denied”.

---

## Role ↔ Task Mapping (Summary)

| Task / Module | Roles |
|---------------|--------|
| User & role management | OWNER, GM |
| Dashboard | All admin roles |
| Jobs, Job categories | OWNER, GM, HR, OPERATIONS |
| Vacancies, Job applications | OWNER, GM, HR |
| CRM Leads, Bids | OWNER, GM, MARKETING |
| Roster | OWNER, GM, HR, OPERATIONS |
| Employees | OWNER, GM, HR, OPERATIONS |
| Attendance | OWNER, GM, HR, OPERATIONS |
| Clients & Sites | OWNER, GM, OPERATIONS |
| Assets | OWNER, GM, OPERATIONS, PROCUREMENT |
| Payroll | OWNER, GM, FINANCE |
| Billing | OWNER, GM, FINANCE |
| Incidents | OWNER, GM, OPERATIONS |
| Reports | OWNER, GM, HR, FINANCE, OPERATIONS |

---

## Sample Employee Accounts (Member Portal)

These are created by `SampleDataSeeder` for testing the **member portal** (clock in/out, schedule, etc.):

| Username | Email | Password | Role |
|----------|-------|----------|------|
| `johndoe` | `john.doe@alefdelta.com` | `password123` | FIELD_STAFF |
| `janesmith` | `jane.smith@alefdelta.com` | `password123` | FIELD_STAFF |
| (others) | … | `password123` | FIELD_STAFF |

Member portal login uses **phone number** (or username/email if configured). Field staff do **not** see the admin panel.

---

## New Employee Default Password

When you create an employee from the admin panel, a user account is created with:

- **Username:** `firstname.lastname` (lowercase)
- **Email:** Provided email or `firstname.lastname@alefdelta.com`
- **Password:** `EMPLOYEE_CODE-LAST4PHONE` (e.g. `EMP00001-4567`)
- **Role:** `FIELD_STAFF`

---

## Security Notes

- Default accounts are for **development/testing**. Change passwords in production.
- Only **OWNER** and **GM** can create/edit users and assign roles (User & role management).
- Restrict or remove default accounts in production and use strong, unique passwords.

---

## Resetting Accounts

Re-run the admin seeder (creates/updates the 7 role accounts and legacy admin):

```bash
docker-compose exec backend php artisan db:seed --class=AdminSeeder --force
```

Run migration first if you changed role enum:

```bash
docker-compose exec backend php artisan migrate --force
```

Full reset:

```bash
docker-compose exec backend php artisan migrate:fresh --seed --force
```

---

## All Accounts Summary

### Admin / office (7 default + legacy)

1. `owner` / `owner@alefdelta.com` / `owner123` (OWNER)
2. `gm` / `gm@alefdelta.com` / `gm123` (GM)
3. `hr` / `hr@alefdelta.com` / `hr123` (HR)
4. `finance` / `finance@alefdelta.com` / `finance123` (FINANCE)
5. `operations` / `operations@alefdelta.com` / `operations123` (OPERATIONS)
6. `marketing` / `marketing@alefdelta.com` / `marketing123` (MARKETING)
7. `procurement` / `procurement@alefdelta.com` / `procurement123` (PROCUREMENT)

Legacy: `admin@alefdelta.com` is updated to OWNER with password `owner123` when seeders run.

### Field staff (sample)

- 5 sample employees (see Sample Employee Accounts); default password `password123` for testing.

---

**Last updated:** February 2026  
**Version:** 2.0 (roles: Owner, GM, HR, Finance, Operations, Marketing, Procurement, Field Staff)
