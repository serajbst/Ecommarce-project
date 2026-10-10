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

    if (
        $headerJson === false ||
        $payloadJson === false
    ) {
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

if (
    $rawInput === false ||
    strlen($rawInput) > 10000
) {
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
        "Email or mobile number is required.",
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
| Find Admin
|--------------------------------------------------------------------------
|
| Same users table.
| Only role = admin is allowed.
|
|--------------------------------------------------------------------------
*/

try {

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
        WHERE (
            mobile = :mobile
            OR (
                email IS NOT NULL
                AND email <> ''
                AND email = :email
            )
        )
        AND role = 'admin'
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
            "Invalid admin credentials.",
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
            "Admin account is currently unavailable.",
            null,
            403
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Password Verification
    |--------------------------------------------------------------------------
    |
    | Current AshrafBazar setup uses users.password.
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
            "Invalid admin credentials.",
            null,
            401
        );
    }

    /*
    |--------------------------------------------------------------------------
    | User ID
    |--------------------------------------------------------------------------
    */

    $userId = (int)$user["id"];

    if ($userId <= 0) {
        jsonResponse(
            false,
            "Unable to process admin login.",
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

    $expiresAt = $now + 86400;

    $payload = [
        "iss" => BASE_URL,
        "aud" => APP_NAME,
        "iat" => $now,
        "exp" => $expiresAt,
        "sub" => $userId,
        "role" => "admin"
    ];

    /*
    |--------------------------------------------------------------------------
    | Generate Token
    |--------------------------------------------------------------------------
    */

    try {

        $token = createJwt(
            $payload,
            (string)JWT_SECRET
        );

    } catch (Throwable $e) {

        error_log(
            "AshrafBazar Admin JWT Error: "
            . $e->getMessage()
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
    | Never Return Password
    |--------------------------------------------------------------------------
    */

    unset($user["password"]);

    /*
    |--------------------------------------------------------------------------
    | Admin Login Success
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Admin login successful.",
        [
            "token" => $token,
            "token_type" => "Bearer",
            "expires_in" => 86400,
            "user" => $user
        ],
        200
    );

} catch (PDOException $e) {

    error_log(
        "AshrafBazar Admin Login DB Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to process admin login request.",
        null,
        500
    );

} catch (Throwable $e) {

    error_log(
        "AshrafBazar Admin Login Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to process admin login request.",
        null,
        500
    );
}