<?php

declare(strict_types=1);

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../config/response.php";
require_once __DIR__ . "/../../middleware/auth.php";

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

$allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];

$requestOrigin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($requestOrigin, $allowedOrigins, true)) {
    header(
        "Access-Control-Allow-Origin: " .
        $requestOrigin
    );
}

header("Vary: Origin");

header(
    "Access-Control-Allow-Headers: Content-Type, Authorization"
);

header(
    "Access-Control-Allow-Methods: PATCH, OPTIONS"
);

header(
    "Access-Control-Allow-Credentials: true"
);

header(
    "Content-Type: application/json; charset=UTF-8"
);

/*
|--------------------------------------------------------------------------
| OPTIONS
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Method
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "PATCH") {
    jsonResponse(
        false,
        "Only PATCH method is allowed.",
        null,
        405
    );
}

/*
|--------------------------------------------------------------------------
| Authorization
|--------------------------------------------------------------------------
*/

requireAdmin();

/*
|--------------------------------------------------------------------------
| JSON Input
|--------------------------------------------------------------------------
*/

$rawInput =
    file_get_contents("php://input");

if ($rawInput === false) {
    jsonResponse(
        false,
        "Unable to read request.",
        null,
        400
    );
}

$data =
    json_decode(
        $rawInput,
        true
    );

if (
    !is_array($data)
) {
    jsonResponse(
        false,
        "Invalid JSON request.",
        null,
        400
    );
}

/*
|--------------------------------------------------------------------------
| ID
|--------------------------------------------------------------------------
*/

$id = filter_var(
    $data["id"] ?? null,
    FILTER_VALIDATE_INT,
    [
        "options" => [
            "min_range" => 1
        ]
    ]
);

if (
    $id === false ||
    $id === null
) {
    jsonResponse(
        false,
        "Valid service ID is required.",
        null,
        422
    );
}

$serviceId =
    (int) $id;

/*
|--------------------------------------------------------------------------
| Active Status
|--------------------------------------------------------------------------
*/

if (
    !array_key_exists(
        "is_active",
        $data
    )
) {
    jsonResponse(
        false,
        "Service status is required.",
        null,
        422
    );
}

$isActiveRaw =
    $data["is_active"];

if (
    is_bool($isActiveRaw)
) {

    $isActive =
        $isActiveRaw ? 1 : 0;

} elseif (
    $isActiveRaw === 1 ||
    $isActiveRaw === "1" ||
    $isActiveRaw === true
) {

    $isActive = 1;

} elseif (
    $isActiveRaw === 0 ||
    $isActiveRaw === "0" ||
    $isActiveRaw === false
) {

    $isActive = 0;

} else {

    jsonResponse(
        false,
        "Invalid service status.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Database
|--------------------------------------------------------------------------
*/

try {

    /*
    |--------------------------------------------------------------------------
    | Check Service
    |--------------------------------------------------------------------------
    */

    $findStmt =
        $pdo->prepare("
            SELECT id
            FROM services
            WHERE id = :id
            LIMIT 1
        ");

    $findStmt->execute([
        ":id" => $serviceId
    ]);

    if (!$findStmt->fetch()) {
        jsonResponse(
            false,
            "Service not found.",
            null,
            404
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Update Status
    |--------------------------------------------------------------------------
    */

    $stmt =
        $pdo->prepare("
            UPDATE services
            SET
                is_active = :is_active
            WHERE id = :id
            LIMIT 1
        ");

    $stmt->execute([
        ":is_active" =>
            $isActive,

        ":id" =>
            $serviceId
    ]);

    /*
    |--------------------------------------------------------------------------
    | Get Updated Service
    |--------------------------------------------------------------------------
    */

    $fetchStmt =
        $pdo->prepare("
            SELECT
                id,
                name,
                description,
                image,
                phone,
                whatsapp,
                is_active,
                created_at,
                updated_at
            FROM services
            WHERE id = :id
            LIMIT 1
        ");

    $fetchStmt->execute([
        ":id" => $serviceId
    ]);

    $service =
        $fetchStmt->fetch(
            PDO::FETCH_ASSOC
        );

    if (!$service) {
        jsonResponse(
            false,
            "Service updated but could not be retrieved.",
            null,
            500
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize
    |--------------------------------------------------------------------------
    */

    $service["id"] =
        (int) $service["id"];

    $service["is_active"] =
        (int) $service["is_active"];

    /*
    |--------------------------------------------------------------------------
    | Image URL
    |--------------------------------------------------------------------------
    */

    $service["image"] =
        rtrim(BASE_URL, "/") .
        "/" .
        ltrim(
            (string) $service["image"],
            "/"
        );

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        $isActive === 1
            ? "Service activated successfully."
            : "Service deactivated successfully.",
        $service
    );

} catch (PDOException $e) {

    error_log(
        "Service toggle status error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to update service status right now.",
        null,
        500
    );

} catch (Throwable $e) {

    error_log(
        "Service toggle unexpected error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to update service status right now.",
        null,
        500
    );
}