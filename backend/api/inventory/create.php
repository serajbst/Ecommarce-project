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
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

/*
|--------------------------------------------------------------------------
| Only POST allowed
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
| Admin / Staff
|--------------------------------------------------------------------------
*/

requireAdmin();

try {

    /*
    |--------------------------------------------------------------------------
    | Request Body
    |--------------------------------------------------------------------------
    */

    $input = json_decode(
        file_get_contents("php://input"),
        true
    );

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
    | Required Fields
    |--------------------------------------------------------------------------
    */

    $productId = isset($input["product_id"])
        ? filter_var(
            $input["product_id"],
            FILTER_VALIDATE_INT,
            [
                "options" => [
                    "min_range" => 1
                ]
            ]
        )
        : false;

    $type = isset($input["type"])
        ? trim((string) $input["type"])
        : "";

    $quantity = isset($input["quantity"])
        ? filter_var(
            $input["quantity"],
            FILTER_VALIDATE_INT
        )
        : false;

    $referenceType = isset($input["reference_type"])
        ? trim((string) $input["reference_type"])
        : null;

    $referenceId = isset($input["reference_id"])
        ? filter_var(
            $input["reference_id"],
            FILTER_VALIDATE_INT,
            [
                "options" => [
                    "min_range" => 1
                ]
            ]
        )
        : null;

    $note = isset($input["note"])
        ? trim((string) $input["note"])
        : null;

    /*
    |--------------------------------------------------------------------------
    | Validate Product
    |--------------------------------------------------------------------------
    */

    if ($productId === false) {
        jsonResponse(
            false,
            "Valid product_id is required.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Transaction Type
    |--------------------------------------------------------------------------
    */

    $allowedTypes = [
        "purchase",
        "sale",
        "return",
        "adjustment",
        "damage"
    ];

    if (!in_array($type, $allowedTypes, true)) {
        jsonResponse(
            false,
            "Invalid inventory transaction type.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Quantity
    |--------------------------------------------------------------------------
    */

   
if ($quantity === false || $quantity === 0) {
    jsonResponse(
        false,
        "Quantity must be a non-zero integer.",
        null,
        422
    );
}


    /*
    |--------------------------------------------------------------------------
    | Validate Optional Fields
    |--------------------------------------------------------------------------
    */

    if ($referenceType !== null) {

        if ($referenceType === "") {
            $referenceType = null;
        }

        if (
            $referenceType !== null &&
            mb_strlen($referenceType) > 50
        ) {
            jsonResponse(
                false,
                "Reference type is too long.",
                null,
                422
            );
        }
    }

    if ($note !== null) {

        if ($note === "") {
            $note = null;
        }

        if (
            $note !== null &&
            mb_strlen($note) > 2000
        ) {
            jsonResponse(
                false,
                "Note is too long.",
                null,
                422
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Transaction
    |--------------------------------------------------------------------------
    */

    $pdo->beginTransaction();

    /*
    |--------------------------------------------------------------------------
    | Lock Product Row
    |--------------------------------------------------------------------------
    */

    $productStmt = $pdo->prepare("
        SELECT
            id,
            name,
            sku,
            stock,
            status
        FROM products
        WHERE id = :id
        LIMIT 1
        FOR UPDATE
    ");

    $productStmt->execute([
        ":id" => $productId
    ]);

    $product = $productStmt->fetch();

    if (!$product) {

        $pdo->rollBack();

        jsonResponse(
            false,
            "Product not found.",
            null,
            404
        );
    }

    $currentStock = (int) $product["stock"];

    /*
    |--------------------------------------------------------------------------
    | Calculate New Stock
    |--------------------------------------------------------------------------
    |
    | purchase  -> stock increase
    | return    -> stock increase
    | sale      -> stock decrease
    | damage    -> stock decrease
    | adjustment -> quantity is treated as signed adjustment
    |
    */

    $newStock = $currentStock;

    if ($type === "purchase" || $type === "return") {

        $newStock = $currentStock + $quantity;

    } elseif ($type === "sale" || $type === "damage") {

        if ($quantity > $currentStock) {

            $pdo->rollBack();

            jsonResponse(
                false,
                "Insufficient stock.",
                [
                    "current_stock" => $currentStock,
                    "requested_quantity" => $quantity
                ],
                422
            );
        }

        $newStock = $currentStock - $quantity;

    
} elseif ($type === "adjustment") {

    // Quantity current stock mein add hone wala difference hai.
    $newStock = $currentStock + $quantity;

    if ($newStock < 0) {
        $pdo->rollBack();

        jsonResponse(
            false,
            "Adjustment would result in negative stock.",
            [
                "current_stock" => $currentStock,
                "adjustment" => $quantity
            ],
            422
        );
    }
}


    /*
    |--------------------------------------------------------------------------
    | Update Product Stock
    |--------------------------------------------------------------------------
    */

    $newStatus = $product["status"];

    if ($newStock <= 0) {
        $newStatus = "out_of_stock";
    } elseif ($product["status"] === "out_of_stock") {
        $newStatus = "active";
    }

    $updateStmt = $pdo->prepare("
        UPDATE products
        SET
            stock = :stock,
            status = :status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
    ");

    $updateStmt->execute([
        ":stock" => $newStock,
        ":status" => $newStatus,
        ":id" => $productId
    ]);

    /*
    |--------------------------------------------------------------------------
    | Insert Inventory Transaction
    |--------------------------------------------------------------------------
    */

    $insertStmt = $pdo->prepare("
        INSERT INTO inventory_transactions (
            product_id,
            type,
            quantity,
            reference_type,
            reference_id,
            note
        )
        VALUES (
            :product_id,
            :type,
            :quantity,
            :reference_type,
            :reference_id,
            :note
        )
    ");

    $insertStmt->execute([
        ":product_id" => $productId,
        ":type" => $type,
        ":quantity" => $quantity,
        ":reference_type" => $referenceType,
        ":reference_id" =>
            $referenceId !== null && $referenceId !== false
                ? $referenceId
                : null,
        ":note" => $note
    ]);

    $transactionId = (int) $pdo->lastInsertId();

    $pdo->commit();

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Inventory transaction created successfully.",
        [
            "transaction_id" => $transactionId,
            "product" => [
                "id" => (int) $product["id"],
                "name" => $product["name"],
                "sku" => $product["sku"]
            ],
            "transaction" => [
                "type" => $type,
                "quantity" => $quantity,
                "previous_stock" => $currentStock,
                "new_stock" => $newStock
            ]
        ],
        201
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "Inventory create database error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Database error occurred while updating inventory.",
        null,
        500
    );

} catch (Exception $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "Inventory create error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Something went wrong.",
        null,
        500
    );
}