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

$page = ($page !== false && $page !== null && $page > 0)
    ? $page
    : 1;

$limit = ($limit !== false && $limit !== null && $limit > 0)
    ? $limit
    : 20;

/*
|--------------------------------------------------------------------------
| Limit Protection
|--------------------------------------------------------------------------
*/

if ($limit > 100) {
    $limit = 100;
}

$offset = ($page - 1) * $limit;

/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
*/

$search = trim((string)($_GET["search"] ?? ""));

if (mb_strlen($search) > 100) {
    jsonResponse(
        false,
        "Search query is too long.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Status Filter
|--------------------------------------------------------------------------
*/

$allowedStatuses = [
    "pending",
    "checking",
    "available",
    "not_available",
    "completed",
    "cancelled"
];

$status = trim((string)($_GET["status"] ?? ""));

if ($status !== "" && !in_array($status, $allowedStatuses, true)) {
    jsonResponse(
        false,
        "Invalid status.",
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

    $where = [];
    $params = [];

    if ($search !== "") {

        $where[] = "(
            request_number LIKE :search
            OR product_name LIKE :search
            OR category LIKE :search
            OR brand_model LIKE :search
            OR customer_name LIKE :search
            OR mobile LIKE :search
        )";

        $params[":search"] = "%" . $search . "%";
    }

    if ($status !== "") {

        $where[] = "status = :status";

        $params[":status"] = $status;
    }

    $whereSql = "";

    if (!empty($where)) {
        $whereSql = "WHERE " . implode(" AND ", $where);
    }

    /*
    |--------------------------------------------------------------------------
    | Total Count
    |--------------------------------------------------------------------------
    */

    $countSql = "
        SELECT COUNT(*)
        FROM product_requests
        {$whereSql}
    ";

    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);

    $total = (int)$countStmt->fetchColumn();

    /*
    |--------------------------------------------------------------------------
    | Fetch Requests
    |--------------------------------------------------------------------------
    */

    $sql = "
        SELECT
            id,
            request_number,
            user_id,
            product_name,
            category,
            quantity,
            brand_model,
            description,
            customer_name,
            mobile,
            address_line,
            city,
            pincode,
            status,
            admin_note,
            created_at,
            updated_at
        FROM product_requests
        {$whereSql}
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $pdo->prepare($sql);

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

    $requests = $stmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    $totalPages = $total > 0
        ? (int)ceil($total / $limit)
        : 0;

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Product requests fetched successfully.",
        [
            "items" => $requests,
            "pagination" => [
                "page" => $page,
                "limit" => $limit,
                "total" => $total,
                "total_pages" => $totalPages
            ]
        ],
        200
    );

} catch (PDOException $e) {

    error_log(
        "AshrafBazar Product Requests Index Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch product requests.",
        null,
        500
    );
}