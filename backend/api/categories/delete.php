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
    header(
        "Access-Control-Allow-Origin: " .
        $allowedOrigin
    );
}

header(
    "Access-Control-Allow-Methods: DELETE, OPTIONS"
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
| OPTIONS
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}


/*
|--------------------------------------------------------------------------
| Only DELETE
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "DELETE") {

    jsonResponse(
        false,
        "Only DELETE method is allowed.",
        null,
        405
    );
}


/*
|--------------------------------------------------------------------------
| Admin Authentication
|--------------------------------------------------------------------------
*/

requireAdminOnly();


/*
|--------------------------------------------------------------------------
| Category ID
|--------------------------------------------------------------------------
|
| Request:
| DELETE /delete.php?id=123
|
*/

$id = isset($_GET["id"])
    ? (int) $_GET["id"]
    : 0;

if ($id <= 0) {

    jsonResponse(
        false,
        "Valid category ID is required.",
        null,
        422
    );
}


try {

    /*
    |--------------------------------------------------------------------------
    | Check Category
    |--------------------------------------------------------------------------
    */

    $categoryStmt = $pdo->prepare("
        SELECT id, name
        FROM categories
        WHERE id = ?
        LIMIT 1
    ");

    $categoryStmt->execute([
        $id
    ]);

    $category =
        $categoryStmt->fetch(
            PDO::FETCH_ASSOC
        );


    if (!$category) {

        jsonResponse(
            false,
            "Category not found.",
            null,
            404
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Check Assigned Products
    |--------------------------------------------------------------------------
    */

    $productStmt = $pdo->prepare("
        SELECT COUNT(*) AS total
        FROM products
        WHERE category_id = ?
    ");

    $productStmt->execute([
        $id
    ]);

    $productData =
        $productStmt->fetch(
            PDO::FETCH_ASSOC
        );

    $productCount =
        (int) (
            $productData["total"] ?? 0
        );


    /*
    |--------------------------------------------------------------------------
    | Don't Delete If Products Exist
    |--------------------------------------------------------------------------
    */

    if ($productCount > 0) {

        jsonResponse(
            false,
            "Category cannot be deleted because products are assigned to it.",
            [
                "category_id" =>
                    (int) $category["id"],

                "category_name" =>
                    $category["name"],

                "product_count" =>
                    $productCount
            ],
            409
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Delete Category
    |--------------------------------------------------------------------------
    */

    $deleteStmt = $pdo->prepare("
        DELETE FROM categories
        WHERE id = ?
    ");

    $deleteStmt->execute([
        $id
    ]);


    /*
    |--------------------------------------------------------------------------
    | Verify Delete
    |--------------------------------------------------------------------------
    */

    if ($deleteStmt->rowCount() !== 1) {

        jsonResponse(
            false,
            "Category could not be deleted.",
            null,
            500
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Category deleted successfully.",
        [
            "id" =>
                (int) $category["id"],

            "name" =>
                $category["name"]
        ],
        200
    );


} catch (PDOException $e) {

    error_log(
        "AshrafBazar Delete Category DB Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to delete category.",
        null,
        500
    );


} catch (Throwable $e) {

    error_log(
        "AshrafBazar Delete Category Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to delete category.",
        null,
        500
    );
}