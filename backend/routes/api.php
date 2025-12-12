<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\RosterController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\HealthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Auth Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/telegram', [AuthController::class, 'telegramLogin']);
});

// Protected Routes (JWT)
Route::middleware('auth:api')->group(function () {
    
    // Auth Routes
    Route::prefix('auth')->group(function () {
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // User Management Routes (Admin)
    Route::prefix('users')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\UserController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\UserController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\UserController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\Api\UserController::class, 'update']);
        Route::post('/{id}/reset-password', [\App\Http\Controllers\Api\UserController::class, 'resetPassword']);
    });

    // Attendance Routes
    Route::prefix('attendance')->group(function () {
        Route::post('/clock-in', [AttendanceController::class, 'clockIn']);
        Route::post('/clock-out', [AttendanceController::class, 'clockOut']);
        Route::get('/logs', [AttendanceController::class, 'index']);
        Route::put('/logs/{id}/verify', [AttendanceController::class, 'verify']);
        Route::put('/logs/{id}/unverify', [AttendanceController::class, 'unverify']);
        Route::get('/my-logs', [AttendanceController::class, 'myLogs']);
        Route::get('/export', [AttendanceController::class, 'exportAttendance']);
    });

    // Roster Routes
    Route::prefix('roster')->group(function () {
        Route::get('/', [RosterController::class, 'index']);
        Route::post('/bulk-assign', [RosterController::class, 'bulkAssign']);
        Route::get('/my-roster', [RosterController::class, 'myRoster']);
    });

    // Employee Routes
    Route::prefix('employees')->group(function () {
        Route::get('/', [EmployeeController::class, 'index']);
        Route::post('/', [EmployeeController::class, 'store']);
        Route::get('/{id}', [EmployeeController::class, 'show']);
        Route::put('/{id}', [EmployeeController::class, 'update']);
        Route::delete('/{id}', [EmployeeController::class, 'destroy']);
        Route::post('/link-telegram', [EmployeeController::class, 'linkTelegram']);
        
        // Employee Job assignments
        Route::get('/{id}/jobs', [EmployeeController::class, 'getJobs']);
        Route::post('/{id}/jobs', [EmployeeController::class, 'assignJob']);
        Route::put('/{employeeId}/jobs/{jobId}', [EmployeeController::class, 'updateJob']);
        Route::delete('/{employeeId}/jobs/{jobId}', [EmployeeController::class, 'removeJob']);
        Route::put('/{employeeId}/jobs/{jobId}/primary', [EmployeeController::class, 'setPrimaryJob']);
    });

    // Client & Site Routes
    Route::prefix('clients')->group(function () {
        Route::get('/', [ClientController::class, 'index']);
        Route::post('/', [ClientController::class, 'store']);
        Route::get('/{id}', [ClientController::class, 'show']);
        Route::put('/{id}', [ClientController::class, 'update']);
        Route::delete('/{id}', [ClientController::class, 'destroy']);
        Route::post('/{id}/sites', [ClientController::class, 'createSite']);
        Route::get('/{clientId}/sites', [ClientController::class, 'getSites']);
    });

    // Site Job Requirements
    Route::prefix('sites')->group(function () {
        Route::get('/{siteId}/jobs', [ClientController::class, 'getSiteJobs']);
        Route::post('/{siteId}/jobs', [ClientController::class, 'addSiteJob']);
        Route::put('/{siteId}/jobs/{jobId}', [ClientController::class, 'updateSiteJob']);
        Route::delete('/{siteId}/jobs/{jobId}', [ClientController::class, 'removeSiteJob']);
    });

    // Job Categories
    Route::prefix('job-categories')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\JobCategoryController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\JobCategoryController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\JobCategoryController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\Api\JobCategoryController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\JobCategoryController::class, 'destroy']);
    });

    // Jobs
    Route::prefix('jobs')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\JobController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\JobController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\JobController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\Api\JobController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\JobController::class, 'destroy']);
        Route::post('/{id}/skills', [\App\Http\Controllers\Api\JobController::class, 'addSkill']);
        Route::delete('/{jobId}/skills/{skillId}', [\App\Http\Controllers\Api\JobController::class, 'removeSkill']);
        Route::get('/{id}/employees', [\App\Http\Controllers\Api\JobController::class, 'getEmployees']);
        Route::get('/{id}/sites', [\App\Http\Controllers\Api\JobController::class, 'getSites']);
    });

    // Asset Routes
    Route::prefix('assets')->group(function () {
        Route::get('/', [AssetController::class, 'index']);
        Route::post('/', [AssetController::class, 'store']);
        Route::get('/stats', [AssetController::class, 'stats']);
        Route::get('/unreturned', [AssetController::class, 'unreturned']);
        Route::get('/{id}', [AssetController::class, 'show']);
        Route::put('/{id}', [AssetController::class, 'update']);
        Route::delete('/{id}', [AssetController::class, 'destroy']);
        Route::post('/{id}/assign', [AssetController::class, 'assign']);
        Route::post('/{id}/return', [AssetController::class, 'returnAsset']);
    });

    // Payroll Management
    Route::prefix('payroll')->group(function () {
        Route::get('periods', [App\Http\Controllers\Api\PayrollController::class, 'index']);
        Route::post('periods', [App\Http\Controllers\Api\PayrollController::class, 'store']);
        Route::get('periods/{id}', [App\Http\Controllers\Api\PayrollController::class, 'show']);
        Route::post('periods/{id}/generate', [App\Http\Controllers\Api\PayrollController::class, 'generate']);
        Route::post('periods/{id}/approve', [App\Http\Controllers\Api\PayrollController::class, 'approve']);
        Route::get('items/{id}/payslip', [App\Http\Controllers\Api\PayrollController::class, 'downloadPayslip']);
        Route::get('stats', [App\Http\Controllers\Api\PayrollController::class, 'stats']);
        
        // Settings
        Route::get('settings', [App\Http\Controllers\Api\PayrollController::class, 'getSettings']);
        Route::put('settings/{key}', [App\Http\Controllers\Api\PayrollController::class, 'updateSetting']);
    });

    // Penalty Management
    Route::get('penalties', [App\Http\Controllers\Api\PayrollController::class, 'getPenalties']);
    Route::post('penalties', [App\Http\Controllers\Api\PayrollController::class, 'storePenalty']);
    Route::delete('penalties/{id}', [App\Http\Controllers\Api\PayrollController::class, 'deletePenalty']);

    // Bonus Management
    Route::get('bonuses', [App\Http\Controllers\Api\PayrollController::class, 'getBonuses']);
    Route::post('bonuses', [App\Http\Controllers\Api\PayrollController::class, 'storeBonus']);
    Route::delete('bonuses/{id}', [App\Http\Controllers\Api\PayrollController::class, 'deleteBonus']);

    // Incident Routes
    Route::prefix('incidents')->group(function () {
        Route::get('/', [IncidentController::class, 'index']);
        Route::post('/', [IncidentController::class, 'store']);
        Route::post('/panic', [IncidentController::class, 'panic']);
    });

    // Invoice Routes
    Route::prefix('invoices')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Api\InvoiceController::class, 'dashboard_stats']);
        Route::get('/', [\App\Http\Controllers\Api\InvoiceController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\InvoiceController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\InvoiceController::class, 'show']);
        Route::get('/{id}/download', [\App\Http\Controllers\Api\InvoiceController::class, 'download']);
    });

    // Report Routes
    Route::prefix('reports')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Api\ReportController::class, 'getDashboardStats']);
        Route::get('/attendance', [\App\Http\Controllers\Api\ReportController::class, 'getAttendanceReport']);
        Route::get('/finance', [\App\Http\Controllers\Api\ReportController::class, 'getFinanceReport']);
        Route::get('/incidents', [\App\Http\Controllers\Api\ReportController::class, 'getIncidentsReport']);
        Route::get('/roster', [\App\Http\Controllers\Api\ReportController::class, 'getRosterReport']);
        Route::get('/export/{type}', [\App\Http\Controllers\Api\ReportController::class, 'exportReport']);
    });
});

// Health Check
Route::get('/health', [HealthController::class, 'index']);
