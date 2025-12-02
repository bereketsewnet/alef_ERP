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

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Auth Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/telegram', [AuthController::class, 'telegramLogin']);
});

// Protected Routes (JWT)
Route::middleware('auth:api')->group(function () {
    
    // Auth Routes
    Route::prefix('auth')->group(function () {
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    // Attendance Routes
    Route::prefix('attendance')->group(function () {
        Route::post('/clock-in', [AttendanceController::class, 'clockIn']);
        Route::post('/clock-out', [AttendanceController::class, 'clockOut']);
        Route::get('/logs', [AttendanceController::class, 'index']);
        Route::get('/my-logs', [AttendanceController::class, 'myLogs']);
        Route::get('/export', [AttendanceController::class, 'exportAttendance']);
    });

    // Roster Routes
    Route::prefix('roster')->group(function () {
        Route::post('/bulk-assign', [RosterController::class, 'bulkAssign']);
        Route::get('/my-roster', [RosterController::class, 'myRoster']);
        Route::get('/', [RosterController::class, 'index']);
    });

    // Employee Routes
    Route::prefix('employees')->group(function () {
        Route::get('/', [EmployeeController::class, 'index']);
        Route::post('/', [EmployeeController::class, 'store']);
        Route::get('/{id}', [EmployeeController::class, 'show']);
        Route::put('/{id}', [EmployeeController::class, 'update']);
        Route::post('/link-telegram', [EmployeeController::class, 'linkTelegram']);
    });

    // Client & Site Routes
    Route::prefix('clients')->group(function () {
        Route::get('/', [ClientController::class, 'index']);
        Route::post('/', [ClientController::class, 'store']);
        Route::get('/{id}', [ClientController::class, 'show']);
        Route::put('/{id}', [ClientController::class, 'update']);
        Route::post('/{clientId}/sites', [ClientController::class, 'createSite']);
        Route::get('/{clientId}/sites', [ClientController::class, 'getSites']);
    });

    // Asset Routes
    Route::prefix('assets')->group(function () {
        Route::get('/', [AssetController::class, 'index']);
        Route::post('/', [AssetController::class, 'store']);
        Route::post('/assign', [AssetController::class, 'assign']);
        Route::post('/return', [AssetController::class, 'returnAsset']);
        Route::get('/employee/{employeeId}', [AssetController::class, 'employeeAssets']);
    });

    // Finance Routes
    Route::prefix('finance')->group(function () {
        Route::post('/payroll-periods', [FinanceController::class, 'createPayrollPeriod']);
        Route::post('/generate-payroll', [FinanceController::class, 'generatePayroll']);
        Route::get('/payslips', [FinanceController::class, 'getPayslips']);
        Route::get('/my-payslips', [FinanceController::class, 'getMyPayslips']);
        Route::get('/payslips/{id}/download', [FinanceController::class, 'downloadPayslipPdf']);
        Route::get('/payroll/export', [FinanceController::class, 'exportPayroll']);
        Route::get('/invoices', [FinanceController::class, 'getInvoices']);
    });

    // Incident Routes
    Route::prefix('incidents')->group(function () {
        Route::get('/', [IncidentController::class, 'index']);
        Route::post('/', [IncidentController::class, 'store']);
        Route::post('/panic', [IncidentController::class, 'panic']);
    });
});

