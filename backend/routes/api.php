<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AuthFixController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AttendanceImportController;
use App\Http\Controllers\Api\RosterController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\CrmLeadController;
use App\Http\Controllers\Api\BidController;
use App\Http\Controllers\Api\PublicRecruitmentController;

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
    Route::post('/refresh', [AuthController::class, 'refresh']);
});

// Public marketing-site recruitment API. No JWT is required. Read traffic and
// submissions have separate rate limits to protect the ERP from abuse.
Route::prefix('public/recruitment')->group(function () {
    Route::middleware('throttle:60,1')->group(function () {
        Route::get('/vacancies', [PublicRecruitmentController::class, 'vacancies']);
        Route::get('/vacancies/{id}', [PublicRecruitmentController::class, 'vacancy']);
    });
    Route::post('/applications', [PublicRecruitmentController::class, 'apply'])->middleware('throttle:5,1');
});

// Protected Routes (JWT)
Route::middleware('auth:api')->group(function () {
    
    // Auth Routes
    Route::prefix('auth')->group(function () {
        Route::post('auth/sync-users', [AuthFixController::class, 'generateUsersForEmployees']);
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
        Route::put('/{id}/sites', [\App\Http\Controllers\Api\UserController::class, 'updateSites']);
        Route::post('/{id}/reset-password', [\App\Http\Controllers\Api\UserController::class, 'resetPassword']);
    });

    // Attendance Routes
    Route::prefix('attendance')->group(function () {
        // GPS-based (Telegram / member portal)
        Route::post('/clock-in', [AttendanceController::class, 'clockIn']);
        Route::post('/clock-out', [AttendanceController::class, 'clockOut']);

        // Log listing / verification
        Route::get('/logs', [AttendanceController::class, 'index']);
        Route::put('/logs/{id}/verify', [AttendanceController::class, 'verify']);
        Route::put('/logs/{id}/unverify', [AttendanceController::class, 'unverify']);
        Route::get('/my-logs', [AttendanceController::class, 'myLogs']);
        Route::get('/controller-sites', [AttendanceController::class, 'controllerSites']);
        Route::get('/export', [AttendanceController::class, 'exportAttendance']);

        // Permission flags
        Route::post('/{id}/mark-permission', [AttendanceController::class, 'markPermission']);
        Route::post('/permission/set', [AttendanceController::class, 'setPermission']);
        Route::post('/permission/remove', [AttendanceController::class, 'removePermission']);

        // Manual attendance entry
        Route::get('/pending-shifts', [AttendanceController::class, 'pendingShifts']);
        Route::post('/manual', [AttendanceController::class, 'manualEntry']);
        Route::get('/import/template', [AttendanceImportController::class, 'template']);
        Route::get('/import/bundle', [AttendanceImportController::class, 'bundle']);
        Route::post('/import', [AttendanceImportController::class, 'import']);
        Route::put('/{id}/manual', [AttendanceController::class, 'updateManualEntry']);
        Route::delete('/{id}/manual', [AttendanceController::class, 'deleteManualEntry']);
    });

    // Roster Routes
    Route::prefix('roster')->group(function () {
        Route::get('/', [RosterController::class, 'index']);
        Route::post('/bulk-assign', [RosterController::class, 'bulkAssign']);
        Route::post('/field-staff/bulk-assign', [RosterController::class, 'bulkAssignControllers']);
        Route::get('/my-roster', [RosterController::class, 'myRoster']);
        Route::delete('/by-employee/{employeeId}', [RosterController::class, 'deleteByEmployee']);
        Route::delete('/{id}', [RosterController::class, 'destroy']);
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
        
        // Employee Salary
        Route::get('/{id}/salary', [EmployeeController::class, 'getSalary']);
        Route::get('/{id}/salary/history', [EmployeeController::class, 'getSalaryHistory']);
        Route::post('/{id}/salary/adjustment', [EmployeeController::class, 'addSalaryAdjustment']);

        // Employee Alerts (panic / incidents)
        Route::get('/{id}/alerts', [EmployeeController::class, 'getAlerts']);

        // Employee screening records
        Route::get('/{employeeId}/screenings', [\App\Http\Controllers\Api\EmployeeScreeningController::class, 'index']);
        Route::post('/{employeeId}/screenings', [\App\Http\Controllers\Api\EmployeeScreeningController::class, 'store']);
        Route::put('/{employeeId}/screenings/{screeningId}', [\App\Http\Controllers\Api\EmployeeScreeningController::class, 'update']);
        Route::delete('/{employeeId}/screenings/{screeningId}', [\App\Http\Controllers\Api\EmployeeScreeningController::class, 'destroy']);

        // Employee documents (medical paper, police report, guarantor docs, photos, etc.)
        Route::get('/{employeeId}/documents', [\App\Http\Controllers\Api\EmployeeDocumentController::class, 'index']);
        Route::post('/{employeeId}/documents', [\App\Http\Controllers\Api\EmployeeDocumentController::class, 'store']);
        Route::delete('/{employeeId}/documents/{documentId}', [\App\Http\Controllers\Api\EmployeeDocumentController::class, 'destroy']);
    });

    // Client & Site Routes
    Route::prefix('clients')->group(function () {
        Route::get('/', [ClientController::class, 'index']);
        Route::post('/', [ClientController::class, 'store']);
        Route::get('/site-staff-options', [ClientController::class, 'siteStaffOptions']);
        Route::get('/{id}', [ClientController::class, 'show']);
        Route::put('/{id}', [ClientController::class, 'update']);
        Route::delete('/{id}', [ClientController::class, 'destroy']);

        // Client sites
        Route::post('/{id}/sites', [ClientController::class, 'createSite']);
        Route::get('/{clientId}/sites', [ClientController::class, 'getSites']);
        Route::put('/{clientId}/sites/{siteId}', [ClientController::class, 'updateSite']);
        Route::put('/{clientId}/sites/{siteId}/supervisors', [ClientController::class, 'updateSiteSupervisors']);
        Route::delete('/{clientId}/sites/{siteId}', [ClientController::class, 'destroySite']);
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

    // Vacancies (job vacancy management)
    Route::prefix('vacancies')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\VacancyController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\VacancyController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\VacancyController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\Api\VacancyController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\VacancyController::class, 'destroy']);
    });

    // Job Applications (user/agent-filled applications)
    Route::prefix('job-applications')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\JobApplicationController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\JobApplicationController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\JobApplicationController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\Api\JobApplicationController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\JobApplicationController::class, 'destroy']);
        Route::get('/{id}/cv', [\App\Http\Controllers\Api\JobApplicationController::class, 'downloadCv']);

        // Job Application Screenings (pre-employment interviews & exams)
        Route::get('/{jobApplicationId}/screenings', [\App\Http\Controllers\Api\JobApplicationScreeningController::class, 'index']);
        Route::post('/{jobApplicationId}/screenings', [\App\Http\Controllers\Api\JobApplicationScreeningController::class, 'store']);
        Route::put('/{jobApplicationId}/screenings/{screeningId}', [\App\Http\Controllers\Api\JobApplicationScreeningController::class, 'update']);
        Route::delete('/{jobApplicationId}/screenings/{screeningId}', [\App\Http\Controllers\Api\JobApplicationScreeningController::class, 'destroy']);
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
        Route::get('/assignment-history', [AssetController::class, 'assignmentHistory']);
        Route::get('/batches', [AssetController::class, 'batches']);
        Route::get('/batches/{batchId}', [AssetController::class, 'showBatch']);
        Route::get('/{id}', [AssetController::class, 'show']);
        Route::put('/{id}', [AssetController::class, 'update']);
        Route::delete('/{id}', [AssetController::class, 'destroy']);
        Route::post('/{id}/assign', [AssetController::class, 'assign']);
        Route::post('/{id}/return', [AssetController::class, 'returnAsset']);
        Route::delete('/{id}/assignments/{assignmentId}', [AssetController::class, 'destroyAssignment']);
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
        Route::delete('/{id}', [IncidentController::class, 'destroy']);
    });

    // Invoice Routes
    Route::prefix('invoices')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Api\InvoiceController::class, 'dashboard_stats']);
        Route::get('/client/{clientId}/penalty-preview', [\App\Http\Controllers\Api\InvoiceController::class, 'penaltyPreview']);
        Route::get('/', [\App\Http\Controllers\Api\InvoiceController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\InvoiceController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\InvoiceController::class, 'show']);
        Route::get('/{id}/download', [\App\Http\Controllers\Api\InvoiceController::class, 'download']);
        Route::post('/{id}/send', [\App\Http\Controllers\Api\InvoiceController::class, 'send']);
        Route::post('/{id}/mark-paid', [\App\Http\Controllers\Api\InvoiceController::class, 'markAsPaid']);
    });

    // CRM Leads Routes
    Route::prefix('crm/leads')->group(function () {
        Route::get('/', [CrmLeadController::class, 'index']);
        Route::post('/', [CrmLeadController::class, 'store']);
        Route::get('/{id}', [CrmLeadController::class, 'show']);
        Route::put('/{id}', [CrmLeadController::class, 'update']);
        Route::delete('/{id}', [CrmLeadController::class, 'destroy']);
        Route::post('/{leadId}/activities', [CrmLeadController::class, 'addActivity']);
    });

    // Bid Management Routes
    Route::prefix('bids')->group(function () {
        Route::get('/', [BidController::class, 'index']);
        Route::post('/', [BidController::class, 'store']);
        Route::get('/{id}', [BidController::class, 'show']);
        Route::put('/{id}', [BidController::class, 'update']);
        Route::delete('/{id}', [BidController::class, 'destroy']);
    });

    // Report Routes
    Route::prefix('reports')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Api\ReportController::class, 'getDashboardStats']);
        Route::get('/attendance', [\App\Http\Controllers\Api\ReportController::class, 'getAttendanceReport']);
        Route::get('/finance', [\App\Http\Controllers\Api\ReportController::class, 'getFinanceReport']);
        Route::get('/incidents', [\App\Http\Controllers\Api\ReportController::class, 'getIncidentsReport']);
        Route::get('/roster', [\App\Http\Controllers\Api\ReportController::class, 'getRosterReport']);
        Route::get('/assets', [\App\Http\Controllers\Api\ReportController::class, 'getAssetReport']);
        Route::get('/clients-sites', [\App\Http\Controllers\Api\ReportController::class, 'getClientSiteReport']);
        Route::get('/export/{type}', [\App\Http\Controllers\Api\ReportController::class, 'exportReport']);
    });

    // General Settings (OWNER only for write, all admin roles for read)
    Route::prefix('settings')->group(function () {
        Route::get('/attendance-mode', [\App\Http\Controllers\Api\GeneralSettingsController::class, 'getAttendanceMode']);
        Route::put('/attendance-mode', [\App\Http\Controllers\Api\GeneralSettingsController::class, 'setAttendanceMode']);
    });
});

// Health Check
Route::get('/health', [HealthController::class, 'index']);
