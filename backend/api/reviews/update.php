<?php
declare(strict_types=1);

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../helpers/Response.php";
require_once __DIR__ . "/../../middleware/auth.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: PUT, PATCH, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if (
    $_SERVER["REQUEST_METHOD"] !== "PUT" &&
    $_SERVER["REQUEST_METHOD"] !== "PATCH"
) {
    jsonResponse(false, "Method not allowed.", null, 405);
}

/*
 * Only admin/staff can moderate reviews.
 */
requireAdmin();

$reviewId = filter_input(
    INPUT_GET,
    "id",
    FILTER_VALIDATE_INT,
    [
        "options" => [
            "min_range" => 1
        ]
    ]
);

if (!$reviewId) {
    jsonResponse(false, "Valid review id is required.", null, 422);
}

$input = json_decode(
    file_get_contents("php://input"),
    true
);

if (!is_array($input)) {
    jsonResponse(false, "Invalid JSON request.", null, 400);
}

/*
 * Only these two fields can be changed.
 */
$status = isset($input["status"])
    ? trim((string) $input["status"])
    : "";

$adminNote = isset($input["admin_note"])
    ? trim((string) $input["admin_note"])
    : null;

$allowedStatuses = [
    "pending",
    "approved",
    "rejected"
];

if (!in_array($status, $allowedStatuses, true)) {
    jsonResponse(
        false,
        "Invalid review status.",
        null,
        422
    );
}

if ($adminNote !== null && mb_strlen($adminNote) > 2000) {
    jsonResponse(
        false,
        "Admin note cannot exceed 2000 characters.",
        null,
        422
    );
}

try {

    /*
     * Lock review row before updating.
     */
    $pdo->beginTransaction();

    $reviewStmt = $pdo->prepare("
        SELECT
            r.id,
            r.user_id,
            r.product_id,
            r.order_id,
            r.rating,
            r.review,
            r.status,
            r.created_at
        FROM reviews r
        WHERE r.id = :id
        LIMIT 1
        FOR UPDATE
    ");

    $reviewStmt->execute([
        ":id" => $reviewId
    ]);

    $review = $reviewStmt->fetch();

    if (!$review) {
        $pdo->rollBack();

        jsonResponse(
            false,
            "Review not found.",
            null,
            404
        );
    }

    /*
     * Update only moderation fields.
     *
     * Customer's:
     * - user_id
     * - product_id
     * - order_id
     * - rating
     * - review
     *
     * cannot be modified by admin through this endpoint.
     */
    $updateStmt = $pdo->prepare("
        UPDATE reviews
        SET
            status = :status,
            admin_note = :admin_note
        WHERE id = :id
    ");

    $updateStmt->execute([
        ":status"     => $status,
        ":admin_note" => $adminNote,
        ":id"         => $reviewId
    ]);

    /*
     * Fetch updated review.
     */
    $updatedStmt = $pdo->prepare("
        SELECT
            id,
            user_id,
            product_id,
            order_id,
            rating,
            review,
            status,
            admin_note,
            created_at
        FROM reviews
        WHERE id = :id
        LIMIT 1
    ");

    $updatedStmt->execute([
        ":id" => $reviewId
    ]);

    $updatedReview = $updatedStmt->fetch();

    $pdo->commit();

    if (!$updatedReview) {
        jsonResponse(
            false,
            "Review updated but could not be fetched.",
            null,
            500
        );
    }

    $updatedReview["id"] = (int) $updatedReview["id"];
    $updatedReview["user_id"] = (int) $updatedReview["user_id"];
    $updatedReview["product_id"] = (int) $updatedReview["product_id"];

    if ($updatedReview["order_id"] !== null) {
        $updatedReview["order_id"] = (int) $updatedReview["order_id"];
    }

    $updatedReview["rating"] = (int) $updatedReview["rating"];

    jsonResponse(
        true,
        "Review updated successfully.",
        $updatedReview
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "Review update error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to update review right now.",
        null,
        500
    );
}