<?php
try {
    $pdo = new PDO("pgsql:host=127.0.0.1;port=5432;dbname=alef_erp", "postgres", "postgres");
    echo "Connected successfully to PostgreSQL!";
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
