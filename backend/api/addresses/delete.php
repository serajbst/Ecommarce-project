<?php
declare(strict_types=1);

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../helpers/Response.php";
require_once __DIR__ . "/../../middleware/auth.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "DELETE") {
    jsonResponse(false, "Method not allowed.", null, 405);
}

requireAuth();

$userId = (int) $authUser["id"];

$addressId = filter_input(
    INPUT_GET,
    "id",
    FILTER_VALIDATE_INT,
    [
        "options" => [
            "min_range" => 1
        ]
    ]
);

if (!$addressId) {
    jsonResponse(
        false,
        "Valid address id is required.",
        null,
        422
    );
}

try {

    $pdo->beginTransaction();

    /*
     * Lock the address and verify ownership.
     */
    $stmt = $pdo->prepare("
        SELECT
            id,
            is_default
        FROM addresses
        WHERE
            id = :id
            AND user_id = :user_id
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->execute([
        ":id" => $addressId,
        ":user_id" => $userId
    ]);

    $address = $stmt->fetch();

    if (!$address) {
        $pdo->rollBack();

        jsonResponse(
            false,
            "Address not found.",
            null,
            404
        );
    }

    /*
     * If deleting the default address, find another
     * address that can become default.
     */
    $replacementId = null;

    if ((int) $address["is_default"] === 1) {

        $replacementStmt = $pdo->prepare("
            SELECT id
            FROM addresses
            WHERE
                user_id = :user_id
                AND id != :id
            ORDER BY created_at DESC
            LIMIT 1
            FOR UPDATE
        ");

        $replacementStmt->execute([
            ":user_id" => $userId,
            ":id" => $addressId
        ]);

        $replacement = $replacementStmt->fetch();

        if ($replacement) {
            $replacementId = (int) $replacement["id"];
        }
    }

    /*
     * Delete only the current user's address.
     */
    $deleteStmt = $pdo->prepare("
        DELETE FROM addresses
        WHERE
            id = :id
            AND user_id = :user_id
    ");

    $deleteStmt->execute([
        ":id" => $addressId,
        ":user_id" => $userId
    ]);

    if ($deleteStmt->rowCount() !== 1) {
        $pdo->rollBack();

        jsonResponse(
            false,
            "Unable to delete address.",
            null,
            500
        );
    }

    /*
     * If the deleted address was default,
     * automatically make the newest remaining address default.
     */
    if ($replacementId !== null) {

        $defaultStmt = $pdo->prepare("
            UPDATE addresses
            SET is_default = 1
            WHERE
                id = :replacement_id
                AND user_id = :user_id
        ");

        $defaultStmt->execute([
            ":replacement_id" => $replacementId,
            ":user_id" => $userId
        ]);
    }

    $pdo->commit();

    jsonResponse(
        true,
        "Address deleted successfully.",
        [
            "deleted_address_id" => $addressId,
            "new_default_address_id" => $replacementId
        ]
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "Address delete error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to delete address right now.",
        null,
        500
    );
}