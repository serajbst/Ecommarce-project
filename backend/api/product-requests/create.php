<?php

declare(strict_types=1);

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../config/Response.php";

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

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Only POST
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    jsonResponse(
        false,
        "Only POST method is allowed.",
        null,
        405
    );
}

/*
|--------------------------------------------------------------------------
| Read JSON Body
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
| Input Helper
|--------------------------------------------------------------------------
*/

$getString = function (
    string $key,
    int $maxLength,
    bool $required = false
) use ($data): ?string {

    if (!array_key_exists($key, $data) || $data[$key] === null) {

        if ($required) {
            jsonResponse(
                false,
                ucfirst(str_replace("_", " ", $key)) . " is required.",
                null,
                422
            );
        }

        return null;
    }

    if (!is_string($data[$key])) {
        jsonResponse(
            false,
            ucfirst(str_replace("_", " ", $key)) . " must be a string.",
            null,
            422
        );
    }

    $value = trim($data[$key]);

    if ($required && $value === "") {
        jsonResponse(
            false,
            ucfirst(str_replace("_", " ", $key)) . " is required.",
            null,
            422
        );
    }

    if (mb_strlen($value) > $maxLength) {
        jsonResponse(
            false,
            ucfirst(str_replace("_", " ", $key))
            . " is too long.",
            null,
            422
        );
    }

    return $value === "" ? null : $value;
};

/*
|--------------------------------------------------------------------------
| Product Information
|--------------------------------------------------------------------------
*/

$productName = $getString(
    "product_name",
    200,
    true
);

$category = $getString(
    "category",
    100
);

$brandModel = $getString(
    "brand_model",
    200
);

$description = $getString(
    "description",
    5000
);

/*
|--------------------------------------------------------------------------
| Quantity
|--------------------------------------------------------------------------
*/

if (!array_key_exists("quantity", $data)) {
    $quantity = 1;
} else {

    if (
        !is_int($data["quantity"]) &&
        !is_numeric($data["quantity"])
    ) {
        jsonResponse(
            false,
            "Quantity must be a valid number.",
            null,
            422
        );
    }

    $quantity = filter_var(
        $data["quantity"],
        FILTER_VALIDATE_INT
    );

    if (
        $quantity === false ||
        $quantity < 1 ||
        $quantity > 100000
    ) {
        jsonResponse(
            false,
            "Quantity must be between 1 and 100000.",
            null,
            422
        );
    }
}

/*
|--------------------------------------------------------------------------
| Customer Information
|--------------------------------------------------------------------------
*/

$customerName = $getString(
    "customer_name",
    100,
    true
);

$mobile = $getString(
    "mobile",
    15,
    true
);

/*
|--------------------------------------------------------------------------
| Mobile Validation
|--------------------------------------------------------------------------
*/

if (!preg_match('/^[6-9][0-9]{9}$/', $mobile)) {
    jsonResponse(
        false,
        "Enter a valid 10-digit mobile number.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Address
|--------------------------------------------------------------------------
*/

$addressLine = $getString(
    "address_line",
    1000
);

$city = $getString(
    "city",
    100,
    false
);

$pincode = $getString(
    "pincode",
    10,
    false
);

/*
|--------------------------------------------------------------------------
| Pincode Validation
|--------------------------------------------------------------------------
*/

if (
    $pincode !== null &&
    !preg_match('/^[1-9][0-9]{5}$/', $pincode)
) {
    jsonResponse(
        false,
        "Enter a valid 6-digit pincode.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Generate Secure Request Number
|--------------------------------------------------------------------------
*/

try {

    /*
    |--------------------------------------------------------------------------
    | Transaction
    |--------------------------------------------------------------------------
    */

    $pdo->beginTransaction();

    $requestNumber = null;

    /*
    |--------------------------------------------------------------------------
    | Unique Request Number
    |--------------------------------------------------------------------------
    */

    for ($attempt = 0; $attempt < 5; $attempt++) {

        $candidate =
            "PR"
            . date("ymd")
            . strtoupper(
                bin2hex(random_bytes(3))
            );

        $checkStmt = $pdo->prepare("
            SELECT id
            FROM product_requests
            WHERE request_number = :request_number
            LIMIT 1
        ");

        $checkStmt->execute([
            ":request_number" => $candidate
        ]);

        if (!$checkStmt->fetch()) {
            $requestNumber = $candidate;
            break;
        }
    }

    if ($requestNumber === null) {
        $pdo->rollBack();

        jsonResponse(
            false,
            "Unable to generate request number.",
            null,
            500
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Insert Request
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        INSERT INTO product_requests (
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
            status
        )
        VALUES (
            :request_number,
            NULL,
            :product_name,
            :category,
            :quantity,
            :brand_model,
            :description,
            :customer_name,
            :mobile,
            :address_line,
            :city,
            :pincode,
            'pending'
        )
    ");

    $stmt->execute([
        ":request_number" => $requestNumber,
        ":product_name" => $productName,
        ":category" => $category,
        ":quantity" => $quantity,
        ":brand_model" => $brandModel,
        ":description" => $description,
        ":customer_name" => $customerName,
        ":mobile" => $mobile,
        ":address_line" => $addressLine,
        ":city" => $city,
        ":pincode" => $pincode
    ]);

    $requestId = (int)$pdo->lastInsertId();

    $pdo->commit();

    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Product request submitted successfully.",
        [
            "id" => $requestId,
            "request_number" => $requestNumber,
            "status" => "pending"
        ],
        201
    );

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "AshrafBazar Product Request Create Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to submit product request.",
        null,
        500
    );
}