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
    header("Vary: Origin");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, PUT, PATCH, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
| auth.php authenticates the Bearer token and provides $authUser.
|--------------------------------------------------------------------------
*/
if (!isset($authUser) || !is_array($authUser)) {
    jsonResponse(
        false,
        "Authentication required.",
        null,
        401
    );
}

$userId = (int)($authUser["id"] ?? 0);

if ($userId <= 0) {
    jsonResponse(
        false,
        "Invalid authenticated user.",
        null,
        401
    );
}

/*
|--------------------------------------------------------------------------
| GET PROFILE
|--------------------------------------------------------------------------
*/
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    try {
        $stmt = $pdo->prepare("
            SELECT
                id,
                name,
                email,
                mobile,
                profile_image,
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

        if (!$user) {
            jsonResponse(
                false,
                "User profile not found.",
                null,
                404
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Profile Image URL
        |--------------------------------------------------------------------------
        */
        $profileImageUrl = null;

        if (!empty($user["profile_image"])) {
            $profileImageUrl = rtrim(UPLOAD_URL, "/") .
                "/profile/" .
                ltrim($user["profile_image"], "/");
        }

        $user["profile_image_url"] = $profileImageUrl;

        jsonResponse(
            true,
            "Profile fetched successfully.",
            [
                "user" => $user
            ]
        );

    } catch (PDOException $e) {

        error_log(
            "Profile GET Error: " . $e->getMessage()
        );

        jsonResponse(
            false,
            "Unable to fetch profile.",
            null,
            500
        );
    }
}

/*
|--------------------------------------------------------------------------
| PUT / PATCH PROFILE
|--------------------------------------------------------------------------
|
| Currently supports JSON profile updates.
|
| Actual profile-image upload will be handled in
| auth/update-profile.php because the current frontend
| saves profile changes through that endpoint.
|--------------------------------------------------------------------------
*/
if (
    $_SERVER["REQUEST_METHOD"] === "PUT" ||
    $_SERVER["REQUEST_METHOD"] === "PATCH"
) {

    /*
    |--------------------------------------------------------------------------
    | Content-Type
    |--------------------------------------------------------------------------
    */
    $contentType = $_SERVER["CONTENT_TYPE"] ?? "";

    if (
        stripos($contentType, "application/json") === false
    ) {
        jsonResponse(
            false,
            "Content-Type must be application/json.",
            null,
            415
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Request Body Limit
    |--------------------------------------------------------------------------
    */
    $contentLength = (int)($_SERVER["CONTENT_LENGTH"] ?? 0);

    if ($contentLength > 10000) {
        jsonResponse(
            false,
            "Request payload is too large.",
            null,
            413
        );
    }

    $rawBody = file_get_contents("php://input");

    if ($rawBody === false || trim($rawBody) === "") {
        jsonResponse(
            false,
            "Request body is required.",
            null,
            400
        );
    }

    $input = json_decode(
        $rawBody,
        true
    );

    if (
        !is_array($input) ||
        json_last_error() !== JSON_ERROR_NONE
    ) {
        jsonResponse(
            false,
            "Invalid JSON request.",
            null,
            400
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Input Values
    |--------------------------------------------------------------------------
    */
    $name = trim((string)($input["name"] ?? ""));
    $mobile = trim((string)($input["mobile"] ?? ""));
    $email = trim((string)($input["email"] ?? ""));

    /*
    |--------------------------------------------------------------------------
    | Name Validation
    |--------------------------------------------------------------------------
    */
    if ($name === "") {
        jsonResponse(
            false,
            "Name is required.",
            null,
            422
        );
    }

    if (
        mb_strlen($name) < 2 ||
        mb_strlen($name) > 100
    ) {
        jsonResponse(
            false,
            "Name must be between 2 and 100 characters.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Mobile Validation
    |--------------------------------------------------------------------------
    */
    if (!preg_match("/^[6-9][0-9]{9}$/", $mobile)) {
        jsonResponse(
            false,
            "Enter a valid 10-digit mobile number.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Email Validation
    |--------------------------------------------------------------------------
    */
    if ($email !== "") {

        if (mb_strlen($email) > 150) {
            jsonResponse(
                false,
                "Email address is too long.",
                null,
                422
            );
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(
                false,
                "Enter a valid email address.",
                null,
                422
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Check Duplicate Mobile / Email
    |--------------------------------------------------------------------------
    */
    try {

        $stmt = $pdo->prepare("
            SELECT id
            FROM users
            WHERE mobile = :mobile
              AND id <> :id
            LIMIT 1
        ");

        $stmt->execute([
            ":mobile" => $mobile,
            ":id" => $userId
        ]);

        if ($stmt->fetch()) {
            jsonResponse(
                false,
                "This mobile number is already registered.",
                null,
                409
            );
        }

        if ($email !== "") {

            $stmt = $pdo->prepare("
                SELECT id
                FROM users
                WHERE email = :email
                  AND id <> :id
                LIMIT 1
            ");

            $stmt->execute([
                ":email" => $email,
                ":id" => $userId
            ]);

            if ($stmt->fetch()) {
                jsonResponse(
                    false,
                    "This email address is already registered.",
                    null,
                    409
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Update Profile
        |--------------------------------------------------------------------------
        */
        $stmt = $pdo->prepare("
            UPDATE users
            SET
                name = :name,
                mobile = :mobile,
                email = :email
            WHERE id = :id
            LIMIT 1
        ");

        $stmt->execute([
            ":name" => $name,
            ":mobile" => $mobile,
            ":email" => ($email !== "" ? $email : null),
            ":id" => $userId
        ]);

        /*
        |--------------------------------------------------------------------------
        | Return Updated User
        |--------------------------------------------------------------------------
        */
        $stmt = $pdo->prepare("
            SELECT
                id,
                name,
                email,
                mobile,
                profile_image,
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

        if (!$user) {
            jsonResponse(
                false,
                "Unable to load updated profile.",
                null,
                500
            );
        }

        $profileImageUrl = null;

        if (!empty($user["profile_image"])) {
            $profileImageUrl = rtrim(UPLOAD_URL, "/") .
                "/profile/" .
                ltrim($user["profile_image"], "/");
        }

        $user["profile_image_url"] = $profileImageUrl;

        jsonResponse(
            true,
            "Profile updated successfully.",
            [
                "user" => $user
            ]
        );

    } catch (PDOException $e) {

        error_log(
            "Profile Update Error: " . $e->getMessage()
        );

        jsonResponse(
            false,
            "Unable to update profile.",
            null,
            500
        );
    }
}

/*
|--------------------------------------------------------------------------
| Unsupported Method
|--------------------------------------------------------------------------
*/
jsonResponse(
    false,
    "Method not allowed.",
    null,
    405
);