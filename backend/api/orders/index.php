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
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

/*
|--------------------------------------------------------------------------
| OPTIONS
|--------------------------------------------------------------------------
*/

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
| Authentication
|--------------------------------------------------------------------------
|
| middleware/auth.php already validates the JWT
| and provides $authUser.
|
*/

if (!isset($authUser) || !is_array($authUser)) {
    jsonResponse(
        false,
        "Authentication required.",
        null,
        401
    );
}

$authenticatedUserId = (int)($authUser["id"] ?? 0);
$authenticatedRole = strtolower(
    trim((string)($authUser["role"] ?? ""))
);

if ($authenticatedUserId <= 0) {
    jsonResponse(
        false,
        "Invalid authenticated user.",
        null,
        401
    );
}

/*
|--------------------------------------------------------------------------
| Admin Access
|--------------------------------------------------------------------------
|
| Admin and staff can see ALL customer orders.
|
| Customer can see ONLY their own orders.
|
*/

$isAdmin = in_array(
    $authenticatedRole,
    ["admin", "staff"],
    true
);

/*
|--------------------------------------------------------------------------
| Query Parameters
|--------------------------------------------------------------------------
*/

$status = trim(
    (string)($_GET["status"] ?? "")
);

$page = filter_input(
    INPUT_GET,
    "page",
    FILTER_VALIDATE_INT
);

$limit = filter_input(
    INPUT_GET,
    "limit",
    FILTER_VALIDATE_INT
);

$page = (
    $page !== false &&
    $page !== null
)
    ? $page
    : 1;

$limit = (
    $limit !== false &&
    $limit !== null
)
    ? $limit
    : 50;

/*
|--------------------------------------------------------------------------
| Pagination Protection
|--------------------------------------------------------------------------
*/

if ($page < 1) {
    $page = 1;
}

if ($limit < 1) {
    $limit = 50;
}

if ($limit > 100) {
    $limit = 100;
}

$offset = ($page - 1) * $limit;

