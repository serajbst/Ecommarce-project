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
| Authentication
|--------------------------------------------------------------------------
*/

requireAuth();

$userId = (int)$authUser["id"];

if ($userId <= 0) {
    jsonResponse(
        false,
        "Unauthorized.",
        null,
        401
    );
}

try {

    /*
    |--------------------------------------------------------------------------
    | Fetch Wishlist
    |--------------------------------------------------------------------------
    |
    | LEFT JOIN is intentional:
    | Wishlist record remains valid even if a product becomes unavailable.
    |
    */

    $stmt = $pdo->prepare("
        SELECT
            w.id AS wishlist_id,
            w.product_id,
            w.created_at AS added_at,

            p.name,
            p.slug,
            p.sku,
            p.short_description,
            p.price,
            p.old_price,
            p.stock,
            p.image,
            p.rating,
            p.review_count,
            p.status AS product_status,
            p.featured,

            c.id AS category_id,
            c.name AS category_name,
            c.slug AS category_slug

        FROM wishlist w

        LEFT JOIN products p
            ON p.id = w.product_id

        LEFT JOIN categories c
            ON c.id = p.category_id

        WHERE w.user_id = :user_id

        ORDER BY w.created_at DESC
    ");

    $stmt->execute([
        ":user_id" => $userId
    ]);

    $rows = $stmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Format Response
    |--------------------------------------------------------------------------
    */

    $items = [];

    foreach ($rows as $row) {

        $productExists = $row["name"] !== null;

        $items[] = [
            "wishlist_id" => (int)$row["wishlist_id"],
            "product_id" => (int)$row["product_id"],
            "added_at" => $row["added_at"],

            "product" => $productExists
                ? [
                    "id" => (int)$row["product_id"],
                    "name" => $row["name"],
                    "slug" => $row["slug"],
                    "sku" => $row["sku"],
                    "short_description" => $row["short_description"],
                    "price" => (float)$row["price"],
                    "old_price" => $row["old_price"] !== null
                        ? (float)$row["old_price"]
                        : null,
                    "stock" => (int)$row["stock"],
                    "image" => $row["image"],
                    "rating" => (float)$row["rating"],
                    "review_count" => (int)$row["review_count"],
                    "status" => $row["product_status"],
                    "featured" => (bool)$row["featured"],

                    "category" => $row["category_id"] !== null
                        ? [
                            "id" => (int)$row["category_id"],
                            "name" => $row["category_name"],
                            "slug" => $row["category_slug"]
                        ]
                        : null
                ]
                : null
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Wishlist fetched successfully.",
        [
            "items" => $items,
            "total" => count($items)
        ],
        200
    );

} catch (PDOException $e) {

    error_log(
        "AshrafBazar Wishlist Index Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch wishlist.",
        null,
        500
    );
}