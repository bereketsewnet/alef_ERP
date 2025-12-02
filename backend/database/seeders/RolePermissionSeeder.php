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
            Permission::create(['name' => $permission]);
        }

        // Create Roles and Assign Permissions

        // Super Admin
        $superAdmin = Role::create(['name' => 'SUPER_ADMIN']);
        $superAdmin->givePermissionTo(Permission::all());

        // Operations Manager
        $opsManager = Role::create(['name' => 'OPS_MANAGER']);
        $opsManager->givePermissionTo([
            'view_employees', 'create_employees', 'edit_employees',
            'view_attendance', 'verify_attendance',
            'view_roster', 'create_roster', 'edit_roster', 'delete_roster',
            'view_clients', 'view_assets', 'assign_assets',
            'view_reports', 'create_reports',
        ]);

        // HR Manager
        $hrManager = Role::create(['name' => 'HR_MANAGER']);
        $hrManager->givePermissionTo([
            'view_employees', 'create_employees', 'edit_employees', 'delete_employees',
            'view_attendance', 'view_roster',
            'view_payroll', 'generate_payroll',
            'view_reports',
        ]);

        // Finance
        $finance = Role::create(['name' => 'FINANCE']);
        $finance->givePermissionTo([
            'view_employees', 'view_attendance',
            'view_payroll', 'generate_payroll',
            'view_invoices', 'create_invoices',
            'view_reports',
        ]);

        // Site Supervisor
        $siteSupervisor = Role::create(['name' => 'SITE_SUPERVISOR']);
        $siteSupervisor->givePermissionTo([
            'view_employees', 'view_attendance', 'verify_attendance',
            'view_roster', 'create_reports',
        ]);

        // Field Staff
        $fieldStaff = Role::create(['name' => 'FIELD_STAFF']);
        $fieldStaff->givePermissionTo([
            'create_attendance', 'view_attendance', 'view_roster',
        ]);
    }
}
