<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| AshrafBazar - Invoice API
|--------------------------------------------------------------------------
| File:
| backend/api/invoices/show.php
|
| Method:
| GET
|
| Examples:
| ?order_id=27
| ?order_number=AB202610030001
|
| Access:
| Customer -> Only own invoice
| Admin    -> Any invoice
| Staff    -> Any invoice
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Load Configuration
|--------------------------------------------------------------------------
*/

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../config/Response.php";


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

    header(
        "Access-Control-Allow-Origin: " . $origin
    );

    header("Vary: Origin");
}

header(
    "Access-Control-Allow-Headers: Authorization, Content-Type, Accept"
);

header(
    "Access-Control-Allow-Methods: GET, OPTIONS"
);

header(
    "Access-Control-Allow-Credentials: true"
);

header(
    "Content-Type: application/json; charset=UTF-8"
);


/*
|--------------------------------------------------------------------------
| OPTIONS / Preflight
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
| Only GET Allowed
|--------------------------------------------------------------------------
*/

if (
    ($_SERVER["REQUEST_METHOD"] ?? "") !== "GET"
) {

    jsonResponse(
        false,
        "Method not allowed.",
        null,
        405
    );
}


/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| auth.php:
| - Reads Bearer token
| - Verifies JWT
| - Checks user
| - Checks account status
| - Creates $authUser
|
|--------------------------------------------------------------------------
*/

require_once __DIR__ . "/../../middleware/auth.php";


/*
|--------------------------------------------------------------------------
| Authentication Safety Check
|--------------------------------------------------------------------------
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


/*
|--------------------------------------------------------------------------
| Read Request Parameters
|--------------------------------------------------------------------------
*/

$orderId = isset($_GET["order_id"])
    ? (int) $_GET["order_id"]
    : 0;

$orderNumber = trim(
    (string) (
        $_GET["order_number"] ?? ""
    )
);


/*
|--------------------------------------------------------------------------
| Validate Request
|--------------------------------------------------------------------------
*/

