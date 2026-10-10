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

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "GET") {
    jsonResponse(
        false,
        "Only GET method is allowed.",
        null,
        405
    );
}

try {

    /*
    |--------------------------------------------------------------------------
    | Category Filter
    |--------------------------------------------------------------------------
    */

    $categorySlug = isset($_GET["category"])
        ? trim((string) $_GET["category"])
        : "";

    if ($categorySlug !== "") {

        if (
            strlen($categorySlug) > 100 ||
            !preg_match(
                '/^[a-zA-Z0-9_-]+$/',
                $categorySlug
            )
        ) {
            jsonResponse(
                false,
                "Invalid category.",
                null,
                400
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Products Query
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | active        -> visible
    | out_of_stock  -> visible
    | inactive      -> hidden
    |
    | Out-of-stock products must remain visible so the
    | customer can see the product and its current status.
    |
    */

    $sql = "
        SELECT
            p.id,
            p.category_id,
            p.name,
            p.slug,
            p.sku,
            p.short_description,
            p.description,
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

        WHERE p.status IN ('active', 'out_of_stock')
          AND c.status = 'active'
    ";

    $params = [];

    /*
    |--------------------------------------------------------------------------
    | Category Filter
    |--------------------------------------------------------------------------
    */

    if ($categorySlug !== "") {

        $sql .= "
            AND c.slug = :category_slug
        ";

        $params[":category_slug"] =
            $categorySlug;
    }

    /*
    |--------------------------------------------------------------------------
    | Sorting
    |--------------------------------------------------------------------------
    |
    | Active products first.
    | Featured products before normal products.
    | Newer products first.
    |
    */

    $sql .= "
        ORDER BY
            CASE
                WHEN p.status = 'active'
                THEN 0
                ELSE 1
            END ASC,

            p.featured DESC,
            p.created_at DESC,
            p.id DESC
    ";

    /*
    |--------------------------------------------------------------------------
    | Execute Product Query
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare($sql);

    $stmt->execute($params);

    $products = $stmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Product Images
    |--------------------------------------------------------------------------
    */

    if (!empty($products)) {

        $productIds = array_map(
            "intval",
            array_column(
                $products,
                "id"
            )
        );

        /*
        |--------------------------------------------------------------------------
        | Safe Integer Placeholders
        |--------------------------------------------------------------------------
        */

        $placeholders = implode(
            ",",
            array_fill(
                0,
                count($productIds),
                "?"
            )
        );

        $imageSql = "
            SELECT
                id,
                product_id,
                image,
                sort_order

            FROM product_images

            WHERE product_id IN ($placeholders)

            ORDER BY
                sort_order ASC,
                id ASC
        ";

        $imageStmt =
            $pdo->prepare($imageSql);

        $imageStmt->execute(
            $productIds
        );

        $images =
            $imageStmt->fetchAll();

        /*
        |--------------------------------------------------------------------------
        | Image Map
        |--------------------------------------------------------------------------
        */

        $imageMap = [];

        foreach ($images as $image) {

            $productId =
                (int)$image["product_id"];

            if (
                !isset(
                    $imageMap[$productId]
                )
            ) {
                $imageMap[$productId] = [];
            }

            $imageMap[$productId][] = [
                "id" =>
                    (int)$image["id"],

                "product_id" =>
                    (int)$image["product_id"],

                "image" =>
                    (string)$image["image"],

                "sort_order" =>
                    (int)$image["sort_order"]
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Attach Images + Format Product Data
        |--------------------------------------------------------------------------
        */

        foreach ($products as &$product) {

            $productId =
                (int)$product["id"];

            /*
            |--------------------------------------------------------------------------
            | Gallery Images
            |--------------------------------------------------------------------------
            */

            $product["images"] =
                $imageMap[$productId] ?? [];

            /*
            |--------------------------------------------------------------------------
            | Main Image Fallback
            |--------------------------------------------------------------------------
            */

            if (
                empty($product["image"]) &&
                !empty($product["images"])
            ) {
                $product["image"] =
                    $product["images"][0]["image"];
            }

            /*
            |--------------------------------------------------------------------------
            | Numeric Values
            |--------------------------------------------------------------------------
            */

            $product["id"] =
                (int)$product["id"];

            $product["category_id"] =
                (int)$product["category_id"];

            $product["price"] =
                (float)$product["price"];

            $product["old_price"] =
                $product["old_price"] !== null
                    ? (float)$product["old_price"]
                    : null;

            $product["stock"] =
                (int)$product["stock"];

            $product["low_stock_limit"] =
                (int)$product["low_stock_limit"];

            $product["rating"] =
                $product["rating"] !== null
                    ? (float)$product["rating"]
                    : 0.0;

            $product["review_count"] =
                (int)$product["review_count"];

            $product["featured"] =
                (int)$product["featured"];

            /*
            |--------------------------------------------------------------------------
            | Stock Flags
            |--------------------------------------------------------------------------
            */

            $product["in_stock"] =
                $product["stock"] > 0;

            $product["out_of_stock"] =
                $product["stock"] <= 0;

            $product["low_stock"] =
                (
                    $product["stock"] > 0 &&
                    $product["stock"] <=
                    $product["low_stock_limit"]
                );

            /*
            |--------------------------------------------------------------------------
            | Availability Flag
            |--------------------------------------------------------------------------
            |
            | Useful for frontend buttons.
            |
            */

            $product["can_purchase"] =
                (
                    $product["status"] === "active" &&
                    $product["stock"] > 0
                );
        }

        unset($product);
    }

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Products fetched successfully.",
        [
            "products" => $products,

            "count" =>
                count($products),

            "category" =>
                $categorySlug !== ""
                    ? $categorySlug
                    : null
        ],
        200
    );

} catch (PDOException $e) {

    /*
    |--------------------------------------------------------------------------
    | Database Error
    |--------------------------------------------------------------------------
    */

    error_log(
        "AshrafBazar Products API PDO Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch products.",
        null,
        500
    );

} catch (Throwable $e) {

    /*
    |--------------------------------------------------------------------------
    | General Error
    |--------------------------------------------------------------------------
    */

    error_log(
        "AshrafBazar Products API Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch products.",
        null,
        500
    );
}