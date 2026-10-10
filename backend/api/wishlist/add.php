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

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
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
| Authentication
|--------------------------------------------------------------------------
*/

requireAuth();

$userId = (int)$authUser["id"];

if ($userId <= 0) {
    jsonResponse(
        false,
        "Unauthorized.",
        null,
        401
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
| Product ID
|--------------------------------------------------------------------------
*/

if (!array_key_exists("product_id", $data)) {
    jsonResponse(
        false,
        "Product ID is required.",
        null,
        422
    );
}

$productId = filter_var(
    $data["product_id"],
    FILTER_VALIDATE_INT
);

if (
    $productId === false ||
    $productId <= 0
) {
    jsonResponse(
        false,
        "Invalid product ID.",
        null,
        422
    );
}

try {

    /*
    |--------------------------------------------------------------------------
    | Check Product
    |--------------------------------------------------------------------------
    */

    $productStmt = $pdo->prepare("
        SELECT
            id,
            name,
            status
        FROM products
        WHERE id = :product_id
        LIMIT 1
    ");

    $productStmt->execute([
        ":product_id" => (int)$productId
    ]);

    $product = $productStmt->fetch();

    if (!$product) {
        jsonResponse(
            false,
            "Product not found.",
            null,
            404
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent Inactive Product
    |--------------------------------------------------------------------------
    */

    if ($product["status"] === "inactive") {
        jsonResponse(
            false,
            "This product is currently unavailable.",
            null,
            409
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Check Existing Wishlist
    |--------------------------------------------------------------------------
    */

    $existingStmt = $pdo->prepare("
        SELECT id
        FROM wishlist
        WHERE user_id = :user_id
          AND product_id = :product_id
        LIMIT 1
    ");

    $existingStmt->execute([
        ":user_id" => $userId,
        ":product_id" => (int)$productId
    ]);

    $existing = $existingStmt->fetch();

    if ($existing) {
        jsonResponse(
            true,
            "Product is already in your wishlist.",
            [
                "wishlist_id" => (int)$existing["id"],
                "product_id" => (int)$productId
            ],
            200
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Add Wishlist
    |--------------------------------------------------------------------------
    */

    $insertStmt = $pdo->prepare("
        INSERT INTO wishlist (
            user_id,
            product_id
        )
        VALUES (
            :user_id,
            :product_id
        )
    ");

    $insertStmt->execute([
        ":user_id" => $userId,
        ":product_id" => (int)$productId
    ]);

    $wishlistId = (int)$pdo->lastInsertId();

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Product added to wishlist.",
        [
            "wishlist_id" => $wishlistId,
            "product_id" => (int)$productId,
            "product_name" => $product["name"]
        ],
        201
    );

} catch (PDOException $e) {

    /*
    |--------------------------------------------------------------------------
    | Handle Duplicate Race Condition
    |--------------------------------------------------------------------------
    */

    if ((int)$e->errorInfo[1] === 1062) {
        jsonResponse(
            true,
            "Product is already in your wishlist.",
            [
                "product_id" => (int)$productId
            ],
            200
        );
    }

    error_log(
        "AshrafBazar Wishlist Add Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to add product to wishlist.",
        null,
        500
    );
}