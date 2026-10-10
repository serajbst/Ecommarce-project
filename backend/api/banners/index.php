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
| Method Check
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

/*
|--------------------------------------------------------------------------
| Fetch Banners
|--------------------------------------------------------------------------
*/

try {

    $stmt = $pdo->prepare("
        SELECT
            id,
            image,
            created_at
        FROM banners
        ORDER BY
            created_at DESC,
            id DESC
    ");

    $stmt->execute();

    $banners = $stmt->fetchAll();

    foreach ($banners as &$banner) {
        $banner["id"] = (int) $banner["id"];

        /*
         * Full image URL
         */
        $banner["image_url"] =
            rtrim(UPLOAD_URL, "/") .
            "/banners/" .
            ltrim((string) $banner["image"], "/");
    }

    unset($banner);

    jsonResponse(
        true,
        "Banners fetched successfully.",
        [
            "banners" => $banners,
            "count" => count($banners)
        ],
        200
    );

} catch (PDOException $e) {

    error_log(
        "AshrafBazar Banners API PDO Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch banners.",
        null,
        500
    );

} catch (Throwable $e) {

    error_log(
        "AshrafBazar Banners API Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch banners.",
        null,
        500
    );
}