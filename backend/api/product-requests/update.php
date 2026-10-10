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
| Method
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

/*
|--------------------------------------------------------------------------
| Read JSON
|--------------------------------------------------------------------------
*/

$rawInput = file_get_contents("php://input");

if ($rawInput === false || trim($rawInput) === "") {
    jsonResponse(
        false,
        "Request body is required.",
        null,
        400
    );
}

$data = json_decode($rawInput, true);

if (
    !is_array($data) ||
    json_last_error() !== JSON_ERROR_NONE
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
| Allowed Statuses
|--------------------------------------------------------------------------
*/

$allowedStatuses = [
    "pending",
    "checking",
    "available",
    "not_available",
    "completed",
    "cancelled"
];

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

$status = null;

if (array_key_exists("status", $data)) {

    if (!is_string($data["status"])) {
        jsonResponse(
            false,
            "Status must be a string.",
            null,
            422
        );
    }

    $status = trim($data["status"]);

    if (!in_array($status, $allowedStatuses, true)) {
        jsonResponse(
            false,
            "Invalid product request status.",
            null,
            422
        );
    }
}

/*
|--------------------------------------------------------------------------
| Admin Note
|--------------------------------------------------------------------------
*/

$adminNote = null;

if (array_key_exists("admin_note", $data)) {

    if (
        $data["admin_note"] !== null &&
        !is_string($data["admin_note"])
    ) {
        jsonResponse(
            false,
            "Admin note must be a string.",
            null,
            422
        );
    }

    $adminNote = $data["admin_note"] === null
        ? null
        : trim($data["admin_note"]);

    if (
        $adminNote !== null &&
        mb_strlen($adminNote) > 5000
    ) {
        jsonResponse(
            false,
            "Admin note is too long.",
            null,
            422
        );
    }
}

/*
|--------------------------------------------------------------------------
| At Least One Field
|--------------------------------------------------------------------------
*/

if ($status === null && !array_key_exists("admin_note", $data)) {
    jsonResponse(
        false,
        "Nothing to update.",
        null,
        422
    );
}

try {

    $pdo->beginTransaction();

    /*
    |--------------------------------------------------------------------------
    | Lock Request
    |--------------------------------------------------------------------------
    */

    $checkStmt = $pdo->prepare("
        SELECT
            id,
            request_number,
            status,
            admin_note
        FROM product_requests
        WHERE id = :id
        FOR UPDATE
    ");

    $checkStmt->execute([
        ":id" => (int)$requestId
    ]);

    $request = $checkStmt->fetch();

    if (!$request) {

        $pdo->rollBack();

        jsonResponse(
            false,
            "Product request not found.",
            null,
            404
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Build Update Query
    |--------------------------------------------------------------------------
    */

    $updates = [];
    $params = [
        ":id" => (int)$requestId
    ];

    if ($status !== null) {

        $updates[] = "status = :status";
        $params[":status"] = $status;
    }

    if (array_key_exists("admin_note", $data)) {

        $updates[] = "admin_note = :admin_note";
        $params[":admin_note"] = $adminNote;
    }

    if (empty($updates)) {

        $pdo->rollBack();

        jsonResponse(
            false,
            "Nothing to update.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    $sql = "
        UPDATE product_requests
        SET " . implode(", ", $updates) . "
        WHERE id = :id
    ";

    $updateStmt = $pdo->prepare($sql);
    $updateStmt->execute($params);

    /*
    |--------------------------------------------------------------------------
    | Fetch Updated Request
    |--------------------------------------------------------------------------
    */

    $resultStmt = $pdo->prepare("
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

    $resultStmt->execute([
        ":id" => (int)$requestId
    ]);

    $updatedRequest = $resultStmt->fetch();

    $pdo->commit();

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Product request updated successfully.",
        $updatedRequest,
        200
    );

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "AshrafBazar Product Request Update Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to update product request.",
        null,
        500
    );
}