<?php
declare(strict_types=1);

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../helpers/Response.php";
require_once __DIR__ . "/../../middleware/auth.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "PUT") {
    jsonResponse(false, "Method not allowed.", null, 405);
}

requireAdminOnly();

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    jsonResponse(false, "Invalid request data.", null, 400);
}

/*
 * Only these settings can be changed from the admin panel.
 */
$allowedSettings = [
    "store_name" => [
        "type" => "string",
        "max" => 100
    ],
    "store_tagline" => [
        "type" => "string",
        "max" => 255
    ],
    "store_city" => [
        "type" => "string",
        "max" => 100
    ],
    "store_state" => [
        "type" => "string",
        "max" => 100
    ],
    "currency" => [
        "type" => "string",
        "max" => 10
    ],
    "cod_enabled" => [
        "type" => "boolean"
    ],
    "online_payment_enabled" => [
        "type" => "boolean"
    ],
    "delivery_enabled" => [
        "type" => "boolean"
    ]
];

$updates = [];

foreach ($allowedSettings as $key => $rules) {

    if (!array_key_exists($key, $input)) {
        continue;
    }

    $value = $input[$key];

    if ($rules["type"] === "string") {

        if (!is_string($value)) {
            jsonResponse(
                false,
                "{$key} must be a string.",
                null,
                422
            );
        }

        $value = trim($value);

        if ($value === "") {
            jsonResponse(
                false,
                "{$key} cannot be empty.",
                null,
                422
            );
        }

        if (mb_strlen($value) > $rules["max"]) {
            jsonResponse(
                false,
                "{$key} is too long.",
                null,
                422
            );
        }

        $updates[$key] = $value;
    }

    elseif ($rules["type"] === "boolean") {

        if (!is_bool($value) && !in_array($value, [0, 1, "0", "1"], true)) {
            jsonResponse(
                false,
                "{$key} must be boolean.",
                null,
                422
            );
        }

        $updates[$key] = (
            $value === true ||
            $value === 1 ||
            $value === "1"
        ) ? "1" : "0";
    }
}

if (empty($updates)) {
    jsonResponse(
        false,
        "No valid settings were provided.",
        null,
        422
    );
}

try {

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO settings
            (setting_key, setting_value)
        VALUES
            (:setting_key, :setting_value)
        ON DUPLICATE KEY UPDATE
            setting_value = VALUES(setting_value)
    ");

    foreach ($updates as $key => $value) {
        $stmt->execute([
            ":setting_key" => $key,
            ":setting_value" => $value
        ]);
    }

    $pdo->commit();

    /*
     * Return the updated public settings.
     */
    $placeholders = implode(
        ",",
        array_fill(0, count($updates), "?")
    );

    $readStmt = $pdo->prepare("
        SELECT
            setting_key,
            setting_value
        FROM settings
        WHERE setting_key IN ({$placeholders})
        ORDER BY setting_key ASC
    ");

    $readStmt->execute(array_keys($updates));

    $result = [];

    foreach ($readStmt->fetchAll() as $row) {

        $key = (string) $row["setting_key"];
        $value = $row["setting_value"];

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
            $result[$key] = ((string) $value === "1");
        } else {
            $result[$key] = $value;
        }
    }

    jsonResponse(
        true,
        "Settings updated successfully.",
        $result
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "Settings update error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to update settings right now.",
        null,
        500
    );
}