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
    "Access-Control-Allow-Methods: GET, OPTIONS"
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

if (
    ($_SERVER["REQUEST_METHOD"] ?? "") !==
    "GET"
) {
    jsonResponse(
        false,
        "Only GET method is allowed.",
        null,
        405
    );
}

/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
|
| middleware/auth.php already validates JWT
| and provides $authUser.
|
*/

if (
    !isset($authUser) ||
    !is_array($authUser)
) {
    jsonResponse(
        false,
        "Authentication required.",
        null,
        401
    );
}

$userId =
    (int) (
        $authUser["id"] ?? 0
    );

$userRole =
    strtolower(
        trim(
            (string) (
                $authUser["role"] ?? ""
            )
        )
    );

if ($userId <= 0) {
    jsonResponse(
        false,
        "Invalid authenticated user.",
        null,
        401
    );
}

/*
|--------------------------------------------------------------------------
| ORDER IDENTIFIER
|--------------------------------------------------------------------------
|
| Accept:
|
| ?id=123
|
| OR
|
| ?order_number=AB202610010001
|
*/

$orderId = filter_input(
    INPUT_GET,
    "id",
    FILTER_VALIDATE_INT
);

$orderNumber =
    trim(
        (string) (
            $_GET["order_number"] ?? ""
        )
    );

