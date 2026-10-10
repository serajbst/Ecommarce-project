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
| Admin / Staff Authentication
|--------------------------------------------------------------------------
*/

requireAdmin();

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

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

$page = ($page !== false && $page !== null)
    ? $page
    : 1;

$limit = ($limit !== false && $limit !== null)
    ? $limit
    : 20;

if ($page < 1) {
    $page = 1;
}

if ($limit < 1) {
    $limit = 20;
}

if ($limit > 100) {
    $limit = 100;
}

$offset = ($page - 1) * $limit;

/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
*/

$search = trim(
    (string)($_GET["search"] ?? "")
);

if (strlen($search) > 100) {
    jsonResponse(
        false,
        "Search text is too long.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Status Filter
|--------------------------------------------------------------------------
*/

$status = trim(
    (string)($_GET["status"] ?? "")
);

$allowedStatuses = [
    "active",
    "inactive",
    "blocked"
];

if (
    $status !== "" &&
    !in_array($status, $allowedStatuses, true)
) {
    jsonResponse(
        false,
        "Invalid customer status.",
        null,
        422
    );
}

try {

    /*
    |--------------------------------------------------------------------------
    | WHERE
    |--------------------------------------------------------------------------
    */

    $where = [
        "role = 'customer'"
    ];

    $params = [];

    if ($search !== "") {

        $where[] = "
            (
                name LIKE :search_name
                OR email LIKE :search_email
                OR mobile LIKE :search_mobile
            )
        ";

        $searchValue = "%" . $search . "%";

        $params[":search_name"] = $searchValue;
        $params[":search_email"] = $searchValue;
        $params[":search_mobile"] = $searchValue;
    }

    if ($status !== "") {

        $where[] = "status = :status";

        $params[":status"] = $status;
    }

    $whereSql = implode(
        " AND ",
        $where
    );

    /*
    |--------------------------------------------------------------------------
    | Total Customers
    |--------------------------------------------------------------------------
    */

    $countStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM users
        WHERE {$whereSql}
    ");

    $countStmt->execute($params);

    $totalCustomers = (int)$countStmt->fetchColumn();

    /*
    |--------------------------------------------------------------------------
    | Fetch Customers
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | password_hash is NEVER selected.
    |
    */

    $stmt = $pdo->prepare("
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
        WHERE {$whereSql}
        ORDER BY id DESC
        LIMIT :limit
        OFFSET :offset
    ");

    foreach ($params as $key => $value) {
        $stmt->bindValue(
            $key,
            $value,
            PDO::PARAM_STR
        );
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

    $customers = $stmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Customer Order Statistics
    |--------------------------------------------------------------------------
    */

    if (!empty($customers)) {

        $customerIds = array_map(
            static function ($customer) {
                return (int)$customer["id"];
            },
            $customers
        );

        $placeholders = [];
        $orderParams = [];

        foreach ($customerIds as $index => $customerId) {

            $placeholder = ":customer_" . $index;

            $placeholders[] = $placeholder;

            $orderParams[$placeholder] = $customerId;
        }

        $statsStmt = $pdo->prepare("
            SELECT
                user_id,
                COUNT(*) AS total_orders,
                COALESCE(SUM(total), 0) AS total_spent
            FROM orders
            WHERE user_id IN (
                " . implode(", ", $placeholders) . "
            )
            GROUP BY user_id
        ");

        foreach ($orderParams as $key => $value) {
            $statsStmt->bindValue(
                $key,
                $value,
                PDO::PARAM_INT
            );
        }

        $statsStmt->execute();

        $stats = $statsStmt->fetchAll();

        $statsByUser = [];

        foreach ($stats as $stat) {

            $statsByUser[
                (int)$stat["user_id"]
            ] = [
                "total_orders" =>
                    (int)$stat["total_orders"],

                "total_spent" =>
                    (float)$stat["total_spent"]
            ];
        }

        foreach ($customers as &$customer) {

            $customerId =
                (int)$customer["id"];

            $customer["total_orders"] =
                $statsByUser[$customerId]["total_orders"]
                ?? 0;

            $customer["total_spent"] =
                $statsByUser[$customerId]["total_spent"]
                ?? 0.0;
        }

        unset($customer);
    }

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    $totalPages = $totalCustomers > 0
        ? (int)ceil(
            $totalCustomers / $limit
        )
        : 0;

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Customers fetched successfully.",
        [
            "customers" => $customers,
            "pagination" => [
                "page" => $page,
                "limit" => $limit,
                "total" => $totalCustomers,
                "total_pages" => $totalPages
            ]
        ],
        200
    );

} catch (PDOException $e) {

    error_log(
        "AshrafBazar Customers Index Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch customers.",
        null,
        500
    );
}