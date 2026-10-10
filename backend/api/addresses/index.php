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
|
| middleware/auth.php validates the Bearer JWT and provides
| the authenticated user in $authUser.
|
|--------------------------------------------------------------------------
*/

if (
    !isset($authUser) ||
    !is_array($authUser) ||
    !isset($authUser["id"])
) {
    jsonResponse(
        false,
        "Authentication required.",
        null,
        401
    );
}

$userId = (int) $authUser["id"];

if ($userId <= 0) {
    jsonResponse(
        false,
        "Authentication failed.",
        null,
        401
    );
}

/*
|--------------------------------------------------------------------------
| Fetch User Addresses
|--------------------------------------------------------------------------
*/

try {

    $stmt = $pdo->prepare("
        SELECT
            id,
            user_id,
            name,
            mobile,
            address_line,
            city,
            state,
            pincode,
            address_type,
            is_default,
            created_at,
            updated_at
        FROM addresses
        WHERE user_id = :user_id
        ORDER BY
            is_default DESC,
            created_at DESC,
            id DESC
    ");

    $stmt->execute([
        ":user_id" => $userId
    ]);

    $addresses = $stmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Normalize Data Types
    |--------------------------------------------------------------------------
    */

    foreach ($addresses as &$address) {

        $address["id"] = (int) $address["id"];
        $address["user_id"] = (int) $address["user_id"];
        $address["is_default"] = (int) $address["is_default"];

        $address["name"] = (string) $address["name"];
        $address["mobile"] = (string) $address["mobile"];
        $address["address_line"] = (string) $address["address_line"];
        $address["city"] = (string) $address["city"];
        $address["state"] = (string) $address["state"];
        $address["pincode"] = (string) $address["pincode"];
        $address["address_type"] = (string) $address["address_type"];
    }

    unset($address);

    /*
    |--------------------------------------------------------------------------
    | Success Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Addresses fetched successfully.",
        [
            "addresses" => $addresses,
            "count" => count($addresses)
        ],
        200
    );

} catch (PDOException $e) {

    error_log(
        "AshrafBazar Addresses Index PDO Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch addresses.",
        null,
        500
    );

} catch (Throwable $e) {

    error_log(
        "AshrafBazar Addresses Index Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch addresses.",
        null,
        500
    );
}