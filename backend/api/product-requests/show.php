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

header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Only GET
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    jsonResponse(
        false,
        "Only GET method is allowed.",
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
| Request ID
|--------------------------------------------------------------------------
*/

$requestId = filter_input(
    INPUT_GET,
    "id",
    FILTER_VALIDATE_INT
);

if (
    $requestId === false ||
    $requestId === null ||
    $requestId <= 0
) {
    jsonResponse(
        false,
        "Valid product request ID is required.",
        null,
        422
    );
}

try {

    /*
    |--------------------------------------------------------------------------
    | Fetch Product Request
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT
            id,
            request_number,
            user_id,
            product_name,
            category,
            quantity,
            brand_model,
            description,
            customer_name,
            mobile,
            address_line,
            city,
            pincode,
            status,
            admin_note,
            created_at,
            updated_at
        FROM product_requests
        WHERE id = :id
        LIMIT 1
    ");

    $stmt->execute([
        ":id" => (int)$requestId
    ]);

    $request = $stmt->fetch();

    if (!$request) {
        jsonResponse(
            false,
            "Product request not found.",
            null,
            404
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Product request fetched successfully.",
        $request,
        200
    );

} catch (PDOException $e) {

    error_log(
        "AshrafBazar Product Request Show Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch product request.",
        null,
        500
    );
}