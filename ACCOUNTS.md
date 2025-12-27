# ALEF ERP - Default Accounts & Passwords

This document lists all default accounts created when seeding the database.

---

## 🔐 Admin Accounts

These accounts have administrative privileges and are created by `AdminSeeder`.

| Role | Username | Email | Password | Description |
|------|----------|-------|----------|-------------|
| **Super Admin** | `admin` | `admin@alefdelta.com` | `admin123` | Full system administrator with all permissions |
| **HR Manager** | `hr_manager` | `hr@alefdelta.com` | `hr123` | Human Resources manager with employee management access |
| **Finance** | `finance` | `finance@alefdelta.com` | `finance123` | Finance manager with payroll and billing access |

---

## 👥 Sample Employee Accounts

These accounts are created by `SampleDataSeeder` for testing purposes.

| Username | Email | Phone | Password | Role | Employee Code |
|----------|-------|-------|----------|------|---------------|
| `johndoe` | `john.doe@alefdelta.com` | `+251911234567` | `password123` | FIELD_STAFF | EMP001 |
| `janesmith` | `jane.smith@alefdelta.com` | `+251922345678` | `password123` | FIELD_STAFF | EMP002 |
| `michaelt` | `michael.tesfaye@alefdelta.com` | `+251933456789` | `password123` | FIELD_STAFF | EMP003 |
| `sarah` | `sara.hailu@alefdelta.com` | `+251944567890` | `password123` | FIELD_STAFF | EMP004 |
| `danielk` | `daniel.kebede@alefdelta.com` | `+251955678901` | `password123` | FIELD_STAFF | EMP005 |

### Member Portal Login

The **Member Portal** (`http://localhost:7070`) uses **phone number** for login:

**Example credentials:**
- **Phone:** `+251911234567`
- **Password:** `password123`

You can use any of the employee phone numbers listed above with password `password123`.

---

## 📋 Quick Reference

### Most Common Accounts

**Admin Access:**
- **Login:** `admin` or `admin@alefdelta.com`
- **Password:** `admin123`

**HR Access:**
- **Login:** `hr_manager` or `hr@alefdelta.com`
- **Password:** `hr123`

**Finance Access:**
- **Login:** `finance` or `finance@alefdelta.com`
- **Password:** `finance123`

**Test Employee:**
- **Login:** `johndoe` or `john.doe@alefdelta.com`
- **Password:** `password123`

---

## 🔑 Login Instructions

### Using the API

The login endpoint accepts a `login` field that can be:
- **Username** (e.g., `admin`)
- **Email** (e.g., `admin@alefdelta.com`)
- **Phone number** (if configured)

**Example API Request:**
```json
POST http://localhost:4001/api/auth/login
Content-Type: application/json

{
  "login": "admin",
  "password": "admin123"
}
```

**Or using email:**
```json
{
  "login": "admin@alefdelta.com",
  "password": "admin123"
}
```

### Using the Frontend

1. Navigate to: `http://localhost:5175/login`
2. Enter your **username OR email** in the login field
3. Enter your password
4. Click "Login"

---

## 🛡️ Account Roles & Permissions

### Super Admin
- ✅ Full system access
- ✅ User management
- ✅ All CRUD operations
- ✅ System configuration
- ✅ All modules access

### HR Manager
- ✅ Employee management
- ✅ Job assignments
- ✅ Attendance tracking
- ✅ Roster management
- ✅ Employee records

### Finance
- ✅ Payroll management
- ✅ Invoice creation
- ✅ Financial reports
- ✅ Payment processing
- ✅ Billing management

### Field Staff
- ✅ View own schedule
- ✅ Clock in/out
- ✅ View own attendance
- ✅ View assigned jobs
- ✅ View own profile

---

## ⚠️ Security Notes

**IMPORTANT:** These are default accounts for **development/testing only**!

- 🔒 **Change passwords immediately** in production
- 🚫 **Disable or remove** default accounts in production
- 🔐 Use strong, unique passwords
- 🔑 Enable two-factor authentication if available
- 📊 Regularly audit account access
- 🛡️ Follow security best practices

---

