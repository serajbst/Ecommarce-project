<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

$allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
}

header("Vary: Origin");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

/*
|--------------------------------------------------------------------------
| Preflight
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Method
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed.",
        "data" => null,
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/Response.php";
require_once __DIR__ . "/../../middleware/auth.php";

/*
|--------------------------------------------------------------------------
| ADMIN AUTHORIZATION
|--------------------------------------------------------------------------
*/

requireAdmin();

/*
|--------------------------------------------------------------------------
| DASHBOARD DATA
|--------------------------------------------------------------------------
*/

try {

    /*
    |--------------------------------------------------------------------------
    | Current Month
    |--------------------------------------------------------------------------
    */

    $currentMonthStart = date("Y-m-01 00:00:00");
    $nextMonthStart = date(
        "Y-m-01 00:00:00",
        strtotime("+1 month")
    );

    /*
    |--------------------------------------------------------------------------
    | Total Sales This Month
    |
    | Only delivered orders are treated as completed sales.
    |--------------------------------------------------------------------------
    */

    $salesStmt = $pdo->prepare("
        SELECT
            COALESCE(SUM(total), 0) AS total_sales
        FROM orders
        WHERE order_status = 'delivered'
          AND created_at >= :month_start
          AND created_at < :next_month_start
    ");

    $salesStmt->execute([
        ":month_start" => $currentMonthStart,
        ":next_month_start" => $nextMonthStart,
    ]);

    $totalSales =
        (float) (
            $salesStmt->fetchColumn() ?? 0
        );

    /*
    |--------------------------------------------------------------------------
    | Orders This Month
    |
    | Cancelled and returned orders are excluded.
    |--------------------------------------------------------------------------
    */

    $ordersStmt = $pdo->prepare("
        SELECT
            COUNT(*) AS total_orders
        FROM orders
        WHERE created_at >= :month_start
          AND created_at < :next_month_start
          AND order_status NOT IN (
              'cancelled',
              'returned'
          )
    ");

    $ordersStmt->execute([
        ":month_start" => $currentMonthStart,
        ":next_month_start" => $nextMonthStart,
    ]);

    $totalOrders =
        (int) (
            $ordersStmt->fetchColumn() ?? 0
        );

    /*
    |--------------------------------------------------------------------------
    | Registered Customers
    |--------------------------------------------------------------------------
    */

    $customersStmt = $pdo->query("
        SELECT
            COUNT(*) AS total_customers
        FROM users
        WHERE role = 'customer'
    ");

    $totalCustomers =
        (int) (
            $customersStmt->fetchColumn() ?? 0
        );

    /*
    |--------------------------------------------------------------------------
    | Products
    |
    | Active + out_of_stock products are part of the catalog.
    |--------------------------------------------------------------------------
    */

    $productsStmt = $pdo->query("
        SELECT
            COUNT(*) AS total_products
        FROM products
        WHERE status IN (
            'active',
            'out_of_stock'
        )
    ");

    $totalProducts =
        (int) (
            $productsStmt->fetchColumn() ?? 0
        );

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Dashboard statistics loaded successfully.",
        [
            "stats" => [
                "total_sales" => round(
                    $totalSales,
                    2
                ),

                "orders" => $totalOrders,

                "customers" => $totalCustomers,

                "products" => $totalProducts,
            ],
        ]
    );

} catch (PDOException $e) {

    /*
    |--------------------------------------------------------------------------
    | Safe Database Error
    |--------------------------------------------------------------------------
    */

    error_log(
        "Dashboard Stats DB Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to load dashboard statistics.",
        null,
        500
    );

} catch (Throwable $e) {

    /*
    |--------------------------------------------------------------------------
    | Safe General Error
    |--------------------------------------------------------------------------
    */

    error_log(
        "Dashboard Stats Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to load dashboard statistics.",
        null,
        500
    );
}