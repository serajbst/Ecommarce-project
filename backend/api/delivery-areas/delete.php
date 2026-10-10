<?php

declare(strict_types=1);

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../config/Response.php";
require_once __DIR__ . "/../../middleware/auth.php";

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

$allowedOrigin = "http://localhost:5173";

if (
    isset($_SERVER["HTTP_ORIGIN"]) &&
    $_SERVER["HTTP_ORIGIN"] === $allowedOrigin
) {
    header("Access-Control-Allow-Origin: " . $allowedOrigin);
}

header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Only DELETE
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "DELETE") {
    jsonResponse(
        false,
        "Only DELETE method is allowed.",
        null,
        405
    );
}

/*
|--------------------------------------------------------------------------
| Admin / Staff Authentication
|--------------------------------------------------------------------------
*/

requireAdmin();

/*
|--------------------------------------------------------------------------
| Delivery Area ID
|--------------------------------------------------------------------------
*/

$areaId = filter_input(
    INPUT_GET,
    "id",
    FILTER_VALIDATE_INT
);

if (
    $areaId === false ||
    $areaId === null ||
    $areaId <= 0
) {
    jsonResponse(
        false,
        "Valid delivery area ID is required.",
        null,
        422
    );
}

try {

    /*
    |--------------------------------------------------------------------------
    | Check Area
    |--------------------------------------------------------------------------
    */

    $checkStmt = $pdo->prepare("
        SELECT
            id,
            area_name,
            city,
            state,
            pincode,
            status
        FROM delivery_areas
        WHERE id = :id
        LIMIT 1
    ");

    $checkStmt->execute([
        ":id" => (int)$areaId
    ]);

    $area = $checkStmt->fetch();

    if (!$area) {
        jsonResponse(
            false,
            "Delivery area not found.",
            null,
            404
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Already Inactive
    |--------------------------------------------------------------------------
    */

    if ($area["status"] === "inactive") {
        jsonResponse(
            true,
            "Delivery area is already inactive.",
            [
                "area_id" => (int)$area["id"],
                "status" => "inactive"
            ],
            200
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Soft Delete
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        UPDATE delivery_areas
        SET
            status = 'inactive',
            updated_at = NOW()
        WHERE id = :id
    ");

    $stmt->execute([
        ":id" => (int)$areaId
    ]);

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Delivery area disabled successfully.",
        [
            "area_id" => (int)$areaId,
            "area_name" => $area["area_name"],
            "city" => $area["city"],
            "state" => $area["state"],
            "pincode" => $area["pincode"],
            "status" => "inactive"
        ],
        200
    );

} catch (PDOException $e) {

    error_log(
        "AshrafBazar Delivery Area Delete Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to disable delivery area.",
        null,
        500
    );
}