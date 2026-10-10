<?php

declare(strict_types=1);

require_once "../../config/database.php";
require_once "../../config/config.php";
require_once "../../config/response.php";
require_once "../../middleware/auth.php";

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

/*
|--------------------------------------------------------------------------
| Only GET allowed
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
| Admin / Staff
|--------------------------------------------------------------------------
*/

requireAdmin();

try {

    /*
    |--------------------------------------------------------------------------
    | Product ID
    |--------------------------------------------------------------------------
    */

    $productId = filter_input(
        INPUT_GET,
        "product_id",
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
            "Valid product_id is required.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Product
    |--------------------------------------------------------------------------
    */

    $productStmt = $pdo->prepare("
        SELECT
            p.id,
            p.name,
            p.slug,
            p.sku,
            p.stock,
            p.low_stock_limit,
            p.status,
            p.price,
            p.updated_at,

            c.id AS category_id,
            c.name AS category_name

        FROM products p

        INNER JOIN categories c
            ON c.id = p.category_id

        WHERE p.id = :product_id

        LIMIT 1
    ");

    $productStmt->execute([
        ":product_id" => $productId
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
    | Inventory History
    |--------------------------------------------------------------------------
    */

    $historyStmt = $pdo->prepare("
        SELECT
            id,
            product_id,
            type,
            quantity,
            reference_type,
            reference_id,
            note,
            created_at

        FROM inventory_transactions

        WHERE product_id = :product_id

        ORDER BY id DESC
    ");

    $historyStmt->execute([
        ":product_id" => $productId
    ]);

    $history = $historyStmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Numeric Values
    |--------------------------------------------------------------------------
    */

    $product["id"] = (int) $product["id"];
    $product["category_id"] = (int) $product["category_id"];
    $product["stock"] = (int) $product["stock"];
    $product["low_stock_limit"] = (int) $product["low_stock_limit"];
    $product["price"] = (float) $product["price"];

    foreach ($history as &$transaction) {

        $transaction["id"] =
            (int) $transaction["id"];

        $transaction["product_id"] =
            (int) $transaction["product_id"];

        $transaction["quantity"] =
            (int) $transaction["quantity"];

        $transaction["reference_id"] =
            $transaction["reference_id"] !== null
                ? (int) $transaction["reference_id"]
                : null;
    }

    unset($transaction);

    /*
    |--------------------------------------------------------------------------
    | Stock Status
    |--------------------------------------------------------------------------
    */

    if ($product["stock"] <= 0) {

        $stockStatus = "out_of_stock";

    } elseif (
        $product["stock"] <=
        $product["low_stock_limit"]
    ) {

        $stockStatus = "low_stock";

    } else {

        $stockStatus = "in_stock";
    }

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Inventory details fetched successfully.",
        [
            "product" => $product,

            "stock_status" => $stockStatus,

            "transactions" => $history,

            "transaction_count" => count($history)
        ],
        200
    );

} catch (PDOException $e) {

    error_log(
        "Inventory show database error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Database error occurred while fetching inventory.",
        null,
        500
    );

} catch (Exception $e) {

    error_log(
        "Inventory show error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Something went wrong.",
        null,
        500
    );
}