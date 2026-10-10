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
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

/*
|--------------------------------------------------------------------------
| Only GET allowed
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
| Admin / Staff
|--------------------------------------------------------------------------
*/

requireAdmin();

try {

    /*
    |--------------------------------------------------------------------------
    | Query Parameters
    |--------------------------------------------------------------------------
    */

    $productId = filter_input(
        INPUT_GET,
        "product_id",
        FILTER_VALIDATE_INT,
        [
            "options" => [
                "min_range" => 1
            ]
        ]
    );

    $type = isset($_GET["type"])
        ? trim((string) $_GET["type"])
        : "";

    $limit = filter_input(
        INPUT_GET,
        "limit",
        FILTER_VALIDATE_INT,
        [
            "options" => [
                "default" => 20,
                "min_range" => 1,
                "max_range" => 100
            ]
        ]
    );

    $page = filter_input(
        INPUT_GET,
        "page",
        FILTER_VALIDATE_INT,
        [
            "options" => [
                "default" => 1,
                "min_range" => 1
            ]
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | Allowed Transaction Types
    |--------------------------------------------------------------------------
    */

    $allowedTypes = [
        "purchase",
        "sale",
        "return",
        "adjustment",
        "damage"
    ];

    if (
        $type !== "" &&
        !in_array($type, $allowedTypes, true)
    ) {
        jsonResponse(
            false,
            "Invalid inventory transaction type.",
            null,
            422
        );
    }

    $offset = ($page - 1) * $limit;

    /*
    |--------------------------------------------------------------------------
    | WHERE
    |--------------------------------------------------------------------------
    */

    $where = [];
    $params = [];

    if ($productId !== false && $productId !== null) {

        $where[] = "
            it.product_id = :product_id
        ";

        $params[":product_id"] = $productId;
    }

    if ($type !== "") {

        $where[] = "
            it.type = :type
        ";

        $params[":type"] = $type;
    }

    $whereSql = "";

    if (!empty($where)) {
        $whereSql =
            "WHERE " .
            implode(" AND ", $where);
    }

    /*
    |--------------------------------------------------------------------------
    | Total Transactions
    |--------------------------------------------------------------------------
    */

    $countStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM inventory_transactions it
        {$whereSql}
    ");

    $countStmt->execute($params);

    $total = (int) $countStmt->fetchColumn();

    /*
    |--------------------------------------------------------------------------
    | Transactions
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT
            it.id,
            it.product_id,

            p.name AS product_name,
            p.sku,

            it.type,
            it.quantity,
            it.reference_type,
            it.reference_id,
            it.note,
            it.created_at

        FROM inventory_transactions it

        INNER JOIN products p
            ON p.id = it.product_id

        {$whereSql}

        ORDER BY it.id DESC

        LIMIT :limit
        OFFSET :offset
    ");

    foreach ($params as $key => $value) {

        $stmt->bindValue(
            $key,
            $value,
            is_int($value)
                ? PDO::PARAM_INT
                : PDO::PARAM_STR
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

    $transactions = $stmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Format Numeric Values
    |--------------------------------------------------------------------------
    */

    foreach ($transactions as &$transaction) {

        $transaction["id"] =
            (int) $transaction["id"];

        $transaction["product_id"] =
            (int) $transaction["product_id"];

        $transaction["quantity"] =
            (int) $transaction["quantity"];

        $transaction["reference_id"] =
            $transaction["reference_id"] !== null
                ? (int) $transaction["reference_id"]
                : null;
    }

    unset($transaction);

    /*
    |--------------------------------------------------------------------------
    | Current Stock Summary
    |--------------------------------------------------------------------------
    */

    $summaryStmt = $pdo->query("
        SELECT

            COUNT(*) AS total_products,

            COALESCE(
                SUM(stock),
                0
            ) AS total_stock,

            COALESCE(
                SUM(
                    CASE
                        WHEN stock > 0
                        AND stock <= low_stock_limit
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS low_stock_products,

            COALESCE(
                SUM(
                    CASE
                        WHEN stock = 0
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS out_of_stock_products

        FROM products

        WHERE status != 'inactive'
    ");

    $summary = $summaryStmt->fetch();

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    $totalPages = $total > 0
        ? (int) ceil($total / $limit)
        : 0;

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Inventory fetched successfully.",
        [
            "transactions" => $transactions,

            "summary" => [
                "total_products" =>
                    (int) $summary["total_products"],

                "total_stock" =>
                    (int) $summary["total_stock"],

                "low_stock_products" =>
                    (int) $summary["low_stock_products"],

                "out_of_stock_products" =>
                    (int) $summary["out_of_stock_products"]
            ],

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
        "Inventory index database error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Database error occurred while fetching inventory.",
        null,
        500
    );

} catch (Exception $e) {

    error_log(
        "Inventory index error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Something went wrong.",
        null,
        500
    );
}