## 🔄 Resetting Accounts

If you need to reset accounts or create new ones, you can:

### Re-seed specific seeder:
```bash
docker-compose exec backend php artisan db:seed --class=AdminSeeder --force
docker-compose exec backend php artisan db:seed --class=SampleDataSeeder --force
```

### Re-seed all accounts:
```bash
docker-compose exec backend php artisan db:seed --class=AdminSeeder --force
docker-compose exec backend php artisan db:seed --class=SampleDataSeeder --force
```

### Reset entire database:
```bash
docker-compose exec backend php artisan migrate:fresh --seed --force
```

---

## 📦 Account Creation

Accounts are automatically created when you run:
- ✅ `start_app.bat` - Automatically seeds all data including accounts
- ✅ `setup_database.bat` - Seeds database with all accounts
- ✅ `seed.bat` - Applies all seeders including account seeders

---

## 🆘 Troubleshooting

If you cannot log in:

1. **Verify the account exists:**
   - Check this file (`ACCOUNTS.md`)
   - Verify in database: `docker-compose exec backend php artisan tinker` then `User::count()`

2. **Check if services are running:**
   ```bash
   docker-compose ps
   ```

3. **Verify database is seeded:**
   ```bash
   docker-compose exec backend php artisan tinker
   # Then run: User::all(['username', 'email'])->toArray();
   ```

4. **Check backend logs:**
   ```bash
   docker-compose logs backend --tail 50
   ```

5. **Re-seed accounts:**
   ```bash
   docker-compose exec backend php artisan db:seed --class=AdminSeeder --force
   ```

---

## 🆕 New Employee Default Password

When you create a new employee through the system, a user account is **automatically created** with:

### Auto-Generated Credentials

- **Username:** `firstname.lastname` (lowercase, e.g., `john.doe`)
- **Email:** Provided email OR `firstname.lastname@alefdelta.com`
- **Password:** `EMPLOYEE_CODE-LAST4PHONE` (e.g., `EMP00001-5678`)

### Password Format

The default password is generated as:
```
[Employee Code]-[Last 4 digits of phone number]
```

**Example:**
- Employee Code: `EMP00001`
- Phone: `+251911234567`
- **Default Password:** `EMP00001-4567`

### Important Notes

- ✅ Password is **automatically generated** - you don't need to set it
- ✅ Login credentials are returned in the API response when creating an employee
- ✅ Share these credentials with the employee securely
- ⚠️ Employee should **change password on first login**
- 📧 Email is auto-generated if not provided: `username@alefdelta.com`

### Example API Response

When you create an employee, the response includes:

```json
{
  "data": {
    "id": 1,
    "employee_code": "EMP00001",
    "first_name": "John",
    "last_name": "Doe",
    ...
  },
  "login_credentials": {
    "username": "john.doe",
    "email": "john.doe@alefdelta.com",
    "password": "EMP00001-4567",
    "message": "Please share these credentials with the employee..."
  }
}
```

---

## 📝 All Accounts Summary

### Admin Accounts (3)
1. `admin` / `admin@alefdelta.com` / `admin123`
2. `hr_manager` / `hr@alefdelta.com` / `hr123`
3. `finance` / `finance@alefdelta.com` / `finance123`

### Employee Accounts (5)
1. `johndoe` / `john.doe@alefdelta.com` / `password123`
2. `janesmith` / `jane.smith@alefdelta.com` / `password123`
3. `michaelt` / `michael.tesfaye@alefdelta.com` / `password123`
4. `sarah` / `sara.hailu@alefdelta.com` / `password123`
5. `danielk` / `daniel.kebede@alefdelta.com` / `password123`

**Total: 8 default accounts**

### New Employees
- **Default Password Format:** `EMPLOYEE_CODE-LAST4PHONE`
- **Example:** `EMP00001-4567`

---

## 📞 Support

For issues with accounts:
- Check backend logs: `docker-compose logs backend`
- Verify database connection: `docker-compose exec backend php artisan tinker`
- Re-run seeders: See "Resetting Accounts" section above

---

**Last Updated:** December 2025  
**Version:** 1.0
