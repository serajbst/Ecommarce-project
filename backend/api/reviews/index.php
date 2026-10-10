<?php
declare(strict_types=1);

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../helpers/Response.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    jsonResponse(false, "Method not allowed.", null, 405);
}

/*
 * Product ID is required.
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

if (!$productId) {
    jsonResponse(
        false,
        "Valid product_id is required.",
        null,
        422
    );
}

/*
 * Pagination.
 */
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

$limit = filter_input(
    INPUT_GET,
    "limit",
    FILTER_VALIDATE_INT,
    [
        "options" => [
            "default" => 10,
            "min_range" => 1,
            "max_range" => 50
        ]
    ]
);

$offset = ($page - 1) * $limit;

try {

    /*
     * Check product exists.
     */
    $productStmt = $pdo->prepare("
        SELECT
            id,
            name,
            status
        FROM products
        WHERE id = :product_id
        LIMIT 1
    ");

    $productStmt->execute([
        ":product_id" => $productId
    ]);

    $product = $productStmt->fetch();

    if (!$product) {
        jsonResponse(
            false,
            "Product not found.",
            null,
            404
        );
    }

    /*
     * Total approved reviews.
     */
    $countStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM reviews
        WHERE
            product_id = :product_id
            AND status = 'approved'
    ");

    $countStmt->execute([
        ":product_id" => $productId
    ]);

    $totalReviews = (int) $countStmt->fetchColumn();

    /*
     * Rating summary.
     */
    $summaryStmt = $pdo->prepare("
        SELECT
            COALESCE(AVG(rating), 0) AS average_rating,

            SUM(
                CASE
                    WHEN rating = 5 THEN 1
                    ELSE 0
                END
            ) AS five_star,

            SUM(
                CASE
                    WHEN rating = 4 THEN 1
                    ELSE 0
                END
            ) AS four_star,

            SUM(
                CASE
                    WHEN rating = 3 THEN 1
                    ELSE 0
                END
            ) AS three_star,

            SUM(
                CASE
                    WHEN rating = 2 THEN 1
                    ELSE 0
                END
            ) AS two_star,

            SUM(
                CASE
                    WHEN rating = 1 THEN 1
                    ELSE 0
                END
            ) AS one_star

        FROM reviews
        WHERE
            product_id = :product_id
            AND status = 'approved'
    ");

    $summaryStmt->execute([
        ":product_id" => $productId
    ]);

    $summary = $summaryStmt->fetch();

    /*
     * Approved reviews.
     *
     * We intentionally do not expose:
     * - user email
     * - mobile
     * - password
     * - other private user information
     */
    $reviewsStmt = $pdo->prepare("
        SELECT
            r.id,
            r.rating,
            r.review,
            r.created_at,
            u.name AS customer_name

        FROM reviews r

        INNER JOIN users u
            ON u.id = r.user_id

        WHERE
            r.product_id = :product_id
            AND r.status = 'approved'

        ORDER BY r.created_at DESC

        LIMIT :limit OFFSET :offset
    ");

    $reviewsStmt->bindValue(
        ":product_id",
        $productId,
        PDO::PARAM_INT
    );

    $reviewsStmt->bindValue(
        ":limit",
        $limit,
        PDO::PARAM_INT
    );

    $reviewsStmt->bindValue(
        ":offset",
        $offset,
        PDO::PARAM_INT
    );

    $reviewsStmt->execute();

    $reviews = $reviewsStmt->fetchAll();

    foreach ($reviews as &$review) {
        $review["id"] = (int) $review["id"];
        $review["rating"] = (int) $review["rating"];

        /*
         * Keep customer name safe for public display.
         */
        if (!empty($review["customer_name"])) {
            $review["customer_name"] = trim(
                (string) $review["customer_name"]
            );
        }
    }

    unset($review);

    $totalPages = $totalReviews > 0
        ? (int) ceil($totalReviews / $limit)
        : 0;

    /*
     * Normalize rating values.
     */
    $averageRating = round(
        (float) ($summary["average_rating"] ?? 0),
        2
    );

    $ratingSummary = [
        "average_rating" => $averageRating,
        "total_reviews" => $totalReviews,
        "five_star" => (int) ($summary["five_star"] ?? 0),
        "four_star" => (int) ($summary["four_star"] ?? 0),
        "three_star" => (int) ($summary["three_star"] ?? 0),
        "two_star" => (int) ($summary["two_star"] ?? 0),
        "one_star" => (int) ($summary["one_star"] ?? 0)
    ];

    jsonResponse(
        true,
        "Reviews fetched successfully.",
        [
            "product" => [
                "id" => (int) $product["id"],
                "name" => $product["name"]
            ],
            "summary" => $ratingSummary,
            "reviews" => $reviews,
            "pagination" => [
                "page" => $page,
                "limit" => $limit,
                "total" => $totalReviews,
                "total_pages" => $totalPages
            ]
        ]
    );

} catch (PDOException $e) {

    error_log(
        "Reviews index error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch reviews right now.",
        null,
        500
    );
}