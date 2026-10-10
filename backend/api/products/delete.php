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

$allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $origin);
}

header("Vary: Origin");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

/*
|--------------------------------------------------------------------------
| OPTIONS
|--------------------------------------------------------------------------
*/

if (
    ($_SERVER["REQUEST_METHOD"] ?? "") === "OPTIONS"
) {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Method
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
| Admin Only
|--------------------------------------------------------------------------
*/

requireAdminOnly();

try {

    /*
    |--------------------------------------------------------------------------
    | Product ID
    |--------------------------------------------------------------------------
    */

    $productId = filter_input(
        INPUT_GET,
        "id",
        FILTER_VALIDATE_INT,
        [
            "options" => [
                "min_range" => 1
            ]
        ]
    );

    if (!$productId) {
        jsonResponse(
            false,
            "Valid product ID is required.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Transaction
    |--------------------------------------------------------------------------
    */

    $pdo->beginTransaction();

    /*
    |--------------------------------------------------------------------------
    | Lock Product
    |--------------------------------------------------------------------------
    */

    $checkStmt = $pdo->prepare("
        SELECT
            id,
            name,
            status
        FROM products
        WHERE id = :id
        LIMIT 1
        FOR UPDATE
    ");

    $checkStmt->execute([
        ":id" => $productId
    ]);

    $product = $checkStmt->fetch();

    if (!$product) {

        $pdo->rollBack();

        jsonResponse(
            false,
            "Product not found.",
            null,
            404
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Already Inactive
    |--------------------------------------------------------------------------
    */

    if ($product["status"] === "inactive") {

        $pdo->rollBack();

        jsonResponse(
            false,
            "Product is already deleted.",
            null,
            409
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Soft Delete
    |--------------------------------------------------------------------------
    |
    | Product permanently delete nahi hoga.
    | Historical order/review/wishlist records safe rahenge.
    |
    */

    $stmt = $pdo->prepare("
        UPDATE products
        SET
            status = 'inactive',
            featured = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
    ");

    $stmt->execute([
        ":id" => $productId
    ]);

    if ($stmt->rowCount() !== 1) {

        $pdo->rollBack();

        jsonResponse(
            false,
            "Unable to delete product.",
            null,
            500
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Commit
    |--------------------------------------------------------------------------
    */

    $pdo->commit();

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Product deleted successfully.",
        [
            "product_id" => (int) $product["id"],
            "product_name" => $product["name"]
        ],
        200
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "AshrafBazar Product Delete PDO Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to delete product.",
        null,
        500
    );

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "AshrafBazar Product Delete Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to delete product.",
        null,
        500
    );
}