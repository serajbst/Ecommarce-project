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
| Product ID
|--------------------------------------------------------------------------
*/

$productId = filter_input(
    INPUT_GET,
    "product_id",
    FILTER_VALIDATE_INT
);

if (
    $productId === false ||
    $productId === null ||
    $productId <= 0
) {
    jsonResponse(
        false,
        "Valid product ID is required.",
        null,
        422
    );
}

try {

    /*
    |--------------------------------------------------------------------------
    | Delete Only Current User's Wishlist Item
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        DELETE FROM wishlist
        WHERE user_id = :user_id
          AND product_id = :product_id
    ");

    $stmt->execute([
        ":user_id" => $userId,
        ":product_id" => (int)$productId
    ]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(
            false,
            "Product is not in your wishlist.",
            null,
            404
        );
    }

    jsonResponse(
        true,
        "Product removed from wishlist.",
        [
            "product_id" => (int)$productId
        ],
        200
    );

} catch (PDOException $e) {

    error_log(
        "AshrafBazar Wishlist Remove Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to remove product from wishlist.",
        null,
        500
    );
}