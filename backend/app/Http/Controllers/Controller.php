<?php

namespace App\Http\Controllers;

use OpenApi\Annotations as OA;

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
 */
abstract class Controller
{
    //
}
