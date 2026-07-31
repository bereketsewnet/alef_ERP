<?php

$marketingOrigins = array_values(array_filter(array_map('trim', explode(',', env('MARKETING_ALLOWED_ORIGINS', '')))));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_merge([
        'http://localhost:5175',  // Staff Portal (local)
        'http://localhost:7070',  // Member Portal (local)
        'http://127.0.0.1:5175',
        'http://127.0.0.1:7070',
        'http://localhost:3000',   // Additional dev ports
        'http://127.0.0.1:3000',
        'http://102.211.186.118:5176',  // Staff Portal (VPS IP)
        'http://102.211.186.118:7071',  // Member Portal (VPS IP)
        'https://erp-staff.alefdelta.com',   // Staff Portal (production)
        'https://erp-member.alefdelta.com',  // Member Portal (production)
    ], $marketingOrigins),
    'allowed_origins_patterns' => [
        '/^http:\/\/localhost:\d+$/',  // Allow any localhost port
        '/^http:\/\/127\.0\.0\.1:\d+$/',  // Allow any 127.0.0.1 port
        '/^https:\/\/erp-(staff|member)\.alefdelta\.com$/',  // Production subdomains
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['Authorization'],
    'max_age' => 3600,
    'supports_credentials' => true,
];
