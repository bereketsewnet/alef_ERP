<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$user = User::first();
if (!$user) {
    echo "Creating user...\n";
    $user = User::create([
        'username' => 'admin',
        'email' => 'admin@test.com',
        'password' => bcrypt('password'),
        'role' => 'SUPER_ADMIN',
        'is_active' => true
    ]);
}

$token = auth('api')->login($user);
if (!$token) {
    echo "Failed to generate token via auth()->login(). Trying JWTAuth::fromUser()...\n";
    try {
        $token = \Tymon\JWTAuth\Facades\JWTAuth::fromUser($user);
    } catch (\Exception $e) {
        echo "JWTAuth error: " . $e->getMessage() . "\n";
        exit(1);
    }
}
file_put_contents('token.txt', $token);
echo "Token saved to token.txt\n";
