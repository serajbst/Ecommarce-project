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

header("Access-Control-Allow-Methods: PUT, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Only PUT / PATCH
|--------------------------------------------------------------------------
*/

if (
    $_SERVER["REQUEST_METHOD"] !== "PUT" &&
    $_SERVER["REQUEST_METHOD"] !== "PATCH"
) {
    jsonResponse(
        false,
        "Only PUT or PATCH method is allowed.",
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

/*
|--------------------------------------------------------------------------
| Read JSON
|--------------------------------------------------------------------------
*/

$rawInput = file_get_contents("php://input");

if ($rawInput === false || strlen($rawInput) > 10000) {
    jsonResponse(
        false,
        "Invalid request.",
        null,
        400
    );
}

$input = json_decode($rawInput, true);

if (!is_array($input)) {
    jsonResponse(
        false,
        "Invalid JSON request.",
        null,
        400
    );
}

/*
|--------------------------------------------------------------------------
| Input
|--------------------------------------------------------------------------
*/

$areaName = trim(
    (string)($input["area_name"] ?? "")
);

$city = trim(
    (string)($input["city"] ?? "")
);

$state = trim(
    (string)($input["state"] ?? "")
);

$pincode = trim(
    (string)($input["pincode"] ?? "")
);

$deliveryCharge = $input["delivery_charge"] ?? null;
$minimumOrder = $input["minimum_order"] ?? null;

$estimatedDays = trim(
    (string)($input["estimated_days"] ?? "")
);

$status = strtolower(
    trim((string)($input["status"] ?? ""))
);

/*
|--------------------------------------------------------------------------
| Required Fields
|--------------------------------------------------------------------------
*/

if ($areaName === "") {
    jsonResponse(
        false,
        "Area name is required.",
        null,
        422
    );
}

if (mb_strlen($areaName) > 150) {
    jsonResponse(
        false,
        "Area name is too long.",
        null,
        422
    );
}

if ($city === "") {
    jsonResponse(
        false,
        "City is required.",
        null,
        422
    );
}

if (mb_strlen($city) > 100) {
    jsonResponse(
        false,
        "City name is too long.",
        null,
        422
    );
}

if ($state === "") {
    jsonResponse(
        false,
        "State is required.",
        null,
        422
    );
}

if (mb_strlen($state) > 100) {
    jsonResponse(
        false,
        "State name is too long.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Pincode
|--------------------------------------------------------------------------
*/

if (
    $pincode !== "" &&
    !preg_match("/^[0-9]{6}$/", $pincode)
) {
    jsonResponse(
        false,
        "Pincode must be a valid 6-digit number.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Delivery Charge
|--------------------------------------------------------------------------
*/

if (
    $deliveryCharge === null ||
    !is_numeric($deliveryCharge) ||
    (float)$deliveryCharge < 0
) {
    jsonResponse(
        false,
        "Invalid delivery charge.",
        null,
        422
    );
}

$deliveryCharge = round(
    (float)$deliveryCharge,
    2
);

/*
|--------------------------------------------------------------------------
| Minimum Order
|--------------------------------------------------------------------------
*/

if (
    $minimumOrder === null ||
    !is_numeric($minimumOrder) ||
    (float)$minimumOrder < 0
) {
    jsonResponse(
        false,
        "Invalid minimum order amount.",
        null,
        422
    );
}

$minimumOrder = round(
    (float)$minimumOrder,
    2
);

/*
|--------------------------------------------------------------------------
| Estimated Days
|--------------------------------------------------------------------------
*/

if ($estimatedDays === "") {
    jsonResponse(
        false,
        "Estimated delivery time is required.",
        null,
        422
    );
}

if (mb_strlen($estimatedDays) > 100) {
    jsonResponse(
        false,
        "Estimated delivery time is too long.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

$allowedStatuses = [
    "active",
    "inactive"
];

if (!in_array($status, $allowedStatuses, true)) {
    jsonResponse(
        false,
        "Invalid delivery area status.",
        null,
        422
    );
}

try {

    /*
    |--------------------------------------------------------------------------
    | Check Existing Area
    |--------------------------------------------------------------------------
    */

    $existingStmt = $pdo->prepare("
        SELECT id
        FROM delivery_areas
        WHERE id = :id
        LIMIT 1
    ");

    $existingStmt->execute([
        ":id" => (int)$areaId
    ]);

    if (!$existingStmt->fetch()) {
        jsonResponse(
            false,
            "Delivery area not found.",
            null,
            404
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Duplicate Pincode Check
    |--------------------------------------------------------------------------
    */

    if ($pincode !== "") {

        $duplicateStmt = $pdo->prepare("
            SELECT id
            FROM delivery_areas
            WHERE pincode = :pincode
              AND status = 'active'
              AND id != :id
            LIMIT 1
        ");

        $duplicateStmt->execute([
            ":pincode" => $pincode,
            ":id" => (int)$areaId
        ]);

        if ($duplicateStmt->fetch()) {
            jsonResponse(
                false,
                "Another active delivery area already exists for this pincode.",
                null,
                409
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        UPDATE delivery_areas
        SET
            area_name = :area_name,
            city = :city,
            state = :state,
            pincode = :pincode,
            delivery_charge = :delivery_charge,
            minimum_order = :minimum_order,
            estimated_days = :estimated_days,
            status = :status,
            updated_at = NOW()
        WHERE id = :id
    ");

    $stmt->execute([
        ":area_name" => $areaName,
        ":city" => $city,
        ":state" => $state,
        ":pincode" =>
            $pincode !== ""
                ? $pincode
                : null,
        ":delivery_charge" => $deliveryCharge,
        ":minimum_order" => $minimumOrder,
        ":estimated_days" => $estimatedDays,
        ":status" => $status,
        ":id" => (int)$areaId
    ]);

    /*
    |--------------------------------------------------------------------------
    | Fetch Updated Area
    |--------------------------------------------------------------------------
    */

    $areaStmt = $pdo->prepare("
        SELECT
            id,
            area_name,
            city,
            state,
            pincode,
            delivery_charge,
            minimum_order,
            estimated_days,
            status,
            created_at,
            updated_at
        FROM delivery_areas
        WHERE id = :id
        LIMIT 1
    ");

    $areaStmt->execute([
        ":id" => (int)$areaId
    ]);

    $area = $areaStmt->fetch();

    if (!$area) {
        jsonResponse(
            false,
            "Delivery area updated but could not be loaded.",
            null,
            500
        );
    }

    $area["id"] = (int)$area["id"];

    $area["delivery_charge"] =
        (float)$area["delivery_charge"];

    $area["minimum_order"] =
        (float)$area["minimum_order"];

    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Delivery area updated successfully.",
        [
            "area" => $area
        ],
        200
    );

} catch (PDOException $e) {

    error_log(
        "AshrafBazar Delivery Area Update Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to update delivery area.",
        null,
        500
    );
}