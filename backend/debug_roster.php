<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$phone = '+251965500639';
$user = \App\Models\User::where('phone_number', $phone)->first();

echo "User Found: " . ($user ? 'Yes' : 'No') . "\n";
if ($user) {
    echo "User ID: " . $user->id . "\n";
    echo "User Employee ID: " . ($user->employee_id ?? 'NULL') . "\n";
    
    if ($user->employee_id) {
        $employee = \App\Models\Employee::find($user->employee_id);
        echo "Linked Employee Code: " . ($employee ? $employee->employee_code : 'Not Found') . "\n";
    }
}

$targetEmployee = \App\Models\Employee::where('employee_code', 'EMP00052')->first();
echo "Target Employee (EMP00052) ID: " . ($targetEmployee ? $targetEmployee->id : 'Not Found') . "\n";

if ($targetEmployee) {
    $shifts = \App\Models\ShiftSchedule::where('employee_id', $targetEmployee->id)
        ->where('shift_start', '>=', now()->startOfDay())
        ->count();
    echo "Shifts found for EMP00052 from today onwards: " . $shifts . "\n";
    
    $todayUser = \App\Models\ShiftSchedule::where('employee_id', $targetEmployee->id)
        ->whereDate('shift_start', now()->toDateString())
        ->get();
        
    echo "Shifts for today (" . now()->toDateString() . "): " . $todayUser->count() . "\n";
    foreach($todayUser as $s) {
        echo " - " . $s->shift_start . " to " . $s->shift_end . "\n";
    }
}
