<?php

declare(strict_types=1);

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
    header("Access-Control-Allow-Origin: " . $origin);
}

header("Vary: Origin");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

/*
|--------------------------------------------------------------------------
| OPTIONS
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
| Method
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
| Get Product ID / Slug
|--------------------------------------------------------------------------
*/

$id = isset($_GET["id"])
    ? (int) $_GET["id"]
    : 0;

$slug = trim(
    (string) ($_GET["slug"] ?? "")
);

if ($id <= 0 && $slug === "") {
    jsonResponse(
        false,
        "Product ID or slug is required.",
        null,
        400
    );
}

try {

    /*
    |--------------------------------------------------------------------------
    | Product
    |--------------------------------------------------------------------------
    */

    if ($id > 0) {

        $stmt = $pdo->prepare("
            SELECT
                p.id,
                p.category_id,
                p.name,
                p.slug,
                p.sku,
                p.description,
                p.short_description,
                p.price,
                p.old_price,
                p.stock,
                p.low_stock_limit,
                p.image,
                p.rating,
                p.review_count,
                p.status,
                p.featured,
                p.created_at,
                p.updated_at,

                c.name AS category_name,
                c.slug AS category_slug

            FROM products p

            INNER JOIN categories c
                ON c.id = p.category_id

            WHERE p.id = :id
            LIMIT 1
        ");

        $stmt->execute([
            ":id" => $id
        ]);

    } else {

        $stmt = $pdo->prepare("
            SELECT
                p.id,
                p.category_id,
                p.name,
                p.slug,
                p.sku,
                p.description,
                p.short_description,
                p.price,
                p.old_price,
                p.stock,
                p.low_stock_limit,
                p.image,
                p.rating,
                p.review_count,
                p.status,
                p.featured,
                p.created_at,
                p.updated_at,

                c.name AS category_name,
                c.slug AS category_slug

            FROM products p

            INNER JOIN categories c
                ON c.id = p.category_id

            WHERE p.slug = :slug
            LIMIT 1
        ");

        $stmt->execute([
            ":slug" => $slug
        ]);
    }

    $product = $stmt->fetch();

    if (!$product) {
        jsonResponse(
            false,
            "Product not found.",
            null,
            404
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Product Images
    |--------------------------------------------------------------------------
    */

    $imageStmt = $pdo->prepare("
        SELECT
            id,
            image,
            sort_order
        FROM product_images
        WHERE product_id = :product_id
        ORDER BY sort_order ASC, id ASC
    ");

    $imageStmt->execute([
        ":product_id" => (int) $product["id"]
    ]);

    $product["images"] = $imageStmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Reviews
    |--------------------------------------------------------------------------
    */

    $reviewStmt = $pdo->prepare("
        SELECT
            r.id,
            r.rating,
            r.review,
            r.created_at,
            u.name AS customer_name
        FROM reviews r

        INNER JOIN users u
            ON u.id = r.user_id

        WHERE r.product_id = :product_id
          AND r.status = 'approved'

        ORDER BY r.created_at DESC
        LIMIT 20
    ");

    $reviewStmt->execute([
        ":product_id" => (int) $product["id"]
    ]);

    $product["reviews"] = $reviewStmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Related Products
    |--------------------------------------------------------------------------
    */

    $relatedStmt = $pdo->prepare("
        SELECT
            id,
            name,
            slug,
            price,
            old_price,
            image,
            rating,
            review_count,
            stock
        FROM products
        WHERE category_id = :category_id
          AND id != :product_id
          AND status = 'active'
        ORDER BY featured DESC, created_at DESC
        LIMIT 8
    ");

    $relatedStmt->execute([
        ":category_id" => (int) $product["category_id"],
        ":product_id" => (int) $product["id"]
    ]);

    $product["related_products"] =
        $relatedStmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Type Formatting
    |--------------------------------------------------------------------------
    */

    $product["id"] =
        (int) $product["id"];

    $product["category_id"] =
        (int) $product["category_id"];

    $product["price"] =
        (float) $product["price"];

    $product["old_price"] =
        $product["old_price"] !== null
            ? (float) $product["old_price"]
            : null;

    $product["stock"] =
        (int) $product["stock"];

    $product["low_stock_limit"] =
        (int) $product["low_stock_limit"];

    $product["rating"] =
        $product["rating"] !== null
            ? (float) $product["rating"]
            : 0;

    $product["review_count"] =
        (int) $product["review_count"];

    $product["featured"] =
        (int) $product["featured"];

    /*
    |--------------------------------------------------------------------------
    | Related Product Type Formatting
    |--------------------------------------------------------------------------
    */

    foreach (
        $product["related_products"]
        as &$related
    ) {

        $related["id"] =
            (int) $related["id"];

        $related["price"] =
            (float) $related["price"];

        $related["old_price"] =
            $related["old_price"] !== null
                ? (float) $related["old_price"]
                : null;

        $related["rating"] =
            $related["rating"] !== null
                ? (float) $related["rating"]
                : 0;

        $related["review_count"] =
            (int) $related["review_count"];

        $related["stock"] =
            (int) $related["stock"];
    }

    unset($related);

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Product fetched successfully.",
        [
            "product" => $product
        ],
        200
    );

} catch (Throwable $e) {

    error_log(
        "AshrafBazar Product Show Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch product.",
        null,
        500
    );
}