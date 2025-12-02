<?php

/**
 * @OA\Info(
 *     title="ALEF DELTA ERP API",
 *     version="1.0.0",
 *     description="Production-ready ERP API for manpower supply management with GPS-verified attendance, Telegram integration, payroll automation, and asset tracking.",
 *     @OA\Contact(
 *         email="admin@alefdelta.com"
 *     )
 * )
 * 
 * @OA\Server(
 *     url="http://localhost:8000/api",
 *     description="Local Development Server"
 * )
 * 
 * @OA\Server(
 *     url="https://api.alefdelta.com/api",
 *     description="Production Server"
 * )
 * 
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT",
 *     description="Enter JWT token obtained from login endpoint"
 * )
 * 
 * @OA\Tag(
 *     name="Authentication",
 *     description="User authentication and token management"
 * )
 * 
 * @OA\Tag(
 *     name="Employees",
 *     description="Employee management endpoints"
 * )
 * 
 * @OA\Tag(
 *     name="Attendance",
 *     description="GPS-verified attendance tracking"
 * )
 * 
 * @OA\Tag(
 *     name="Roster",
 *     description="Shift scheduling and roster management"
 * )
 * 
 * @OA\Tag(
 *     name="Clients",
 *     description="Client and site management"
 * )
 * 
 * @OA\Tag(
 *     name="Assets",
 *     description="Asset assignment and tracking"
 * )
 * 
 * @OA\Tag(
 *     name="Finance",
 *     description="Payroll and invoice management"
 * )
 * 
 * @OA\Tag(
 *     name="Incidents",
 *     description="Operational incident reporting"
 * )
 */

namespace App\Http\Controllers;

abstract class Controller
{
    //
}
