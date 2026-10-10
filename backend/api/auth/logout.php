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

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Only POST
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    jsonResponse(
        false,
        "Only POST method is allowed.",
        null,
        405
    );
}

/*
|--------------------------------------------------------------------------
| Authentication Required
|--------------------------------------------------------------------------
|
| auth.php validates the Bearer JWT.
|
*/

if (!isset($authUser) || !is_array($authUser)) {
    jsonResponse(
        false,
        "Authentication required.",
        null,
        401
    );
}

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
|
| JWT is stateless.
| The frontend must remove the stored token after this response.
|
*/

jsonResponse(
    true,
    "Logout successful. Please remove the authentication token from the client.",
    null,
    200
);