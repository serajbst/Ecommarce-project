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

$input = json_decode($rawInput, true);

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
| Input
|--------------------------------------------------------------------------
*/

$name = trim((string)($input["name"] ?? ""));
$email = strtolower(trim((string)($input["email"] ?? "")));
$mobile = trim((string)($input["mobile"] ?? ""));
$password = (string)($input["password"] ?? "");

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

if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
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

if ($mobile === "") {
    jsonResponse(
        false,
        "Mobile number is required.",
        null,
        422
    );
}

if (!preg_match("/^[6-9][0-9]{9}$/", $mobile)) {
    jsonResponse(
        false,
        "Please enter a valid 10-digit mobile number.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Email Validation
|--------------------------------------------------------------------------
| Email is optional
|--------------------------------------------------------------------------
*/

if ($email !== "") {

    if (strlen($email) > 150) {
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
            "Please enter a valid email address.",
            null,
            422
        );
    }
}

/*
|--------------------------------------------------------------------------
| Password Validation
|--------------------------------------------------------------------------
*/

if ($password === "") {
    jsonResponse(
        false,
        "Password is required.",
        null,
        422
    );
}

if (strlen($password) < 6) {
    jsonResponse(
        false,
        "Password must be at least 6 characters.",
        null,
        422
    );
}

if (strlen($password) > 200) {
    jsonResponse(
        false,
        "Password is too long.",
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
    | Check Existing Mobile
    |--------------------------------------------------------------------------
    */

    $mobileStmt = $pdo->prepare("
        SELECT id
        FROM users
        WHERE mobile = :mobile
        LIMIT 1
    ");

    $mobileStmt->execute([
        ":mobile" => $mobile
    ]);

    if ($mobileStmt->fetch()) {
        jsonResponse(
            false,
            "This mobile number is already registered.",
            null,
            409
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Check Existing Email
    |--------------------------------------------------------------------------
    */

    if ($email !== "") {

        $emailStmt = $pdo->prepare("
            SELECT id
            FROM users
            WHERE email = :email
            LIMIT 1
        ");

        $emailStmt->execute([
            ":email" => $email
        ]);

        if ($emailStmt->fetch()) {
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
    | Create Customer
    |--------------------------------------------------------------------------
    |
    | Role is always customer.
    | Frontend cannot choose admin/staff.
    |
    */

    $stmt = $pdo->prepare("
        INSERT INTO users (
            name,
            email,
            mobile,
            password,
            role,
            status,
            created_at,
            updated_at
        )
        VALUES (
            :name,
            :email,
            :mobile,
            :password,
            'customer',
            'active',
            NOW(),
            NOW()
        )
    ");

    $stmt->execute([
        ":name" => $name,
        ":email" => $email !== "" ? $email : null,
        ":mobile" => $mobile,
        ":password" => $password
    ]);

    /*
    |--------------------------------------------------------------------------
    | Get User ID
    |--------------------------------------------------------------------------
    */

    $userId = (int)$pdo->lastInsertId();

    if ($userId <= 0) {
        jsonResponse(
            false,
            "Unable to create account.",
            null,
            500
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Fetch Created User
    |--------------------------------------------------------------------------
    |
    | Password is intentionally NOT returned.
    |
    */

    $userStmt = $pdo->prepare("
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

    $userStmt->execute([
        ":id" => $userId
    ]);

    $user = $userStmt->fetch();

    if (!$user) {
        jsonResponse(
            false,
            "Registration completed but user data could not be loaded.",
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
        "Registration successful.",
        [
            "user" => $user
        ],
        201
    );

} catch (PDOException $e) {

    /*
    |--------------------------------------------------------------------------
    | Log Database Error
    |--------------------------------------------------------------------------
    */

    error_log(
        "AshrafBazar Register DB Error: " . $e->getMessage()
    );

    /*
    |--------------------------------------------------------------------------
    | Duplicate Entry Safety
    |--------------------------------------------------------------------------
    */

    if ((int)$e->errorInfo[1] === 1062) {

        jsonResponse(
            false,
            "Email or mobile number is already registered.",
            null,
            409
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Generic Error
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        false,
        "Unable to create account.",
        null,
        500
    );
}