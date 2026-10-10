<?php
declare(strict_types=1);

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../helpers/Response.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    jsonResponse(false, "Method not allowed.", null, 405);
}

try {

    $stmt = $pdo->query("
        SELECT
            setting_key,
            setting_value
        FROM settings
        ORDER BY setting_key ASC
    ");

    $rows = $stmt->fetchAll();

    $settings = [];

    foreach ($rows as $row) {
        $key = (string) $row["setting_key"];
        $value = $row["setting_value"];

        /*
         * Public store settings only.
         *
         * Do not expose:
         * - JWT secret
         * - database credentials
         * - payment gateway secrets
         * - admin credentials
         */
        $allowedPublicSettings = [
            "store_name",
            "store_tagline",
            "store_city",
            "store_state",
            "currency",
            "cod_enabled",
            "online_payment_enabled",
            "delivery_enabled"
        ];

        if (!in_array($key, $allowedPublicSettings, true)) {
            continue;
        }

        if (
            in_array(
                $key,
                [
                    "cod_enabled",
                    "online_payment_enabled",
                    "delivery_enabled"
                ],
                true
            )
        ) {
            $settings[$key] = ((string) $value === "1");
        } else {
            $settings[$key] = $value;
        }
    }

    jsonResponse(
        true,
        "Store settings fetched successfully.",
        $settings
    );

} catch (PDOException $e) {

    error_log(
        "Settings index error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch store settings right now.",
        null,
        500
    );
}