<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Permissions
        $permissions = [
            // Employee Management
            'view_employees',
            'create_employees',
            'edit_employees',
            'delete_employees',
            
            // Attendance
            'view_attendance',
            'create_attendance',
            'verify_attendance',
            
            // Roster/Scheduling
            'view_roster',
            'create_roster',
            'edit_roster',
            'delete_roster',
            
            // Clients & Sites
            'view_clients',
            'create_clients',
            'edit_clients',
            'delete_clients',
            
            // Assets
            'view_assets',
            'create_assets',
            'assign_assets',
            'return_assets',
            
            // Finance
            'view_payroll',
            'generate_payroll',
            'view_invoices',
            'create_invoices',
            
            // Reports
            'view_reports',
            'create_reports',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create Roles and Assign Permissions

        // Super Admin
        $superAdmin = Role::firstOrCreate(['name' => 'SUPER_ADMIN', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());

        // Operations Manager
        $opsManager = Role::firstOrCreate(['name' => 'OPS_MANAGER', 'guard_name' => 'web']);
        $opsManager->syncPermissions([
            'view_employees', 'create_employees', 'edit_employees',
            'view_attendance', 'verify_attendance',
            'view_roster', 'create_roster', 'edit_roster', 'delete_roster',
            'view_clients', 'view_assets', 'assign_assets',
            'view_reports', 'create_reports',
        ]);

        // HR Manager
        $hrManager = Role::firstOrCreate(['name' => 'HR_MANAGER', 'guard_name' => 'web']);
        $hrManager->syncPermissions([
            'view_employees', 'create_employees', 'edit_employees', 'delete_employees',
            'view_attendance', 'view_roster',
            'view_payroll', 'generate_payroll',
            'view_reports',
        ]);

        // Finance
        $finance = Role::firstOrCreate(['name' => 'FINANCE', 'guard_name' => 'web']);
        $finance->syncPermissions([
            'view_employees', 'view_attendance',
            'view_payroll', 'generate_payroll',
            'view_invoices', 'create_invoices',
            'view_reports',
        ]);

        // Site Supervisor
        $siteSupervisor = Role::firstOrCreate(['name' => 'SITE_SUPERVISOR', 'guard_name' => 'web']);
        $siteSupervisor->syncPermissions([
            'view_employees', 'view_attendance', 'verify_attendance',
            'view_roster', 'create_reports',
        ]);

        // Field Staff
        $fieldStaff = Role::firstOrCreate(['name' => 'FIELD_STAFF', 'guard_name' => 'web']);
        $fieldStaff->syncPermissions([
            'create_attendance', 'view_attendance', 'view_roster',
        ]);
    }
}
