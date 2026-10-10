<?php
declare(strict_types=1);

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../middleware/auth.php";
require_once __DIR__ . "/../../config/Response.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    jsonResponse(false, "Method not allowed.", null, 405);
}


$input = json_decode(
    file_get_contents("php://input"),
    true
);

if (!is_array($input)) {
    jsonResponse(false, "Invalid JSON request.", null, 400);
}

$userId = (int) $authUser["id"];

$name = trim((string) ($input["name"] ?? ""));
$mobile = trim((string) ($input["mobile"] ?? ""));
$addressLine = trim((string) ($input["address_line"] ?? ""));
$city = trim((string) ($input["city"] ?? ""));
$state = trim((string) ($input["state"] ?? "Bihar"));
$pincode = trim((string) ($input["pincode"] ?? ""));
$addressType = trim((string) ($input["address_type"] ?? "home"));

$isDefault = filter_var(
    $input["is_default"] ?? false,
    FILTER_VALIDATE_BOOLEAN,
    FILTER_NULL_ON_FAILURE
);

$isDefault = $isDefault === true;

/*
 * Validation
 */
if ($name === "") {
    jsonResponse(false, "Name is required.", null, 422);
}

if (mb_strlen($name) > 100) {
    jsonResponse(false, "Name is too long.", null, 422);
}

if (!preg_match('/^[6-9][0-9]{9}$/', $mobile)) {
    jsonResponse(
        false,
        "Enter a valid 10-digit mobile number.",
        null,
        422
    );
}

if ($addressLine === "") {
    jsonResponse(false, "Address is required.", null, 422);
}

if (mb_strlen($addressLine) > 2000) {
    jsonResponse(false, "Address is too long.", null, 422);
}

if ($city === "") {
    jsonResponse(false, "City is required.", null, 422);
}

if (mb_strlen($city) > 100) {
    jsonResponse(false, "City name is too long.", null, 422);
}

if ($state === "") {
    jsonResponse(false, "State is required.", null, 422);
}

if (mb_strlen($state) > 100) {
    jsonResponse(false, "State name is too long.", null, 422);
}

if (!preg_match('/^[0-9]{6}$/', $pincode)) {
    jsonResponse(
        false,
        "Enter a valid 6-digit pincode.",
        null,
        422
    );
}

$allowedAddressTypes = [
    "home",
    "work",
    "other"
];

if (!in_array($addressType, $allowedAddressTypes, true)) {
    jsonResponse(
        false,
        "Invalid address type.",
        null,
        422
    );
}

try {

    /*
     * Verify active user.
     */
    $userStmt = $pdo->prepare("
        SELECT id, status
        FROM users
        WHERE id = :user_id
        LIMIT 1
    ");

    $userStmt->execute([
        ":user_id" => $userId
    ]);

    $user = $userStmt->fetch();

    if (!$user || $user["status"] !== "active") {
        jsonResponse(
            false,
            "Your account is not active.",
            null,
            403
        );
    }

    $pdo->beginTransaction();

    /*
     * If this is the first address, automatically make it default.
     */
    $countStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM addresses
        WHERE user_id = :user_id
    ");

    $countStmt->execute([
        ":user_id" => $userId
    ]);

    $addressCount = (int) $countStmt->fetchColumn();

    if ($addressCount === 0) {
        $isDefault = true;
    }

    /*
     * Only one default address per user.
     */
    if ($isDefault) {

        $resetStmt = $pdo->prepare("
            UPDATE addresses
            SET is_default = 0
            WHERE user_id = :user_id
        ");

        $resetStmt->execute([
            ":user_id" => $userId
        ]);
    }

    /*
     * Insert address.
     */
    $insertStmt = $pdo->prepare("
        INSERT INTO addresses (
            user_id,
            name,
            mobile,
            address_line,
            city,
            state,
            pincode,
            address_type,
            is_default
        )
        VALUES (
            :user_id,
            :name,
            :mobile,
            :address_line,
            :city,
            :state,
            :pincode,
            :address_type,
            :is_default
        )
    ");

    $insertStmt->execute([
        ":user_id" => $userId,
        ":name" => $name,
        ":mobile" => $mobile,
        ":address_line" => $addressLine,
        ":city" => $city,
        ":state" => $state,
        ":pincode" => $pincode,
        ":address_type" => $addressType,
        ":is_default" => $isDefault ? 1 : 0
    ]);

    $addressId = (int) $pdo->lastInsertId();

    /*
     * Fetch created address.
     */
    $addressStmt = $pdo->prepare("
        SELECT
            id,
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
        WHERE
            id = :id
            AND user_id = :user_id
        LIMIT 1
    ");

    $addressStmt->execute([
        ":id" => $addressId,
        ":user_id" => $userId
    ]);

    $address = $addressStmt->fetch();

    if (!$address) {
        $pdo->rollBack();

        jsonResponse(
            false,
            "Address created but could not be fetched.",
            null,
            500
        );
    }

    $pdo->commit();

    $address["id"] = (int) $address["id"];
    $address["is_default"] = (int) $address["is_default"];

    jsonResponse(
        true,
        "Address added successfully.",
        $address,
        201
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "Address create error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to add address right now.",
        null,
        500
    );
}