<?php
declare(strict_types=1);

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../helpers/Response.php";
require_once __DIR__ . "/../../middleware/auth.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    jsonResponse(false, "Method not allowed.", null, 405);
}

requireAuth();

$userId = (int) $authUser["id"];

try {

    /*
     * Only addresses belonging to the
     * currently authenticated customer.
     */
    $stmt = $pdo->prepare("
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
        WHERE user_id = :user_id
        ORDER BY
            is_default DESC,
            created_at DESC
    ");

    $stmt->execute([
        ":user_id" => $userId
    ]);

    $addresses = $stmt->fetchAll();

    foreach ($addresses as &$address) {
        $address["id"] = (int) $address["id"];
        $address["is_default"] = (int) $address["is_default"];
    }

    unset($address);

    jsonResponse(
        true,
        "Addresses fetched successfully.",
        [
            "addresses" => $addresses,
            "total" => count($addresses)
        ]
    );

} catch (PDOException $e) {

    error_log(
        "Addresses index error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch addresses right now.",
        null,
        500
    );
}