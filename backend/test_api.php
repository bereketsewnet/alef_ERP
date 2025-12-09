<?php

$token = trim(file_get_contents('token.txt'));
$url = 'http://localhost:8000/api/jobs';

$data = [
    'category_id' => 1, // Assumes category 1 exists (created in prev step)
    'job_name' => 'Test Job',
    'job_code' => 'TJ001',
    'pay_type' => 'HOURLY',
    'base_salary' => 0,
    'hourly_rate' => 100,
    'is_active' => true,
    'description' => 'Test Job Desc'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Content-Type: application/json',
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";
echo "Error: $error\n";
