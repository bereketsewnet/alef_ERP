<?php
try {
    $pdo = new PDO("pgsql:host=127.0.0.1;port=5432;dbname=alef_erp", "postgres", "postgres");
    $stmt = $pdo->query("SELECT PostGIS_Version()");
    $version = $stmt->fetchColumn();
    echo "PostGIS is available: " . $version;
} catch (PDOException $e) {
    echo "PostGIS not available: " . $e->getMessage();
}
