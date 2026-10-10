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
| Admin / Staff Only
|--------------------------------------------------------------------------
*/

requireAdmin();

/*
|--------------------------------------------------------------------------
| Customer ID
|--------------------------------------------------------------------------
*/

$customerId = filter_input(
    INPUT_GET,
    "id",
    FILTER_VALIDATE_INT
);

if (
    $customerId === false ||
    $customerId === null ||
    $customerId <= 0
) {
    jsonResponse(
        false,
        "Valid customer ID is required.",
        null,
        422
    );
}

try {

    /*
    |--------------------------------------------------------------------------
    | Customer Profile
    |--------------------------------------------------------------------------
    */

    $customerStmt = $pdo->prepare("
        SELECT
            id,
            name,
            email,
            mobile,
            role,
            status,
            created_at,
            updated_at
        FROM users
        WHERE id = :id
          AND role = 'customer'
        LIMIT 1
    ");

    $customerStmt->execute([
        ":id" => (int)$customerId
    ]);

    $customer = $customerStmt->fetch();

    if (!$customer) {
        jsonResponse(
            false,
            "Customer not found.",
            null,
            404
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Addresses
    |--------------------------------------------------------------------------
    */

    $addressStmt = $pdo->prepare("
        SELECT
            id,
            name,
            mobile,
            address_line,
            city,
            state,
            pincode,
            address_type,
            is_default,
            created_at,
            updated_at
        FROM addresses
        WHERE user_id = :user_id
        ORDER BY
            is_default DESC,
            id DESC
    ");

    $addressStmt->execute([
        ":user_id" => (int)$customerId
    ]);

    $addresses = $addressStmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Order Statistics
    |--------------------------------------------------------------------------
    */

    $statsStmt = $pdo->prepare("
        SELECT
            COUNT(*) AS total_orders,
            COALESCE(SUM(total), 0) AS total_spent,
            COALESCE(
                SUM(
                    CASE
                        WHEN order_status = 'delivered'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS delivered_orders,
            COALESCE(
                SUM(
                    CASE
                        WHEN order_status = 'cancelled'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS cancelled_orders
        FROM orders
        WHERE user_id = :user_id
    ");

    $statsStmt->execute([
        ":user_id" => (int)$customerId
    ]);

    $stats = $statsStmt->fetch();

    /*
    |--------------------------------------------------------------------------
    | Order History
    |--------------------------------------------------------------------------
    */

    $ordersStmt = $pdo->prepare("
        SELECT
            id,
            order_number,
            subtotal,
            delivery_charge,
            discount,
            total,
            payment_method,
            payment_status,
            order_status,
            created_at,
            updated_at
        FROM orders
        WHERE user_id = :user_id
        ORDER BY created_at DESC
        LIMIT 100
    ");

    $ordersStmt->execute([
        ":user_id" => (int)$customerId
    ]);

    $orders = $ordersStmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Format Numeric Values
    |--------------------------------------------------------------------------
    */

    $stats["total_orders"] =
        (int)$stats["total_orders"];

    $stats["total_spent"] =
        (float)$stats["total_spent"];

    $stats["delivered_orders"] =
        (int)$stats["delivered_orders"];

    $stats["cancelled_orders"] =
        (int)$stats["cancelled_orders"];

    foreach ($orders as &$order) {

        $order["id"] = (int)$order["id"];

        $order["subtotal"] =
            (float)$order["subtotal"];

        $order["delivery_charge"] =
            (float)$order["delivery_charge"];

        $order["discount"] =
            (float)$order["discount"];

        $order["total"] =
            (float)$order["total"];
    }

    unset($order);

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Customer details fetched successfully.",
        [
            "customer" => $customer,
            "addresses" => $addresses,
            "statistics" => $stats,
            "orders" => $orders
        ],
        200
    );

} catch (PDOException $e) {

    error_log(
        "AshrafBazar Customer Show Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch customer details.",
        null,
        500
    );
}