if (
    (
        $orderId === false ||
        $orderId === null ||
        $orderId <= 0
    )
    &&
    $orderNumber === ""
) {
    jsonResponse(
        false,
        "Order ID or order number is required.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| FETCH ORDER
|--------------------------------------------------------------------------
|
| ADMIN / STAFF:
| Can view any order.
|
| CUSTOMER:
| Can view only own order.
|
*/

try {

    /*
    |--------------------------------------------------------------------------
    | ADMIN / STAFF
    |--------------------------------------------------------------------------
    */

    if (
        $userRole === "admin" ||
        $userRole === "staff"
    ) {

        if (
            $orderId !== false &&
            $orderId !== null &&
            $orderId > 0
        ) {

            $stmt =
                $pdo->prepare("
                    SELECT
                        id,
                        order_number,
                        user_id,
                        customer_name,
                        customer_mobile,
                        customer_email,
                        address_line,
                        city,
                        state,
                        pincode,
                        subtotal,
                        delivery_charge,
                        discount,
                        total,
                        payment_method,
                        payment_status,
                        order_status,
                        notes,
                        created_at,
                        updated_at
                    FROM orders
                    WHERE id = :id
                    LIMIT 1
                ");

            $stmt->execute([
                ":id" =>
                    (int) $orderId
            ]);

        } else {

            if (
                strlen($orderNumber) > 100
            ) {
                jsonResponse(
                    false,
                    "Invalid order number.",
                    null,
                    422
                );
            }

            $stmt =
                $pdo->prepare("
                    SELECT
                        id,
                        order_number,
                        user_id,
                        customer_name,
                        customer_mobile,
                        customer_email,
                        address_line,
                        city,
                        state,
                        pincode,
                        subtotal,
                        delivery_charge,
                        discount,
                        total,
                        payment_method,
                        payment_status,
                        order_status,
                        notes,
                        created_at,
                        updated_at
                    FROM orders
                    WHERE order_number = :order_number
                    LIMIT 1
                ");

            $stmt->execute([
                ":order_number" =>
                    $orderNumber
            ]);
        }

    } else {

        /*
        |--------------------------------------------------------------------------
        | CUSTOMER
        |--------------------------------------------------------------------------
        |
        | Customer can only access own orders.
        |
        */

        if (
            $orderId !== false &&
            $orderId !== null &&
            $orderId > 0
        ) {

            $stmt =
                $pdo->prepare("
                    SELECT
                        id,
                        order_number,
                        user_id,
                        customer_name,
                        customer_mobile,
                        customer_email,
                        address_line,
                        city,
                        state,
                        pincode,
                        subtotal,
                        delivery_charge,
                        discount,
                        total,
                        payment_method,
                        payment_status,
                        order_status,
                        notes,
                        created_at,
                        updated_at
                    FROM orders
                    WHERE id = :id
                      AND user_id = :user_id
                    LIMIT 1
                ");

            $stmt->execute([
                ":id" =>
                    (int) $orderId,

                ":user_id" =>
                    $userId
            ]);

        } else {

            if (
                strlen($orderNumber) > 100
            ) {
                jsonResponse(
                    false,
                    "Invalid order number.",
                    null,
                    422
                );
            }

            $stmt =
                $pdo->prepare("
                    SELECT
                        id,
                        order_number,
                        user_id,
                        customer_name,
                        customer_mobile,
                        customer_email,
                        address_line,
                        city,
                        state,
                        pincode,
                        subtotal,
                        delivery_charge,
                        discount,
                        total,
                        payment_method,
                        payment_status,
                        order_status,
                        notes,
                        created_at,
                        updated_at
                    FROM orders
                    WHERE order_number = :order_number
                      AND user_id = :user_id
                    LIMIT 1
                ");

            $stmt->execute([
                ":order_number" =>
                    $orderNumber,

                ":user_id" =>
                    $userId
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FETCH ORDER
    |--------------------------------------------------------------------------
    */

    $order =
        $stmt->fetch();

    if (!$order) {

        jsonResponse(
            false,
            "Order not found.",
            null,
            404
        );
    }

    $orderId =
        (int) $order["id"];

    /*
    |--------------------------------------------------------------------------
    | FETCH ORDER ITEMS
    |--------------------------------------------------------------------------
    */

    $itemsStmt =
        $pdo->prepare("
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
            WHERE oi.order_id = :order_id
            ORDER BY oi.id ASC
        ");

    $itemsStmt->execute([
        ":order_id" =>
            $orderId
    ]);

    $items =
        $itemsStmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | FORMAT ITEMS
    |--------------------------------------------------------------------------
    */

    foreach (
        $items as &$item
    ) {

        $item["id"] =
            (int)
            $item["id"];

        $item["order_id"] =
            (int)
            $item["order_id"];

        if (
            $item["product_id"] !== null
        ) {
            $item["product_id"] =
                (int)
                $item["product_id"];
        }

        $item["price"] =
            (float)
            $item["price"];

        $item["quantity"] =
            (int)
            $item["quantity"];

        $item["total"] =
            (float)
            $item["total"];

        /*
        |--------------------------------------------------------------------------
        | PRODUCT IMAGE URL
        |--------------------------------------------------------------------------
        */

        if (
            !empty($item["product_image"])
        ) {

            $item["product_image_url"] =
                rtrim(
                    UPLOAD_URL,
                    "/"
                ) .
                "/products/" .
                ltrim(
                    (string)
                    $item["product_image"],
                    "/"
                );

        } else {

            $item["product_image_url"] =
                null;
        }
    }

    unset($item);

    /*
    |--------------------------------------------------------------------------
    | FETCH LATEST PAYMENT
    |--------------------------------------------------------------------------
    */

    $paymentStmt =
        $pdo->prepare("
            SELECT
                id,
                transaction_id,
                gateway,
                amount,
                status,
                created_at,
                updated_at
            FROM payments
            WHERE order_id = :order_id
            ORDER BY id DESC
            LIMIT 1
        ");

    $paymentStmt->execute([
        ":order_id" =>
            $orderId
    ]);

    $payment =
        $paymentStmt->fetch();

    if ($payment) {

        $payment["id"] =
            (int)
            $payment["id"];

        $payment["amount"] =
            (float)
            $payment["amount"];
    }

    /*
    |--------------------------------------------------------------------------
    | ORDER TIMELINE
    |--------------------------------------------------------------------------
    */

    $status =
        (string)
        $order["order_status"];

    $statusLabels = [

        "pending" =>
            "Order Placed",

        "confirmed" =>
            "Order Confirmed",

        "processing" =>
            "Order Processing",

        "shipped" =>
            "Order Shipped",

        "out_for_delivery" =>
            "Out for Delivery",

        "delivered" =>
            "Order Delivered",

        "cancelled" =>
            "Order Cancelled",

        "returned" =>
            "Order Returned"
    ];

    $statusSequence = [

        "pending",

        "confirmed",

        "processing",

        "shipped",

        "out_for_delivery",

        "delivered"
    ];

    $timeline = [];

    /*
    |--------------------------------------------------------------------------
    | CANCELLED / RETURNED TIMELINE
    |--------------------------------------------------------------------------
    */

    if (
        $status === "cancelled" ||
        $status === "returned"
    ) {

        $timeline[] = [

            "status" =>
                "pending",

            "label" =>
                "Order Placed",

            "completed" =>
                true,

            "current" =>
                false
        ];

        $timeline[] = [

            "status" =>
                $status,

            "label" =>
                $statusLabels[$status],

            "completed" =>
                true,

            "current" =>
                true
        ];

    } else {

        /*
        |--------------------------------------------------------------------------
        | NORMAL TIMELINE
        |--------------------------------------------------------------------------
        */

        $currentIndex =
            array_search(
                $status,
                $statusSequence,
                true
            );

        if (
            $currentIndex === false
        ) {
            $currentIndex = 0;
        }

        foreach (
            $statusSequence
            as $index => $timelineStatus
        ) {

            $timeline[] = [

                "status" =>
                    $timelineStatus,

                "label" =>
                    $statusLabels[
                        $timelineStatus
                    ],

                "completed" =>
                    $index <= $currentIndex,

                "current" =>
                    $timelineStatus ===
                    $status
            ];
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FORMAT ORDER
    |--------------------------------------------------------------------------
    */

    $order["id"] =
        $orderId;

    /*
    |--------------------------------------------------------------------------
    | SECURITY
    |--------------------------------------------------------------------------
    |
    | Don't expose internal user_id.
    |
    */

    unset(
        $order["user_id"]
    );

    $order["subtotal"] =
        (float)
        $order["subtotal"];

    $order["delivery_charge"] =
        (float)
        $order["delivery_charge"];

    $order["discount"] =
        (float)
        $order["discount"];

    $order["total"] =
        (float)
        $order["total"];

    $order["items"] =
        $items;

    $order["payment"] =
        $payment;

    $order["timeline"] =
        $timeline;

    /*
    |--------------------------------------------------------------------------
    | VIEWER ROLE
    |--------------------------------------------------------------------------
    */

    $order["viewer_role"] =
        (
            $userRole === "admin" ||
            $userRole === "staff"
        )
            ? "admin"
            : "customer";

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Order details fetched successfully.",
        [
            "order" =>
                $order
        ],
        200
    );

} catch (PDOException $e) {

    /*
    |--------------------------------------------------------------------------
    | SERVER LOG
    |--------------------------------------------------------------------------
    */

    error_log(
        "AshrafBazar Order Show Error: " .
        $e->getMessage()
    );

    /*
    |--------------------------------------------------------------------------
    | SAFE RESPONSE
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        false,
        "Unable to fetch order details.",
        null,
        500
    );
}