/*
|--------------------------------------------------------------------------
| Allowed Order Status
|--------------------------------------------------------------------------
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
    $status !== "" &&
    !in_array($status, $allowedStatuses, true)
) {
    jsonResponse(
        false,
        "Invalid order status.",
        null,
        422
    );
}

try {

    /*
    |--------------------------------------------------------------------------
    | Build WHERE
    |--------------------------------------------------------------------------
    */

    $where = [];
    $params = [];

    /*
    |--------------------------------------------------------------------------
    | Customer Security
    |--------------------------------------------------------------------------
    |
    | Customers MUST only receive their own orders.
    |
    | Admin/staff can receive all orders.
    |
    */

    if (!$isAdmin) {

        $where[] = "o.user_id = :user_id";

        $params[":user_id"] = $authenticatedUserId;
    }

    /*
    |--------------------------------------------------------------------------
    | Status Filter
    |--------------------------------------------------------------------------
    */

    if ($status !== "") {

        $where[] = "o.order_status = :order_status";

        $params[":order_status"] = $status;
    }

    /*
    |--------------------------------------------------------------------------
    | WHERE SQL
    |--------------------------------------------------------------------------
    */

    $whereSql = "";

    if (!empty($where)) {

        $whereSql = "WHERE " .
            implode(" AND ", $where);
    }

    /*
    |--------------------------------------------------------------------------
    | Total Orders
    |--------------------------------------------------------------------------
    */

    $countSql = "
        SELECT COUNT(*)
        FROM orders o
        {$whereSql}
    ";

    $countStmt = $pdo->prepare($countSql);

    foreach ($params as $key => $value) {

        if ($key === ":user_id") {

            $countStmt->bindValue(
                $key,
                (int)$value,
                PDO::PARAM_INT
            );

        } else {

            $countStmt->bindValue(
                $key,
                (string)$value,
                PDO::PARAM_STR
            );
        }
    }

    $countStmt->execute();

    $totalOrders = (int)$countStmt->fetchColumn();

    /*
    |--------------------------------------------------------------------------
    | Fetch Orders
    |--------------------------------------------------------------------------
    */

    $orderSql = "
        SELECT
            o.id,
            o.order_number,
            o.user_id,

            o.customer_name,
            o.customer_mobile,
            o.customer_email,

            o.address_line,
            o.city,
            o.state,
            o.pincode,

            o.subtotal,
            o.delivery_charge,
            o.discount,
            o.total,

            o.payment_method,
            o.payment_status,
            o.order_status,

            o.notes,

            o.created_at,
            o.updated_at

        FROM orders o

        {$whereSql}

        ORDER BY o.created_at DESC, o.id DESC

        LIMIT :limit
        OFFSET :offset
    ";

    $stmt = $pdo->prepare($orderSql);

    foreach ($params as $key => $value) {

        if ($key === ":user_id") {

            $stmt->bindValue(
                $key,
                (int)$value,
                PDO::PARAM_INT
            );

        } else {

            $stmt->bindValue(
                $key,
                (string)$value,
                PDO::PARAM_STR
            );
        }
    }

    $stmt->bindValue(
        ":limit",
        $limit,
        PDO::PARAM_INT
    );

    $stmt->bindValue(
        ":offset",
        $offset,
        PDO::PARAM_INT
    );

    $stmt->execute();

    $orders = $stmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | No Orders
    |--------------------------------------------------------------------------
    */

    if (!$orders) {

        $totalPages = $totalOrders > 0
            ? (int)ceil(
                $totalOrders / $limit
            )
            : 0;

        jsonResponse(
            true,
            "Orders fetched successfully.",
            [
                "orders" => [],

                "pagination" => [
                    "page" => $page,
                    "limit" => $limit,
                    "total" => $totalOrders,
                    "total_pages" => $totalPages
                ]
            ],
            200
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize Order IDs
    |--------------------------------------------------------------------------
    */

    $orderIds = [];

    foreach ($orders as $order) {

        $orderIds[] = (int)$order["id"];
    }

    /*
    |--------------------------------------------------------------------------
    | Item Placeholders
    |--------------------------------------------------------------------------
    */

    $placeholders = [];
    $itemParams = [];

    foreach ($orderIds as $index => $orderId) {

        $placeholder =
            ":order_id_" . $index;

        $placeholders[] = $placeholder;

        $itemParams[$placeholder] =
            $orderId;
    }

    /*
    |--------------------------------------------------------------------------
    | Fetch Order Items
    |--------------------------------------------------------------------------
    */

    $itemsSql = "
        SELECT

            oi.id,
            oi.order_id,
            oi.product_id,

            oi.product_name,
            oi.sku,

            oi.price,
            oi.quantity,
            oi.total,

            p.slug AS product_slug,
            p.image AS product_image

        FROM order_items oi

        LEFT JOIN products p
            ON p.id = oi.product_id

        WHERE oi.order_id IN (
            " .
            implode(
                ", ",
                $placeholders
            ) .
            "
        )

        ORDER BY oi.id ASC
    ";

    $itemsStmt = $pdo->prepare(
        $itemsSql
    );

    foreach (
        $itemParams as $key => $value
    ) {

        $itemsStmt->bindValue(
            $key,
            (int)$value,
            PDO::PARAM_INT
        );
    }

    $itemsStmt->execute();

    $items = $itemsStmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Group Items
    |--------------------------------------------------------------------------
    */

    $itemsByOrder = [];

    foreach ($items as $item) {

        $orderId =
            (int)$item["order_id"];

        if (
            !isset(
                $itemsByOrder[$orderId]
            )
        ) {

            $itemsByOrder[$orderId] = [];
        }

        /*
        |----------------------------------------------------------------------
        | Type Casting
        |----------------------------------------------------------------------
        */

        $item["id"] =
            (int)$item["id"];

        $item["order_id"] =
            $orderId;

        if (
            $item["product_id"] !== null
        ) {

            $item["product_id"] =
                (int)$item["product_id"];
        }

        $item["price"] =
            (float)$item["price"];

        $item["quantity"] =
            (int)$item["quantity"];

        $item["total"] =
            (float)$item["total"];

        /*
        |----------------------------------------------------------------------
        | Product Image URL
        |----------------------------------------------------------------------
        */

        if (
            !empty(
                $item["product_image"]
            )
        ) {

            $item["product_image_url"] =
                rtrim(
                    UPLOAD_URL,
                    "/"
                ) .
                "/products/" .
                ltrim(
                    (string)$item["product_image"],
                    "/"
                );

        } else {

            $item["product_image_url"] =
                null;
        }

        $itemsByOrder[$orderId][] =
            $item;
    }

    /*
    |--------------------------------------------------------------------------
    | Prepare Final Orders
    |--------------------------------------------------------------------------
    */

    foreach ($orders as &$order) {

        $orderId =
            (int)$order["id"];

        /*
        |----------------------------------------------------------------------
        | Type Casting
        |----------------------------------------------------------------------
        */

        $order["id"] =
            $orderId;

        $order["user_id"] =
            $order["user_id"] !== null
                ? (int)$order["user_id"]
                : null;

        $order["subtotal"] =
            (float)$order["subtotal"];

        $order["delivery_charge"] =
            (float)$order["delivery_charge"];

        $order["discount"] =
            (float)$order["discount"];

        $order["total"] =
            (float)$order["total"];

        /*
        |----------------------------------------------------------------------
        | Items
        |----------------------------------------------------------------------
        */

        $order["items"] =
            $itemsByOrder[$orderId] ?? [];

        /*
        |----------------------------------------------------------------------
        | Item Count
        |----------------------------------------------------------------------
        */

        $itemCount = 0;

        foreach (
            $order["items"] as $item
        ) {

            $itemCount +=
                (int)$item["quantity"];
        }

        $order["item_count"] =
            $itemCount;
    }

    unset($order);

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    $totalPages =
        $totalOrders > 0
            ? (int)ceil(
                $totalOrders / $limit
            )
            : 0;

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Orders fetched successfully.",
        [
            "orders" => $orders,

            "pagination" => [
                "page" => $page,
                "limit" => $limit,
                "total" => $totalOrders,
                "total_pages" => $totalPages
            ],

            /*
            |--------------------------------------------------------------------------
            | Debug-free access information
            |--------------------------------------------------------------------------
            |
            | Useful for frontend behavior, but does not expose
            | sensitive information.
            |
            */

            "viewer" => [
                "role" => $authenticatedRole,
                "is_admin" => $isAdmin
            ]
        ],
        200
    );

} catch (PDOException $e) {

    /*
    |--------------------------------------------------------------------------
    | Server-side logging only
    |--------------------------------------------------------------------------
    */

    error_log(
        "AshrafBazar Orders Index Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch orders.",
        null,
        500
    );
}