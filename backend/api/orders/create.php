<?php



declare(strict_types=1);



require_once __DIR__ . "/../../config/database.php";

require_once __DIR__ . "/../../config/config.php";

require_once __DIR__ . "/../../config/Response.php";
require_once __DIR__ . "/../../config/sendOrderNotification.php";
/*

|--------------------------------------------------------------------------

| CORS

|--------------------------------------------------------------------------

*/



$allowedOrigins = [

    "http://localhost:5173",

    "http://127.0.0.1:5173"

];



$requestOrigin = $_SERVER["HTTP_ORIGIN"] ?? "";



if (in_array($requestOrigin, $allowedOrigins, true)) {

    header("Access-Control-Allow-Origin: " . $requestOrigin);

}



header("Vary: Origin");

header("Access-Control-Allow-Methods: POST, OPTIONS");

header("Access-Control-Allow-Headers: Content-Type, Authorization");

header("Access-Control-Allow-Credentials: true");

header("Content-Type: application/json; charset=UTF-8");



/*

|--------------------------------------------------------------------------

| OPTIONS

|--------------------------------------------------------------------------

*/



if (($_SERVER["REQUEST_METHOD"] ?? "") === "OPTIONS") {

    http_response_code(204);

    exit;

}



/*

|--------------------------------------------------------------------------

| Method

|--------------------------------------------------------------------------

*/



if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") {

    jsonResponse(

        false,

        "Only POST method is allowed.",

        null,

        405

    );

}



/*

|--------------------------------------------------------------------------

| OPTIONAL AUTHENTICATION

|--------------------------------------------------------------------------

|

| Guest:

|   No Authorization header

|   -> user_id = NULL

|

| Logged-in:

|   Valid Bearer token

|   -> user_id = authenticated user ID

|

| Important:

|   If an Authorization header is supplied but invalid,

|   we DO NOT silently treat the request as guest.

|   The existing auth middleware will return 401.

|

|--------------------------------------------------------------------------

*/



$authUser = null;



$authorizationHeader = "";



if (

    isset($_SERVER["HTTP_AUTHORIZATION"]) &&

    trim((string)$_SERVER["HTTP_AUTHORIZATION"]) !== ""

) {

    $authorizationHeader = trim(

        (string)$_SERVER["HTTP_AUTHORIZATION"]

    );

} elseif (

    isset($_SERVER["REDIRECT_HTTP_AUTHORIZATION"]) &&

    trim((string)$_SERVER["REDIRECT_HTTP_AUTHORIZATION"]) !== ""

) {

    $authorizationHeader = trim(

        (string)$_SERVER["REDIRECT_HTTP_AUTHORIZATION"]

    );

} elseif (

    isset($_SERVER["HTTP_X_AUTHORIZATION"]) &&

    trim((string)$_SERVER["HTTP_X_AUTHORIZATION"]) !== ""

) {

    $authorizationHeader = trim(

        (string)$_SERVER["HTTP_X_AUTHORIZATION"]

    );

} elseif (function_exists("getallheaders")) {



    $headers = getallheaders();



    foreach ($headers as $key => $value) {



        if (

            strtolower((string)$key) === "authorization" &&

            trim((string)$value) !== ""

        ) {

            $authorizationHeader = trim(

                (string)$value

            );



            break;

        }

    }

}



/*

|--------------------------------------------------------------------------

| Authenticate Only When Token Is Supplied

|--------------------------------------------------------------------------

*/



if ($authorizationHeader !== "") {



    require_once __DIR__ . "/../../middleware/auth.php";



    /*

    | auth.php authenticates the token and exposes:

    | $authUser

    */



    if (

        !isset($authUser) ||

        !is_array($authUser)

    ) {

        jsonResponse(

            false,

            "Authentication failed.",

            null,

            401

        );

    }

}



/*

|--------------------------------------------------------------------------

| Resolve User ID

|--------------------------------------------------------------------------

*/



$userId = null;



