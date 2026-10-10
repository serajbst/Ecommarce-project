<?php

declare(strict_types=1);

require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../config/config.php";
require_once __DIR__ . "/../config/Response.php";

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
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");

/*
|--------------------------------------------------------------------------
| OPTIONS / Preflight
|--------------------------------------------------------------------------
*/

if (($_SERVER["REQUEST_METHOD"] ?? "") === "OPTIONS") {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Get Authorization Header
|--------------------------------------------------------------------------
*/
function getAuthorizationHeader(): string
{
    $possibleHeaders = [
        $_SERVER["HTTP_AUTHORIZATION"] ?? "",
        $_SERVER["REDIRECT_HTTP_AUTHORIZATION"] ?? "",
        $_SERVER["HTTP_X_AUTHORIZATION"] ?? ""
    ];

    foreach ($possibleHeaders as $header) {
        $header = trim((string)$header);

        if ($header !== "") {
            return $header;
        }
    }

    if (function_exists("getallheaders")) {
        $headers = getallheaders();

        foreach ($headers as $key => $value) {
            if (strtolower((string)$key) === "authorization") {
                $value = trim((string)$value);

                if ($value !== "") {
                    return $value;
                }
            }
        }
    }

    return "";
}
/*
|--------------------------------------------------------------------------
| Get Bearer Token
|--------------------------------------------------------------------------
*/

function getBearerToken(): string
{
    $header = getAuthorizationHeader();

    if ($header === "") {
        return "";
    }

    if (!preg_match("/^Bearer\s+(.+)$/i", $header, $matches)) {
        return "";
    }

    return trim((string) $matches[1]);
}

/*
|--------------------------------------------------------------------------
| Base64 URL Decode
|--------------------------------------------------------------------------
*/

function base64UrlDecode(string $data): string
{
    $remainder = strlen($data) % 4;

    if ($remainder !== 0) {
        $data .= str_repeat("=", 4 - $remainder);
    }

    $decoded = base64_decode(
        strtr($data, "-_", "+/"),
        true
    );

    return $decoded === false ? "" : $decoded;
}

/*
|--------------------------------------------------------------------------
| Verify JWT
|--------------------------------------------------------------------------
*/

function verifyJwt(string $token): ?array
{
    if ($token === "") {
        return null;
    }

    $parts = explode(".", $token);

    if (count($parts) !== 3) {
        return null;
    }

    [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;

    $headerJson = base64UrlDecode($encodedHeader);
    $payloadJson = base64UrlDecode($encodedPayload);
    $signature = base64UrlDecode($encodedSignature);

    if (
        $headerJson === "" ||
        $payloadJson === "" ||
        $signature === ""
    ) {
        return null;
    }

    $header = json_decode($headerJson, true);
    $payload = json_decode($payloadJson, true);

    if (
        !is_array($header) ||
        !is_array($payload)
    ) {
        return null;
    }

    if (($header["alg"] ?? "") !== "HS256") {
        return null;
    }

    $signingInput =
        $encodedHeader . "." . $encodedPayload;

    $expectedSignature = hash_hmac(
        "sha256",
        $signingInput,
        JWT_SECRET,
        true
    );

    if (
        !hash_equals(
            $expectedSignature,
            $signature
        )
    ) {
        return null;
    }

    if (
        !isset($payload["sub"]) ||
        !isset($payload["iat"]) ||
        !isset($payload["exp"])
    ) {
        return null;
    }

    $now = time();

    if ((int) $payload["iat"] > ($now + 60)) {
        return null;
    }

    if ((int) $payload["exp"] <= $now) {
        return null;
    }

    return $payload;
}

/*
|--------------------------------------------------------------------------
| Authenticate User
|--------------------------------------------------------------------------
*/

function authenticate(): array
{
    global $pdo;

    $token = getBearerToken();

    if ($token === "") {
        jsonResponse(
            false,
            "Authentication token is required.",
            null,
            401
        );
    }

    $payload = verifyJwt($token);

    if ($payload === null) {
        jsonResponse(
            false,
            "Invalid or expired authentication token.",
            null,
            401
        );
    }

    $userId = (int) ($payload["sub"] ?? 0);

    if ($userId <= 0) {
        jsonResponse(
            false,
            "Invalid authentication token.",
            null,
            401
        );
    }

    try {

        $stmt = $pdo->prepare("
            SELECT
                id,
                name,
                email,
                mobile,
                role,
                status,
                created_at,
                updated_at
            FROM users
            WHERE id = :id
            LIMIT 1
        ");

        $stmt->execute([
            ":id" => $userId
        ]);

        $user = $stmt->fetch();

    } catch (Throwable $e) {

        error_log(
            "AshrafBazar Auth DB Error: " .
            $e->getMessage()
        );

        jsonResponse(
            false,
            "Authentication service unavailable.",
            null,
            500
        );
    }

    if (!$user) {
        jsonResponse(
            false,
            "User account not found.",
            null,
            401
        );
    }

    if (($user["status"] ?? "") !== "active") {
        jsonResponse(
            false,
            "Your account is not active.",
            null,
            403
        );
    }

    return $user;
}

/*
|--------------------------------------------------------------------------
| Authenticated User
|--------------------------------------------------------------------------
*/

$authUser = authenticate();

/*
|--------------------------------------------------------------------------
| Admin + Staff
|--------------------------------------------------------------------------
*/

function requireAdmin(): void
{
    global $authUser;

    if (
        !isset($authUser["role"]) ||
        !in_array(
            $authUser["role"],
            ["admin", "staff"],
            true
        )
    ) {
        jsonResponse(
            false,
            "Admin or staff access required.",
            null,
            403
        );
    }
}

/*
|--------------------------------------------------------------------------
| Admin Only
|--------------------------------------------------------------------------
*/

function requireAdminOnly(): void
{
    global $authUser;

    if (
        !isset($authUser["role"]) ||
        $authUser["role"] !== "admin"
    ) {
        jsonResponse(
            false,
            "Admin access required.",
            null,
            403
        );
    }
}

/*
|--------------------------------------------------------------------------
| Ownership
|--------------------------------------------------------------------------
*/

function requireOwnership(int $userId): void
{
    global $authUser;

    if (
        !isset($authUser["id"]) ||
        (int) $authUser["id"] !== $userId
    ) {
        jsonResponse(
            false,
            "You are not authorized to access this resource.",
            null,
            403
        );
    }
}