if (
    $orderId <= 0 &&
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
| Current Authenticated User
|--------------------------------------------------------------------------
*/

$currentUserId = (int) (
    $authUser["id"] ??
    $authUser["user_id"] ??
    0
);

$viewerRole = strtolower(
    trim(
        (string) (
            $authUser["role"] ?? ""
        )
    )
);


$isAdminOrStaff = in_array(
    $viewerRole,
    [
        "admin",
        "staff"
    ],
    true
);


/*
|--------------------------------------------------------------------------
| Validate Authenticated User
|--------------------------------------------------------------------------
*/

if ($currentUserId <= 0) {

    jsonResponse(
        false,
        "Invalid authenticated user.",
        null,
        401
    );
}


try {

    /*
    |--------------------------------------------------------------------------
    | Get Order
    |--------------------------------------------------------------------------
    */

    if ($orderId > 0) {

        $orderStmt = $pdo->prepare("
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

            WHERE o.id = :order_id

            LIMIT 1
        ");

        $orderStmt->execute([
            ":order_id" => $orderId
        ]);

    } else {

        $orderStmt = $pdo->prepare("
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

            WHERE o.order_number = :order_number

            LIMIT 1
        ");

        $orderStmt->execute([
            ":order_number" => $orderNumber
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Fetch Order
    |--------------------------------------------------------------------------
    */

    $order = $orderStmt->fetch();


    /*
    |--------------------------------------------------------------------------
    | Order Not Found
    |--------------------------------------------------------------------------
    */

    if (!$order) {

        jsonResponse(
            false,
            "Order not found.",
            null,
            404
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Authorization
    |--------------------------------------------------------------------------
    |
    | Admin/staff:
    | Can view any order.
    |
    | Customer:
    | Can view only their own order.
    |
    |--------------------------------------------------------------------------
    */

    if (!$isAdminOrStaff) {

        $orderUserId = $order["user_id"] !== null
            ? (int) $order["user_id"]
            : 0;


        if (
            $orderUserId <= 0 ||
            $orderUserId !== $currentUserId
        ) {

            jsonResponse(
                false,
                "You are not authorized to access this invoice.",
                null,
                403
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | Get Order Items
    |--------------------------------------------------------------------------
    |
    | Based on actual order_items schema:
    |
    | id
    | order_id
    | product_id
    | product_name
    | sku
    | price
    | quantity
    | total
    |
    |--------------------------------------------------------------------------
    */

    $itemsStmt = $pdo->prepare("
        SELECT
            oi.id,
            oi.product_id,
            oi.product_name,
            oi.sku,
            oi.price,
            oi.quantity,
            oi.total

        FROM order_items oi

        WHERE oi.order_id = :order_id

        ORDER BY oi.id ASC
    ");

    $itemsStmt->execute([
        ":order_id" => (int) $order["id"]
    ]);

    $items = $itemsStmt->fetchAll();


    /*
    |--------------------------------------------------------------------------
    | Get Latest Payment
    |--------------------------------------------------------------------------
    |
    | Based on actual payments schema:
    |
    | id
    | order_id
    | transaction_id
    | gateway
    | amount
    | status
    | response_data
    | created_at
    | updated_at
    |
    |--------------------------------------------------------------------------
    */

    $paymentStmt = $pdo->prepare("
        SELECT
            id,
            transaction_id,
            gateway,
            amount,
            status,
            created_at

        FROM payments

        WHERE order_id = :order_id

        ORDER BY id DESC

        LIMIT 1
    ");

    $paymentStmt->execute([
        ":order_id" => (int) $order["id"]
    ]);

    $payment = $paymentStmt->fetch();


    /*
    |--------------------------------------------------------------------------
    | Get Store Settings
    |--------------------------------------------------------------------------
    |
    | Based on actual settings schema:
    |
    | id
    | setting_key
    | setting_value
    | created_at
    | updated_at
    |
    |--------------------------------------------------------------------------
    */

    $settings = [];


    try {

        $settingsStmt = $pdo->prepare("
            SELECT
                setting_key,
                setting_value

            FROM settings

            WHERE setting_key IN (
                'store_name',
                'tagline',
                'city',
                'state',
                'currency'
            )
        ");

        $settingsStmt->execute();

        $settingsRows = $settingsStmt->fetchAll();


        foreach ($settingsRows as $setting) {

            $key = trim(
                (string) (
                    $setting["setting_key"] ?? ""
                )
            );


            if ($key === "") {
                continue;
            }


            $settings[$key] =
                (string) (
                    $setting["setting_value"] ?? ""
                );
        }

    } catch (Throwable $e) {

        /*
        |--------------------------------------------------------------------------
        | Settings failure should not stop invoice.
        |--------------------------------------------------------------------------
        */

        error_log(
            "AshrafBazar Invoice Settings Error: " .
            $e->getMessage()
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Store Information
    |--------------------------------------------------------------------------
    */

    $storeName = trim(
        (string) (
            $settings["store_name"] ??
            APP_NAME
        )
    );


    if ($storeName === "") {
        $storeName = APP_NAME;
    }


    $tagline = trim(
        (string) (
            $settings["tagline"] ??
            "Aapki Local Online Dukaan"
        )
    );


    $storeCity = trim(
        (string) (
            $settings["city"] ??
            "Simri Bakhtiyarpur"
        )
    );


    $storeState = trim(
        (string) (
            $settings["state"] ??
            "Bihar"
        )
    );


    $currency = trim(
        (string) (
            $settings["currency"] ??
            CURRENCY
        )
    );


    if ($currency === "") {
        $currency = CURRENCY;
    }


    /*
    |--------------------------------------------------------------------------
    | Money Formatter
    |--------------------------------------------------------------------------
    */

    $formatMoney = static function ($value): string {

        return number_format(
            (float) $value,
            2,
            ".",
            ""
        );
    };


    /*
    |--------------------------------------------------------------------------
    | Format Order Items
    |--------------------------------------------------------------------------
    */

    $formattedItems = [];


    foreach ($items as $item) {

        $quantity = (int) (
            $item["quantity"] ?? 0
        );


        $price = (float) (
            $item["price"] ?? 0
        );


        $total = (float) (
            $item["total"] ?? 0
        );


        $formattedItems[] = [

            "id" =>
                (int) $item["id"],


            "product_id" =>
                (int) (
                    $item["product_id"] ?? 0
                ),


            "product_name" =>
                (string) (
                    $item["product_name"] ?? ""
                ),


            "sku" =>
                $item["sku"] !== null
                    ? (string) $item["sku"]
                    : null,


            "quantity" =>
                $quantity,


            "price" =>
                $formatMoney($price),


            "total" =>
                $formatMoney($total)
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | Invoice Number
    |--------------------------------------------------------------------------
    */

    $invoiceNumber =
        "INV-" .
        (string) $order["order_number"];


    /*
    |--------------------------------------------------------------------------
    | Format Payment
    |--------------------------------------------------------------------------
    */

    $formattedPayment = null;


    if ($payment) {

        $formattedPayment = [

            "id" =>
                (int) (
                    $payment["id"] ?? 0
                ),


            /*
            | Actual DB column is gateway.
            | Frontend can treat it as payment method.
            */

            "payment_method" =>
                $payment["gateway"] !== null
                    ? (string) $payment["gateway"]
                    : (
                        string
                        (
                            $order["payment_method"] ?? ""
                        )
                    ),


            "transaction_id" =>
                $payment["transaction_id"] !== null
                    ? (string) $payment["transaction_id"]
                    : null,


            "amount" =>
                $formatMoney(
                    $payment["amount"] ?? 0
                ),


            "status" =>
                (string) (
                    $payment["status"] ?? ""
                ),


            /*
            | payments table has no paid_at.
            */

            "paid_at" =>
                null,


            "created_at" =>
                $payment["created_at"] ?? null
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | Invoice Data
    |--------------------------------------------------------------------------
    */

    $invoice = [

        /*
        |--------------------------------------------------------------------------
        | Invoice Information
        |--------------------------------------------------------------------------
        */

        "invoice_number" =>
            $invoiceNumber,


        "order_number" =>
            (string) $order["order_number"],


        "order_id" =>
            (int) $order["id"],


        "invoice_date" =>
            $order["created_at"],


        "order_status" =>
            (string) $order["order_status"],


        "payment_method" =>
            (string) (
                $order["payment_method"] ?? ""
            ),


        "payment_status" =>
            (string) $order["payment_status"],


        /*
        |--------------------------------------------------------------------------
        | Customer
        |--------------------------------------------------------------------------
        */

        "customer" => [

            "name" =>
                (string) $order["customer_name"],


            "mobile" =>
                (string) $order["customer_mobile"],


            "email" =>
                $order["customer_email"] !== null
                    ? (string) $order["customer_email"]
                    : null,


            "address_line" =>
                (string) $order["address_line"],


            "city" =>
                (string) $order["city"],


            "state" =>
                (string) $order["state"],


            "pincode" =>
                (string) $order["pincode"]
        ],


        /*
        |--------------------------------------------------------------------------
        | Items
        |--------------------------------------------------------------------------
        */

        "items" =>
            $formattedItems,


        /*
        |--------------------------------------------------------------------------
        | Summary
        |--------------------------------------------------------------------------
        */

        "summary" => [

            "subtotal" =>
                $formatMoney(
                    $order["subtotal"]
                ),


            "delivery_charge" =>
                $formatMoney(
                    $order["delivery_charge"]
                ),


            "discount" =>
                $formatMoney(
                    $order["discount"]
                ),


            "total" =>
                $formatMoney(
                    $order["total"]
                )
        ],


        /*
        |--------------------------------------------------------------------------
        | Payment
        |--------------------------------------------------------------------------
        */

        "payment" =>
            $formattedPayment,


        /*
        |--------------------------------------------------------------------------
        | Store
        |--------------------------------------------------------------------------
        */

        "store" => [

            "name" =>
                $storeName,


            "tagline" =>
                $tagline,


            "city" =>
                $storeCity,


            "state" =>
                $storeState,


            "currency" =>
                $currency
            
        ]
    ];


    /*
    |--------------------------------------------------------------------------
    | Success Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Invoice fetched successfully.",
        $invoice,
        200
    );


} catch (PDOException $e) {

    /*
    |--------------------------------------------------------------------------
    | Database Error
    |--------------------------------------------------------------------------
    */

    error_log(
        "AshrafBazar Invoice PDO Error: " .
        $e->getMessage()
    );


    jsonResponse(
        false,
        "Unable to load invoice.",
        null,
        500
    );


} catch (Throwable $e) {

    /*
    |--------------------------------------------------------------------------
    | Unexpected Error
    |--------------------------------------------------------------------------
    */

    error_log(
        "AshrafBazar Invoice Error: " .
        $e->getMessage()
    );


    jsonResponse(
        false,
        "Unable to process invoice request.",
        null,
        500
    );
}