if (is_array($authUser)) {



    $authenticatedUserId =

        (int)($authUser["id"] ?? 0);



    if ($authenticatedUserId <= 0) {



        jsonResponse(

            false,

            "Invalid authenticated user.",

            null,

            401

        );

    }



    $userId = $authenticatedUserId;

}



/*

|--------------------------------------------------------------------------

| Read JSON Request

|--------------------------------------------------------------------------

*/



$rawInput = file_get_contents("php://input");



if (

    $rawInput === false ||

    strlen($rawInput) > 50000

) {

    jsonResponse(

        false,

        "Invalid request.",

        null,

        400

    );

}



$input = json_decode(

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

| Customer Information

|--------------------------------------------------------------------------

*/



$customerName = trim(

    (string)($input["customer_name"] ?? "")

);



$customerMobile = trim(

    (string)($input["customer_mobile"] ?? "")

);



$customerEmail = strtolower(

    trim(

        (string)($input["customer_email"] ?? "")

    )

);



$addressLine = trim(

    (string)($input["address_line"] ?? "")

);



$city = trim(

    (string)($input["city"] ?? "")

);



$state = trim(

    (string)($input["state"] ?? "")

);



$pincode = trim(

    (string)($input["pincode"] ?? "")

);



$paymentMethod = strtolower(

    trim(

        (string)($input["payment_method"] ?? "")

    )

);



$notes = trim(

    (string)($input["notes"] ?? "")

);



$items = $input["items"] ?? [];



/*

|--------------------------------------------------------------------------

| Required Field Validation

|--------------------------------------------------------------------------

*/



if ($customerName === "") {



    jsonResponse(

        false,

        "Customer name is required.",

        null,

        422

    );

}



if (strlen($customerName) > 100) {



    jsonResponse(

        false,

        "Customer name is too long.",

        null,

        422

    );

}



/*

|--------------------------------------------------------------------------

| Mobile

|--------------------------------------------------------------------------

*/



if ($customerMobile === "") {



    jsonResponse(

        false,

        "Customer mobile number is required.",

        null,

        422

    );

}



if (

    !preg_match(

        "/^[6-9][0-9]{9}$/",

        $customerMobile

    )

) {



    jsonResponse(

        false,

        "Please enter a valid 10-digit mobile number.",

        null,

        422

    );

}



/*

|--------------------------------------------------------------------------

| Email

|--------------------------------------------------------------------------

*/



if ($customerEmail !== "") {



    if (

        strlen($customerEmail) > 150 ||

        !filter_var(

            $customerEmail,

            FILTER_VALIDATE_EMAIL

        )

    ) {



        jsonResponse(

            false,

            "Please enter a valid email address.",

            null,

            422

        );

    }

}



/*

|--------------------------------------------------------------------------

| Address

|--------------------------------------------------------------------------

*/



if ($addressLine === "") {



    jsonResponse(

        false,

        "Address is required.",

        null,

        422

    );

}



if (strlen($addressLine) > 1000) {



    jsonResponse(

        false,

        "Address is too long.",

        null,

        422

    );

}



/*

|--------------------------------------------------------------------------

| City

|--------------------------------------------------------------------------

*/



if ($city === "") {



    jsonResponse(

        false,

        "City is required.",

        null,

        422

    );

}



if (strlen($city) > 100) {



    jsonResponse(

        false,

        "City name is too long.",

        null,

        422

    );

}



/*

|--------------------------------------------------------------------------

| State

|--------------------------------------------------------------------------

*/



if ($state === "") {



    jsonResponse(

        false,

        "State is required.",

        null,

        422

    );

}



if (strlen($state) > 100) {



    jsonResponse(

        false,

        "State name is too long.",

        null,

        422

    );

}



/*

|--------------------------------------------------------------------------

| Pincode

|--------------------------------------------------------------------------

*/



if (

    !preg_match(

        "/^[0-9]{6}$/",

        $pincode

    )

) {



    jsonResponse(

        false,

        "Please enter a valid 6-digit pincode.",

        null,

        422

    );

}



/*

|--------------------------------------------------------------------------

| Payment Method

|--------------------------------------------------------------------------

*/



$allowedPaymentMethods = [

    "cod",

    "razorpay",

    "phonepe",

    "paytm"

];



if (

    !in_array(

        $paymentMethod,

        $allowedPaymentMethods,

        true

    )

) {



    jsonResponse(

        false,

        "Invalid payment method.",

        null,

        422

    );

}



/*

|--------------------------------------------------------------------------

| Online Payment Check

|--------------------------------------------------------------------------

*/



if ($paymentMethod !== "cod") {



    $onlinePaymentEnabledStmt =

        $pdo->prepare("

            SELECT setting_value

            FROM settings

            WHERE setting_key = 'online_payment_enabled'

            LIMIT 1

        ");



    $onlinePaymentEnabledStmt->execute();



    $onlinePaymentEnabled =

        $onlinePaymentEnabledStmt->fetchColumn();



    if (

        (string)$onlinePaymentEnabled !== "1"

    ) {



        jsonResponse(

            false,

            "Online payment is currently unavailable. Please choose Cash on Delivery.",

            null,

            422

        );

    }

}



/*

|--------------------------------------------------------------------------

| Order Items Validation

|--------------------------------------------------------------------------

*/



if (

    !is_array($items) ||

    count($items) < 1

) {



    jsonResponse(

        false,

        "At least one product is required.",

        null,

        422

    );

}



if (count($items) > 50) {



    jsonResponse(

        false,

        "Too many products in one order.",

        null,

        422

    );

}



/*

|--------------------------------------------------------------------------

| Normalize Order Items

|--------------------------------------------------------------------------

*/



$normalizedItems = [];



foreach ($items as $item) {



    if (!is_array($item)) {



        jsonResponse(

            false,

            "Invalid order item.",

            null,

            422

        );

    }



    $productId = filter_var(

        $item["product_id"] ?? null,

        FILTER_VALIDATE_INT

    );



    $quantity = filter_var(

        $item["quantity"] ?? null,

        FILTER_VALIDATE_INT

    );



    if (

        $productId === false ||

        $productId === null ||

        $productId <= 0

    ) {



        jsonResponse(

            false,

            "Invalid product ID.",

            null,

            422

        );

    }



    if (

        $quantity === false ||

        $quantity === null ||

        $quantity < 1 ||

        $quantity > 100

    ) {



        jsonResponse(

            false,

            "Invalid product quantity.",

            null,

            422

        );

    }



    /*

    |--------------------------------------------------------------------------

    | Merge Duplicate Product IDs

    |--------------------------------------------------------------------------

    */



    if (

        isset(

            $normalizedItems[$productId]

        )

    ) {



        $newQuantity =

            $normalizedItems[$productId]["quantity"]

            + $quantity;



        if ($newQuantity > 100) {



            jsonResponse(

                false,

                "Maximum quantity exceeded for a product.",

                null,

                422

            );

        }



        $normalizedItems[$productId]["quantity"] =

            $newQuantity;



    } else {



        $normalizedItems[$productId] = [

            "product_id" => (int)$productId,

            "quantity" => (int)$quantity

        ];

    }

}



$normalizedItems = array_values(

    $normalizedItems

);



/*

|--------------------------------------------------------------------------

| Transaction

|--------------------------------------------------------------------------

*/



try {



    $pdo->beginTransaction();



    /*

    |--------------------------------------------------------------------------

    | Verify Logged-in User

    |--------------------------------------------------------------------------

    |

    | Guest users skip this section.

    |

    */



    if ($userId !== null) {



        $userStmt = $pdo->prepare("

            SELECT

                id,

                name,

                email,

                mobile,

                role,

                status

            FROM users

            WHERE id = :user_id

            LIMIT 1

            FOR UPDATE

        ");



        $userStmt->execute([

            ":user_id" => $userId

        ]);



        $dbUser = $userStmt->fetch();



        if (

            !$dbUser ||

            ($dbUser["status"] ?? "") !== "active"

        ) {



            $pdo->rollBack();



            jsonResponse(

                false,

                "Your account is not available.",

                null,

                403

            );

        }

    }



    /*

    |--------------------------------------------------------------------------

    | Delivery Area

    |--------------------------------------------------------------------------

    |

    | First priority:

    | exact pincode

    |

    | Second priority:

    | matching city

    |

    */



    $deliveryStmt = $pdo->prepare("

        SELECT

            id,

            area_name,

            delivery_charge,

            minimum_order,

            estimated_days

        FROM delivery_areas

        WHERE status = 'active'

          AND (

                pincode = :delivery_pincode

                OR LOWER(city) = LOWER(:delivery_city)

          )

        ORDER BY

            CASE

                WHEN pincode = :exact_pincode

                THEN 0

                ELSE 1

            END,

            id ASC

        LIMIT 1

    ");



    $deliveryStmt->execute([

        ":delivery_pincode" => $pincode,

        ":delivery_city" => $city,

        ":exact_pincode" => $pincode

    ]);



    $deliveryArea =

        $deliveryStmt->fetch();



    if (!$deliveryArea) {



        $pdo->rollBack();



        jsonResponse(

            false,

            "Delivery is currently unavailable in your area.",

            null,

            422

        );

    }



    /*

    |--------------------------------------------------------------------------

    | Product Query With Row Lock

    |--------------------------------------------------------------------------

    */



    $productStmt = $pdo->prepare("

        SELECT

            id,

            category_id,

            name,

            sku,

            price,

            stock,

            status,

            image

        FROM products

        WHERE id = :product_id

        LIMIT 1

        FOR UPDATE

    ");



    $orderItems = [];



    $subtotal = 0.0;



    /*

    |--------------------------------------------------------------------------

    | Verify Every Product

    |--------------------------------------------------------------------------

    */



    foreach (

        $normalizedItems

        as $requestedItem

    ) {



        $productStmt->execute([

            ":product_id" =>

                $requestedItem["product_id"]

        ]);



        $product =

            $productStmt->fetch();



        if (!$product) {



            $pdo->rollBack();



            jsonResponse(

                false,

                "One of the selected products was not found.",

                null,

                404

            );

        }



        $stock =

            (int)$product["stock"];



        $quantity =

            (int)$requestedItem["quantity"];



        /*

        |--------------------------------------------------------------------------

        | Availability

        |--------------------------------------------------------------------------

        |

        | Product must be active AND have stock.

        |

        */



        if (

            ($product["status"] ?? "") !== "active"

        ) {



            /*

            | Special protection:

            | If old stale data says out_of_stock

            | but stock is actually available, do not

            | silently allow the order.

            |

            | Admin/database should correct the status.

            */



            $pdo->rollBack();



            jsonResponse(

                false,

                "Product '" .

                $product["name"] .

                "' is currently unavailable.",

                null,

                422

            );

        }



        if ($stock <= 0) {



            $pdo->rollBack();



            jsonResponse(

                false,

                "Product '" .

                $product["name"] .

                "' is out of stock.",

                null,

                422

            );

        }



        /*

        |--------------------------------------------------------------------------

        | Stock Check

        |--------------------------------------------------------------------------

        */



        if ($stock < $quantity) {



            $pdo->rollBack();



            jsonResponse(

                false,

                "Only " .

                $stock .

                " unit(s) of '" .

                $product["name"] .

                "' are available.",

                null,

                422

            );

        }



        /*

        |--------------------------------------------------------------------------

        | Price

        |--------------------------------------------------------------------------

        |

        | IMPORTANT:

        | Price always comes from database.

        | Frontend price is never trusted.

        |

        */



        $price =

            (float)$product["price"];



        if ($price < 0) {



            $pdo->rollBack();



            jsonResponse(

                false,

                "Invalid product price.",

                null,

                500

            );

        }



        $itemTotal =

            $price * $quantity;



        $subtotal += $itemTotal;



        $orderItems[] = [

            "product_id" =>

                (int)$product["id"],



            "product_name" =>

                (string)$product["name"],



            "product_image" =>
                $product["image"] !== null
                    ? (string)$product["image"]
                    : null,

            "sku" =>

                $product["sku"] !== null

                    ? (string)$product["sku"]

                    : null,



            "price" =>

                $price,



            "quantity" =>

                $quantity,



            "total" =>

                $itemTotal

        ];

    }



    /*

    |--------------------------------------------------------------------------

    | Minimum Order

    |--------------------------------------------------------------------------

    */



    $minimumOrder =

        (float)$deliveryArea["minimum_order"];



    if ($subtotal < $minimumOrder) {



        $pdo->rollBack();



        jsonResponse(

            false,

            "Minimum order amount is ₹" .

            number_format(

                $minimumOrder,

                2

            ),

            null,

            422

        );

    }



    /*

    |--------------------------------------------------------------------------

    | Delivery Charge

    |--------------------------------------------------------------------------

    */



    $deliveryCharge =

        (float)$deliveryArea["delivery_charge"];



    /*

    |--------------------------------------------------------------------------

    | Discount

    |--------------------------------------------------------------------------

    |

    | Coupon system is currently disabled.

    | Never trust frontend discount.

    |

    */



    $discount = 0.0;



    /*

    |--------------------------------------------------------------------------

    | Final Total

    |--------------------------------------------------------------------------

    */



    $total =

        $subtotal

        + $deliveryCharge

        - $discount;



    if ($total < 0) {

        $total = 0.0;

    }



    /*

    |--------------------------------------------------------------------------

    | Generate Unique Order Number

    |--------------------------------------------------------------------------

    */



    $orderNumber = "";



    for (

        $attempt = 0;

        $attempt < 10;

        $attempt++

    ) {



        $candidate =

            "AB"

            . date("Ymd")

            . strtoupper(

                bin2hex(

                    random_bytes(4)

                )

            );



        $checkStmt = $pdo->prepare("

            SELECT id

            FROM orders

            WHERE order_number = :order_number

            LIMIT 1

        ");



        $checkStmt->execute([

            ":order_number" =>

                $candidate

        ]);



        if (!$checkStmt->fetch()) {



            $orderNumber =

                $candidate;



            break;

        }

    }



    if ($orderNumber === "") {



        $pdo->rollBack();



        jsonResponse(

            false,

            "Unable to generate order number.",

            null,

            500

        );

    }



    /*

    |--------------------------------------------------------------------------

    | Create Order

    |--------------------------------------------------------------------------

    */



    $orderStmt = $pdo->prepare("

        INSERT INTO orders (

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

        )

        VALUES (

            :order_number,

            :user_id,

            :customer_name,

            :customer_mobile,

            :customer_email,

            :address_line,

            :city,

            :state,

            :pincode,

            :subtotal,

            :delivery_charge,

            :discount,

            :total,

            :payment_method,

            'pending',

            'pending',

            :notes,

            NOW(),

            NOW()

        )

    ");



    $orderStmt->execute([

        ":order_number" =>

            $orderNumber,



        /*

        | Guest:

        | NULL

        |

        | Logged-in:

        | authenticated user ID

        */

        ":user_id" =>

            $userId,



        ":customer_name" =>

            $customerName,



        ":customer_mobile" =>

            $customerMobile,



        ":customer_email" =>

            $customerEmail !== ""

                ? $customerEmail

                : null,



        ":address_line" =>

            $addressLine,



        ":city" =>

            $city,



        ":state" =>

            $state,



        ":pincode" =>

            $pincode,



        ":subtotal" =>

            $subtotal,



        ":delivery_charge" =>

            $deliveryCharge,



        ":discount" =>

            $discount,



        ":total" =>

            $total,



        ":payment_method" =>

            $paymentMethod,



        ":notes" =>

            $notes !== ""

                ? $notes

                : null

    ]);



    $orderId =

        (int)$pdo->lastInsertId();



    if ($orderId <= 0) {



        $pdo->rollBack();



        jsonResponse(

            false,

            "Unable to create order record.",

            null,

            500

        );

    }



    /*

    |--------------------------------------------------------------------------

    | Order Item Statement

    |--------------------------------------------------------------------------

    */



    $itemStmt = $pdo->prepare("

        INSERT INTO order_items (

            order_id,

            product_id,

            product_name,
            product_image,

            sku,

            price,

            quantity,

            total

        )

        VALUES (

            :order_id,

            :product_id,

            :product_name,
            :product_image,

            :sku,

            :price,

            :quantity,

            :total

        )

    ");



    /*

    |--------------------------------------------------------------------------

    | Inventory Sale Statement

    |--------------------------------------------------------------------------

    */



    $inventoryStmt = $pdo->prepare("

        INSERT INTO inventory_transactions (

            product_id,

            type,

            quantity,

            reference_type,

            reference_id,

            note,

            created_at

        )

        VALUES (

            :product_id,

            'sale',

            :quantity,

            'order',

            :reference_id,

            :note,

            NOW()

        )

    ");



    /*

    |--------------------------------------------------------------------------

    | Reduce Stock

    |--------------------------------------------------------------------------

    |

    | IMPORTANT:

    |

    | Stock 2 + order 1 = stock 1 + ACTIVE

    |

    | Stock 1 + order 1 = stock 0 + OUT_OF_STOCK

    |

    |--------------------------------------------------------------------------

    */



    $stockStmt = $pdo->prepare("

        UPDATE products

        SET

            stock = stock - :deduct_quantity_set,



            status = CASE

                WHEN stock - :deduct_quantity_case <= 0

                THEN 'out_of_stock'

                ELSE 'active'

            END,



            updated_at = NOW()



        WHERE id = :product_id

          AND stock >= :required_quantity

    ");



    /*

    |--------------------------------------------------------------------------

    | Process Order Items

    |--------------------------------------------------------------------------

    */



    foreach (

        $orderItems

        as $orderItem

    ) {



        /*

        |--------------------------------------------------------------------------

        | Insert Order Item

        |--------------------------------------------------------------------------

        */



        $itemStmt->execute([

            ":order_id" =>

                $orderId,



            ":product_id" =>

                $orderItem["product_id"],



            ":product_name" =>

                $orderItem["product_name"],

            ":product_image" =>
                $orderItem["product_image"],



            ":sku" =>

                $orderItem["sku"],



            ":price" =>

                $orderItem["price"],



            ":quantity" =>

                $orderItem["quantity"],



            ":total" =>

                $orderItem["total"]

        ]);



        /*

        |--------------------------------------------------------------------------

        | Reduce Stock

        |--------------------------------------------------------------------------

        */



        $stockStmt->execute([

            ":deduct_quantity_set" =>

                $orderItem["quantity"],



            ":deduct_quantity_case" =>

                $orderItem["quantity"],



            ":product_id" =>

                $orderItem["product_id"],



            ":required_quantity" =>

                $orderItem["quantity"]

        ]);



        /*

        |--------------------------------------------------------------------------

        | Stock Update Verification

        |--------------------------------------------------------------------------

        */



        if ($stockStmt->rowCount() !== 1) {



            $pdo->rollBack();



            jsonResponse(

                false,

                "Unable to reserve product stock.",

                null,

                409

            );

        }



        /*

        |--------------------------------------------------------------------------

        | Inventory Transaction

        |--------------------------------------------------------------------------

        */



        $inventoryStmt->execute([

            ":product_id" =>

                $orderItem["product_id"],



            ":quantity" =>

                $orderItem["quantity"],



            ":reference_id" =>

                $orderId,



            ":note" =>

                "Stock deducted for order " .

                $orderNumber

        ]);

    }



    /*

    |--------------------------------------------------------------------------

    | Payment Record

    |--------------------------------------------------------------------------

    */



    $paymentStmt = $pdo->prepare("

        INSERT INTO payments (

            order_id,

            transaction_id,

            gateway,

            amount,

            status,

            response_data,

            created_at,

            updated_at

        )

        VALUES (

            :order_id,

            NULL,

            :gateway,

            :amount,

            'pending',

            NULL,

            NOW(),

            NOW()

        )

    ");



    $paymentStmt->execute([

        ":order_id" =>

            $orderId,



        ":gateway" =>

            $paymentMethod,



        ":amount" =>

            $total

    ]);



    /*

    |--------------------------------------------------------------------------

    | Commit Transaction

    |--------------------------------------------------------------------------

    */



    $pdo->commit();




/*maill */


// ---------------------------------------------------------
// Send admin order notification
// Email failure must NOT fail the order
// ---------------------------------------------------------

try {
    $emailOrderData = [
        "order_number"    => $orderNumber,
        "customer_name"   => $customerName,
        "customer_mobile" => $customerMobile,
        "customer_email"  => $customerEmail,
        "address_line"    => $addressLine,
        "city"            => $city,
        "state"           => $state,
        "pincode"         => $pincode,
        "subtotal"        => $subtotal,
        "delivery_charge" => $deliveryCharge,
        "discount"        => $discount,
        "total"            => $total,
        "payment_method"  => $paymentMethod,
    ];

    sendOrderNotification(
        $emailOrderData,
        $orderItems
    );

} catch (Throwable $emailError) {
    error_log(
        "AshrafBazar Admin Order Notification Error: " .
        $emailError->getMessage()
    );
}





    /*

    |--------------------------------------------------------------------------

    | Success Response

    |--------------------------------------------------------------------------

    */



    jsonResponse(

        true,

        "Order created successfully.",

        [

            "order_id" =>

                $orderId,



            "order_number" =>

                $orderNumber,



            "user_id" =>

                $userId,



            "subtotal" =>

                $subtotal,



            "delivery_charge" =>

                $deliveryCharge,



            "discount" =>

                $discount,



            "total" =>

                $total,



            "payment_method" =>

                $paymentMethod,



            "payment_status" =>

                "pending",



            "order_status" =>

                "pending",



            "estimated_days" =>

                $deliveryArea["estimated_days"]

        ],

        201

    );



} catch (Throwable $e) {



    /*

    |--------------------------------------------------------------------------

    | Rollback

    |--------------------------------------------------------------------------

    */



    if ($pdo->inTransaction()) {

        $pdo->rollBack();

    }



    /*

    |--------------------------------------------------------------------------

    | Server Log

    |--------------------------------------------------------------------------

    */



    error_log(

        "AshrafBazar Order Create Error: "

        . $e->getMessage()

        . " | File: "

        . $e->getFile()

        . " | Line: "

        . $e->getLine()

    );



    /*

    |--------------------------------------------------------------------------

    | Local Development Debug

    |--------------------------------------------------------------------------

    |

    | Keep detailed error only on localhost.

    | Never expose database/internal details in production.

    |

    */



    $host =

        $_SERVER["HTTP_HOST"] ?? "";



    $isLocalhost =

        $host === "localhost" ||

        str_starts_with(

            $host,

            "localhost:"

        ) ||

        $host === "127.0.0.1" ||

        str_starts_with(

            $host,

            "127.0.0.1:"

        );



    if ($isLocalhost) {



        jsonResponse(

            false,

            "Order creation failed: " .

            $e->getMessage(),

            [

                "file" =>

                    basename(

                        $e->getFile()

                    ),



                "line" =>

                    $e->getLine()

            ],

            500

        );

    }



    /*

    |--------------------------------------------------------------------------

    | Production-Safe Error

    |--------------------------------------------------------------------------

    */



    jsonResponse(

        false,

        "Unable to create order.",

        null,

        500

    );

}