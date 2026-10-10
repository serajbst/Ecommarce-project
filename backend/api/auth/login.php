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
| JWT Secret Check
|--------------------------------------------------------------------------
*/

if (
    !defined("JWT_SECRET") ||
    trim((string)JWT_SECRET) === "" ||
    JWT_SECRET === "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY"
) {
    jsonResponse(
        false,
        "Server authentication configuration error.",
        null,
        500
    );
}

/*
|--------------------------------------------------------------------------
| JWT Helper
|--------------------------------------------------------------------------
*/

function base64UrlEncode(string $data): string
{
    return rtrim(
        strtr(
            base64_encode($data),
            "+/",
            "-_"
        ),
        "="
    );
}

/*
|--------------------------------------------------------------------------
| Create JWT
|--------------------------------------------------------------------------
*/

function createJwt(array $payload, string $secret): string
{
    $header = [
        "alg" => "HS256",
        "typ" => "JWT"
    ];

    $headerJson = json_encode(
        $header,
        JSON_UNESCAPED_SLASHES
    );

    $payloadJson = json_encode(
        $payload,
        JSON_UNESCAPED_SLASHES
    );

    if ($headerJson === false || $payloadJson === false) {
        throw new RuntimeException(
            "Unable to create JWT payload."
        );
    }

    $headerEncoded = base64UrlEncode(
        $headerJson
    );

    $payloadEncoded = base64UrlEncode(
        $payloadJson
    );

    $signature = hash_hmac(
        "sha256",
        $headerEncoded . "." . $payloadEncoded,
        $secret,
        true
    );

    $signatureEncoded = base64UrlEncode(
        $signature
    );

    return $headerEncoded
        . "."
        . $payloadEncoded
        . "."
        . $signatureEncoded;
}

/*
|--------------------------------------------------------------------------
| Read JSON
|--------------------------------------------------------------------------
*/

$rawInput = file_get_contents("php://input");

if ($rawInput === false || strlen($rawInput) > 10000) {
    jsonResponse(
        false,
        "Invalid request.",
        null,
        400
    );
}

$input = json_decode(
    $rawInput,
    true
);

if (!is_array($input)) {
    jsonResponse(
        false,
        "Invalid JSON request.",
        null,
        400
    );
}

/*
|--------------------------------------------------------------------------
| Login Credentials
|--------------------------------------------------------------------------
|
| Frontend can send:
|
| {
|   "login": "mobile/email",
|   "password": "password"
| }
|
|--------------------------------------------------------------------------
*/

$login = trim(
    (string)($input["login"] ?? "")
);

$password = (string)(
    $input["password"] ?? ""
);

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

if ($login === "") {
    jsonResponse(
        false,
        "Mobile number or email is required.",
        null,
        422
    );
}

if ($password === "") {
    jsonResponse(
        false,
        "Password is required.",
        null,
        422
    );
}

if (strlen($login) > 150) {
    jsonResponse(
        false,
        "Invalid login details.",
        null,
        422
    );
}

if (strlen($password) > 200) {
    jsonResponse(
        false,
        "Invalid login details.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Database
|--------------------------------------------------------------------------
*/

try {

    /*
    |--------------------------------------------------------------------------
    | Find User
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT
            id,
            name,
            email,
            mobile,
            password,
            role,
            status,
            created_at,
            updated_at
        FROM users
        WHERE mobile = :mobile
           OR (
                email IS NOT NULL
                AND email <> ''
                AND email = :email
           )
        LIMIT 1
    ");

    $stmt->execute([
        ":mobile" => $login,
        ":email" => strtolower($login)
    ]);

    $user = $stmt->fetch();

    /*
    |--------------------------------------------------------------------------
    | Invalid Credentials
    |--------------------------------------------------------------------------
    */

    if (!$user) {
        jsonResponse(
            false,
            "Invalid mobile/email or password.",
            null,
            401
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Account Status
    |--------------------------------------------------------------------------
    */

    if ((string)$user["status"] !== "active") {

        jsonResponse(
            false,
            "Your account is currently unavailable.",
            null,
            403
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Password Verification
    |--------------------------------------------------------------------------
    |
    | Current AshrafBazar requirement:
    | users.password contains plain password.
    |
    */

    if (
        !isset($user["password"]) ||
        !hash_equals(
            (string)$user["password"],
            $password
        )
    ) {
        jsonResponse(
            false,
            "Invalid mobile/email or password.",
            null,
            401
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate User ID
    |--------------------------------------------------------------------------
    */

    $userId = (int)$user["id"];

    if ($userId <= 0) {
        jsonResponse(
            false,
            "Unable to process login request.",
            null,
            500
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Role
    |--------------------------------------------------------------------------
    */

    $allowedRoles = [
        "customer",
        "admin",
        "staff"
    ];

    if (
        !in_array(
            (string)$user["role"],
            $allowedRoles,
            true
        )
    ) {
        jsonResponse(
            false,
            "Invalid account configuration.",
            null,
            500
        );
    }

    /*
    |--------------------------------------------------------------------------
    | JWT Payload
    |--------------------------------------------------------------------------
    */

    $now = time();

    /*
    | Token valid for 90 days.
    */

    $expiresAt = $now + (90 * 24 * 60 * 60);

    $payload = [
        "iss" => BASE_URL,
        "aud" => APP_NAME,
        "iat" => $now,
        "exp" => $expiresAt,
        "sub" => $userId,
        "role" => (string)$user["role"]
    ];

    /*
    |--------------------------------------------------------------------------
    | Generate JWT
    |--------------------------------------------------------------------------
    */

    try {

        $token = createJwt(
            $payload,
            (string)JWT_SECRET
        );

    } catch (Throwable $e) {

        error_log(
            "AshrafBazar JWT Error: " . $e->getMessage()
        );

        jsonResponse(
            false,
            "Unable to create authentication token.",
            null,
            500
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Remove Password
    |--------------------------------------------------------------------------
    */

    unset($user["password"]);

    /*
    |--------------------------------------------------------------------------
    | Login Success
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Login successful.",
        [
            "token" => $token,
            "token_type" => "Bearer",
            "expires_in" => 90 * 24 * 60 * 60,
            "user" => $user
        ],
        200
    );

} catch (PDOException $e) {

    /*
    |--------------------------------------------------------------------------
    | Database Error Logging
    |--------------------------------------------------------------------------
    */

    error_log(
        "AshrafBazar Login DB Error: " . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to process login request.",
        null,
        500
    );

} catch (Throwable $e) {

    /*
    |--------------------------------------------------------------------------
    | Unexpected Error
    |--------------------------------------------------------------------------
    */

    error_log(
        "AshrafBazar Login Error: " . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to process login request.",
        null,
        500
    );
}