<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

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

$requestOrigin =
    $_SERVER["HTTP_ORIGIN"] ?? "";

if (
    in_array(
        $requestOrigin,
        $allowedOrigins,
        true
    )
) {
    header(
        "Access-Control-Allow-Origin: " .
        $requestOrigin
    );
}

header("Vary: Origin");

header(
    "Access-Control-Allow-Methods: PUT, PATCH, OPTIONS"
);

header(
    "Access-Control-Allow-Headers: Content-Type, Authorization"
);

header(
    "Access-Control-Allow-Credentials: true"
);

header(
    "Content-Type: application/json; charset=UTF-8"
);

/*
|--------------------------------------------------------------------------
| OPTIONS / PREFLIGHT
|--------------------------------------------------------------------------
*/

if (
    ($_SERVER["REQUEST_METHOD"] ?? "") ===
    "OPTIONS"
) {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| METHOD
|--------------------------------------------------------------------------
*/

$method =
    $_SERVER["REQUEST_METHOD"] ?? "";

if (
    $method !== "PUT" &&
    $method !== "PATCH"
) {
    jsonResponse(
        false,
        "Only PUT or PATCH request is allowed.",
        null,
        405
    );
}

/*
|--------------------------------------------------------------------------
| ADMIN / STAFF AUTHENTICATION
|--------------------------------------------------------------------------
*/

requireAdmin();

/*
|--------------------------------------------------------------------------
| READ JSON
|--------------------------------------------------------------------------
*/

$rawInput =
    file_get_contents("php://input");

if (
    $rawInput === false ||
    strlen($rawInput) > 20000
) {
    jsonResponse(
        false,
        "Invalid request.",
        null,
        400
    );
}

$input =
    json_decode(
        $rawInput,
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
| ORDER ID
|--------------------------------------------------------------------------
*/

$orderId = filter_var(
    $input["order_id"] ?? null,
    FILTER_VALIDATE_INT,
    [
        "options" => [
            "min_range" => 1
        ]
    ]
);

if (!$orderId) {
    jsonResponse(
        false,
        "Valid order_id is required.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| ORDER STATUS
|--------------------------------------------------------------------------
*/

$newStatus = strtolower(
    trim(
        (string) (
            $input["order_status"] ?? ""
        )
    )
);

/*
|--------------------------------------------------------------------------
| ALL VALID ORDER STATUSES
|--------------------------------------------------------------------------
|
| IMPORTANT:
| No step-by-step transition restriction.
|
| Example:
| pending -> delivered       allowed
| pending -> shipped         allowed
| confirmed -> delivered     allowed
| processing -> delivered    allowed
|
*/

$allowedStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "returned"
];

if (
    !in_array(
        $newStatus,
        $allowedStatuses,
        true
    )
) {
    jsonResponse(
        false,
        "Invalid order status.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| OPTIONAL PAYMENT STATUS
|--------------------------------------------------------------------------
*/

$paymentStatusProvided =
    array_key_exists(
        "payment_status",
        $input
    );

$newPaymentStatus = null;

if ($paymentStatusProvided) {

    $newPaymentStatus =
        strtolower(
            trim(
                (string)
                $input["payment_status"]
            )
        );

    $allowedPaymentStatuses = [
        "pending",
        "paid",
        "failed",
        "refunded"
    ];

    if (
        !in_array(
            $newPaymentStatus,
            $allowedPaymentStatuses,
            true
        )
    ) {
        jsonResponse(
            false,
            "Invalid payment status.",
            null,
            422
        );
    }
}

/*
|--------------------------------------------------------------------------
| OPTIONAL ADMIN NOTE
|--------------------------------------------------------------------------
*/

$adminNote = trim(
    (string) (
        $input["note"] ?? ""
    )
);

if (
    mb_strlen($adminNote) > 2000
) {
    jsonResponse(
        false,
        "Admin note is too long.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| TRANSACTION
|--------------------------------------------------------------------------
*/

try {

    $pdo->beginTransaction();

    /*
    |--------------------------------------------------------------------------
    | LOCK ORDER
    |--------------------------------------------------------------------------
    */

    $orderStmt = $pdo->prepare("
        SELECT
            id,
            order_number,
            user_id,
            subtotal,
            delivery_charge,
            discount,
            total,
            payment_method,
            payment_status,
            order_status,
            notes
        FROM orders
        WHERE id = :id
        LIMIT 1
        FOR UPDATE
    ");

    $orderStmt->execute([
        ":id" => $orderId
    ]);

    $order =
        $orderStmt->fetch();

    if (!$order) {

        $pdo->rollBack();

        jsonResponse(
            false,
            "Order not found.",
            null,
            404
        );
    }

    $currentStatus =
        (string)
        $order["order_status"];

    $currentPaymentStatus =
        (string)
        $order["payment_status"];

    /*
    |--------------------------------------------------------------------------
    | SAME STATUS
    |--------------------------------------------------------------------------
    */

    if (
        $currentStatus ===
            $newStatus &&
        !$paymentStatusProvided &&
        $adminNote === ""
    ) {

        $pdo->rollBack();

        jsonResponse(
            true,
            "Order is already in this status.",
            [
                "order_id" =>
                    (int)
                    $order["id"],

                "order_number" =>
                    $order["order_number"],

                "order_status" =>
                    $currentStatus,

                "payment_status" =>
                    $currentPaymentStatus
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENT STATUS UPDATE
    |--------------------------------------------------------------------------
    */

    if ($paymentStatusProvided) {

        /*
        |--------------------------------------------------------------------------
        | REFUND VALIDATION
        |--------------------------------------------------------------------------
        |
        | Refund is only allowed if payment was already paid.
        |
        */

        if (
            $newPaymentStatus ===
                "refunded" &&
            $currentPaymentStatus !==
                "paid"
        ) {

            $pdo->rollBack();

            jsonResponse(
                false,
                "Only a paid order can be marked as refunded.",
                null,
                400
            );
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE ORDERS PAYMENT STATUS
        |--------------------------------------------------------------------------
        */

        $paymentUpdateStmt =
            $pdo->prepare("
                UPDATE orders
                SET
                    payment_status =
                        :payment_status
                WHERE id = :id
            ");

        $paymentUpdateStmt->execute([
            ":payment_status" =>
                $newPaymentStatus,

            ":id" =>
                $orderId
        ]);

        /*
        |--------------------------------------------------------------------------
        | UPDATE LATEST PAYMENT RECORD
        |--------------------------------------------------------------------------
        */

        $paymentRecordStmt =
            $pdo->prepare("
                SELECT
                    id
                FROM payments
                WHERE order_id = :order_id
                ORDER BY id DESC
                LIMIT 1
                FOR UPDATE
            ");

        $paymentRecordStmt->execute([
            ":order_id" =>
                $orderId
        ]);

        $paymentRecord =
            $paymentRecordStmt->fetch();

        if ($paymentRecord) {

            $paymentRecordStatus =
                $newPaymentStatus ===
                    "paid"
                    ? "success"
                    : (
                        $newPaymentStatus ===
                            "refunded"
                            ? "refunded"
                            : $newPaymentStatus
                    );

            $paymentUpdate =
                $pdo->prepare("
                    UPDATE payments
                    SET
                        status = :status
                    WHERE id = :id
                ");

            $paymentUpdate->execute([
                ":status" =>
                    $paymentRecordStatus,

                ":id" =>
                    (int)
                    $paymentRecord["id"]
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | COD DELIVERED
    |--------------------------------------------------------------------------
    |
    | If COD order is directly marked delivered,
    | payment is considered collected.
    |
    */

    if (
        $newStatus === "delivered" &&
        $order["payment_method"] === "cod"
    ) {

        $newPaymentStatus =
            "paid";

        $paymentStatusProvided =
            true;

        /*
        |--------------------------------------------------------------------------
        | UPDATE ORDER PAYMENT
        |--------------------------------------------------------------------------
        */

        $codPaidStmt =
            $pdo->prepare("
                UPDATE orders
                SET
                    payment_status = 'paid'
                WHERE id = :id
            ");

        $codPaidStmt->execute([
            ":id" =>
                $orderId
        ]);

        /*
        |--------------------------------------------------------------------------
        | UPDATE LATEST PAYMENT RECORD
        |--------------------------------------------------------------------------
        */

        $paymentRecordStmt =
            $pdo->prepare("
                SELECT
                    id
                FROM payments
                WHERE order_id = :order_id
                ORDER BY id DESC
                LIMIT 1
                FOR UPDATE
            ");

        $paymentRecordStmt->execute([
            ":order_id" =>
                $orderId
        ]);

        $paymentRecord =
            $paymentRecordStmt->fetch();

        if ($paymentRecord) {

            $paymentUpdate =
                $pdo->prepare("
                    UPDATE payments
                    SET
                        status = 'success'
                    WHERE id = :id
                ");

            $paymentUpdate->execute([
                ":id" =>
                    (int)
                    $paymentRecord["id"]
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PREVENT UNPAID ONLINE ORDER FROM BEING DELIVERED
    |--------------------------------------------------------------------------
    */

    if (
        $newStatus === "delivered" &&
        $order["payment_method"] !== "cod"
    ) {

        /*
        | If payment status was changed in the same request,
        | use the new value.
        */

        $effectivePaymentStatus =
            $paymentStatusProvided
                ? (
                    $newPaymentStatus ??
                    $currentPaymentStatus
                )
                : $currentPaymentStatus;

        if (
            $effectivePaymentStatus !==
            "paid"
        ) {

            $pdo->rollBack();

            jsonResponse(
                false,
                "Online order cannot be marked delivered until payment is confirmed.",
                null,
                400
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STOCK RESTORE
    |--------------------------------------------------------------------------
    |
    | Stock should be restored only when moving INTO:
    |
    | cancelled
    | returned
    |
    | And NOT repeatedly when already cancelled/returned.
    |
    */

    $restoreStock = false;

    if (
        $newStatus === "cancelled" &&
        $currentStatus !== "cancelled"
    ) {
        $restoreStock = true;
    }

    if (
        $newStatus === "returned" &&
        $currentStatus !== "returned"
    ) {
        $restoreStock = true;
    }

    /*
    |--------------------------------------------------------------------------
    | FETCH ORDER ITEMS
    |--------------------------------------------------------------------------
    */

    $itemsStmt =
        $pdo->prepare("
            SELECT
                id,
                product_id,
                product_name,
                sku,
                price,
                quantity,
                total
            FROM order_items
            WHERE order_id = :order_id
            FOR UPDATE
        ");

    $itemsStmt->execute([
        ":order_id" =>
            $orderId
    ]);

    $items =
        $itemsStmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | RESTORE STOCK
    |--------------------------------------------------------------------------
    */

    if ($restoreStock) {

        foreach ($items as $item) {

            /*
            |--------------------------------------------------------------------------
            | PRODUCT ID
            |--------------------------------------------------------------------------
            */

            if (
                $item["product_id"] ===
                null
            ) {
                continue;
            }

            $productId =
                (int)
                $item["product_id"];

            $quantity =
                (int)
                $item["quantity"];

            if (
                $productId <= 0 ||
                $quantity <= 0
            ) {
                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | LOCK PRODUCT
            |--------------------------------------------------------------------------
            */

            $productStmt =
                $pdo->prepare("
                    SELECT
                        id,
                        stock,
                        status
                    FROM products
                    WHERE id = :id
                    LIMIT 1
                    FOR UPDATE
                ");

            $productStmt->execute([
                ":id" =>
                    $productId
            ]);

            $product =
                $productStmt->fetch();

            if (!$product) {
                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | NEW STOCK
            |--------------------------------------------------------------------------
            */

            $newStock =
                (int)
                $product["stock"] +
                $quantity;

            /*
            |--------------------------------------------------------------------------
            | PRODUCT STATUS
            |--------------------------------------------------------------------------
            */

            $productStatus =
                $newStock > 0
                    ? "active"
                    : "out_of_stock";

            /*
            |--------------------------------------------------------------------------
            | UPDATE PRODUCT STOCK
            |--------------------------------------------------------------------------
            */

            $updateStockStmt =
                $pdo->prepare("
                    UPDATE products
                    SET
                        stock = :stock,
                        status = :status
                    WHERE id = :id
                ");

            $updateStockStmt->execute([
                ":stock" =>
                    $newStock,

                ":status" =>
                    $productStatus,

                ":id" =>
                    $productId
            ]);

            /*
            |--------------------------------------------------------------------------
            | INVENTORY TRANSACTION
            |--------------------------------------------------------------------------
            */

            $inventoryStmt =
                $pdo->prepare("
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
                        'return',
                        :quantity,
                        'order',
                        :reference_id,
                        :note
                    )
                ");

            $inventoryNote =
                $newStatus === "cancelled"
                    ? "Stock restored after order cancellation: " .
                        $order["order_number"]
                    : "Stock restored after order return: " .
                        $order["order_number"];

            $inventoryStmt->execute([
                ":product_id" =>
                    $productId,

                ":quantity" =>
                    $quantity,

                ":reference_id" =>
                    $orderId,

                ":note" =>
                    $inventoryNote
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ADMIN NOTE
    |--------------------------------------------------------------------------
    */

    $finalNotes =
        (string) (
            $order["notes"] ?? ""
        );

    if ($adminNote !== "") {

        $timestamp =
            date("Y-m-d H:i:s");

        $finalNotes .=
            (
                $finalNotes !== ""
                    ? "\n\n"
                    : ""
            ) .
            "[" .
            $timestamp .
            "] Admin: " .
            $adminNote;
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE ORDER STATUS
    |--------------------------------------------------------------------------
    */

    $updateOrderStmt =
        $pdo->prepare("
            UPDATE orders
            SET
                order_status = :order_status,
                notes = :notes
            WHERE id = :id
        ");

    $updateOrderStmt->execute([
        ":order_status" =>
            $newStatus,

        ":notes" =>
            $finalNotes !== ""
                ? $finalNotes
                : null,

        ":id" =>
            $orderId
    ]);

    /*
    |--------------------------------------------------------------------------
    | COD CANCELLED / RETURNED
    |--------------------------------------------------------------------------
    |
    | Do not automatically refund COD.
    |
    */

    if (
        (
            $newStatus ===
                "cancelled" ||
            $newStatus ===
                "returned"
        ) &&
        $order["payment_method"] ===
            "cod" &&
        !$paymentStatusProvided
    ) {

        $codPaymentStmt =
            $pdo->prepare("
                UPDATE orders
                SET
                    payment_status = 'pending'
                WHERE id = :id
                  AND payment_method = 'cod'
            ");

        $codPaymentStmt->execute([
            ":id" =>
                $orderId
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | COMMIT
    |--------------------------------------------------------------------------
    */

    $pdo->commit();

    /*
    |--------------------------------------------------------------------------
    | FINAL ORDER
    |--------------------------------------------------------------------------
    */

    $finalStmt =
        $pdo->prepare("
            SELECT
                id,
                order_number,
                payment_method,
                payment_status,
                order_status,
                total,
                updated_at
            FROM orders
            WHERE id = :id
            LIMIT 1
        ");

    $finalStmt->execute([
        ":id" =>
            $orderId
    ]);

    $finalOrder =
        $finalStmt->fetch();

    if ($finalOrder) {

        $finalOrder["id"] =
            (int)
            $finalOrder["id"];

        $finalOrder["total"] =
            (float)
            $finalOrder["total"];
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Order updated successfully.",
        [
            "order" =>
                $finalOrder,

            "stock_restored" =>
                $restoreStock
        ]
    );

} catch (Throwable $e) {

    /*
    |--------------------------------------------------------------------------
    | ROLLBACK
    |--------------------------------------------------------------------------
    */

    if (
        $pdo->inTransaction()
    ) {
        $pdo->rollBack();
    }

    /*
    |--------------------------------------------------------------------------
    | SERVER LOG
    |--------------------------------------------------------------------------
    */

    error_log(
        "Order update error: " .
        $e->getMessage()
    );

    /*
    |--------------------------------------------------------------------------
    | SAFE RESPONSE
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        false,
        "Unable to update order.",
        null,
        500
    );
}