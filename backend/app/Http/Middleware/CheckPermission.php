<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission)
    {
        if (!auth()->user()->can($permission)) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'You do not have permission to perform this action'
            ], 403);
        }

        return $next($request);
    }
}
