<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:5175',  // Staff Portal
        'http://localhost:7070',  // Member Portal
        'http://127.0.0.1:5175',
        'http://127.0.0.1:7070',
        'http://localhost:3000',   // Additional dev ports
        'http://127.0.0.1:3000',
    ],
    'allowed_origins_patterns' => [
        '/^http:\/\/localhost:\d+$/',  // Allow any localhost port
        '/^http:\/\/127\.0\.0\.1:\d+$/',  // Allow any 127.0.0.1 port
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['Authorization'],
    'max_age' => 3600,
    'supports_credentials' => true,
];
