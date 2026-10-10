<?php

declare(strict_types=1);

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
    header(
        "Access-Control-Allow-Origin: " . $allowedOrigin
    );
}

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
| OPTIONS / Preflight
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}


/*
|--------------------------------------------------------------------------
| Config
|--------------------------------------------------------------------------
*/

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../config/Response.php";


/*
|--------------------------------------------------------------------------
| Only GET Allowed
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
| Fetch Categories + Product Count
|--------------------------------------------------------------------------
*/

try {

    $stmt = $pdo->prepare("
        SELECT
            c.id,
            c.name,
            c.slug,
            c.image,
            c.icon,
            c.description,
            c.status,
            c.sort_order,
            c.created_at,
            c.updated_at,

            COUNT(p.id) AS product_count

        FROM categories c

        LEFT JOIN products p
            ON p.category_id = c.id

        GROUP BY
            c.id,
            c.name,
            c.slug,
            c.image,
            c.icon,
            c.description,
            c.status,
            c.sort_order,
            c.created_at,
            c.updated_at

        ORDER BY
            c.sort_order ASC,
            c.name ASC
    ");

    $stmt->execute();

    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);


    /*
    |--------------------------------------------------------------------------
    | Normalize Product Count
    |--------------------------------------------------------------------------
    */

    foreach ($categories as &$category) {

        $category["id"] = (int) $category["id"];

        $category["sort_order"] = (int) $category["sort_order"];

        $category["product_count"] = (int) $category["product_count"];

    }

    unset($category);


    /*
    |--------------------------------------------------------------------------
    | Success Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Categories fetched successfully.",
        [
            "categories" => $categories,
            "count" => count($categories)
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
        "AshrafBazar Categories DB Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch categories.",
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
        "AshrafBazar Categories Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch categories.",
        null,
        500
    );
}