<?php
declare(strict_types=1);

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../helpers/Response.php";
require_once __DIR__ . "/../../middleware/auth.php";

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

requireAuth();

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    jsonResponse(false, "Invalid JSON request.", null, 400);
}

$productId = filter_var(
    $input["product_id"] ?? null,
    FILTER_VALIDATE_INT,
    ["options" => ["min_range" => 1]]
);

$orderId = filter_var(
    $input["order_id"] ?? null,
    FILTER_VALIDATE_INT,
    ["options" => ["min_range" => 1]]
);

$rating = filter_var(
    $input["rating"] ?? null,
    FILTER_VALIDATE_INT,
    ["options" => ["min_range" => 1, "max_range" => 5]]
);

$review = isset($input["review"])
    ? trim((string) $input["review"])
    : "";

if (!$productId) {
    jsonResponse(false, "Valid product_id is required.", null, 422);
}

if (!$orderId) {
    jsonResponse(false, "Valid order_id is required.", null, 422);
}

if (!$rating) {
    jsonResponse(false, "Rating must be between 1 and 5.", null, 422);
}

if ($review !== "" && mb_strlen($review) > 2000) {
    jsonResponse(false, "Review cannot exceed 2000 characters.", null, 422);
}

$userId = (int) $authUser["id"];

try {
    /*
     * Verify product exists and is active.
     */
    $productStmt = $pdo->prepare("
        SELECT id, name, status
        FROM products
        WHERE id = :product_id
        LIMIT 1
    ");

    $productStmt->execute([
        ":product_id" => $productId
    ]);

    $product = $productStmt->fetch();

    if (!$product) {
        jsonResponse(false, "Product not found.", null, 404);
    }

    if ($product["status"] !== "active") {
        jsonResponse(false, "This product is not available for review.", null, 422);
    }

    /*
     * Verify that the order belongs to the logged-in customer,
     * is delivered, and contains this product.
     */
    $purchaseStmt = $pdo->prepare("
        SELECT
            o.id,
            o.order_number,
            o.order_status
        FROM orders o
        INNER JOIN order_items oi
            ON oi.order_id = o.id
        WHERE
            o.id = :order_id
            AND o.user_id = :user_id
            AND oi.product_id = :product_id
            AND o.order_status = 'delivered'
        LIMIT 1
    ");

    $purchaseStmt->execute([
        ":order_id"   => $orderId,
        ":user_id"    => $userId,
        ":product_id" => $productId
    ]);

    $purchase = $purchaseStmt->fetch();

    if (!$purchase) {
        jsonResponse(
            false,
            "You can review this product only after receiving it.",
            null,
            403
        );
    }

    /*
     * Prevent duplicate review for the same product/order/customer.
     */
    $existingStmt = $pdo->prepare("
        SELECT id, status
        FROM reviews
        WHERE
            user_id = :user_id
            AND product_id = :product_id
            AND order_id = :order_id
        LIMIT 1
    ");

    $existingStmt->execute([
        ":user_id"    => $userId,
        ":product_id" => $productId,
        ":order_id"   => $orderId
    ]);

    $existing = $existingStmt->fetch();

    if ($existing) {
        jsonResponse(
            false,
            "You have already reviewed this product for this order.",
            [
                "review_id" => (int) $existing["id"],
                "status"    => $existing["status"]
            ],
            409
        );
    }

    /*
     * Create review as pending.
     * It must be approved by admin before appearing publicly.
     */
    $pdo->beginTransaction();

    $insertStmt = $pdo->prepare("
        INSERT INTO reviews (
            user_id,
            product_id,
            order_id,
            rating,
            review,
            status
        )
        VALUES (
            :user_id,
            :product_id,
            :order_id,
            :rating,
            :review,
            'pending'
        )
    ");

    $insertStmt->execute([
        ":user_id"    => $userId,
        ":product_id" => $productId,
        ":order_id"   => $orderId,
        ":rating"     => $rating,
        ":review"     => ($review !== "" ? $review : null)
    ]);

    $reviewId = (int) $pdo->lastInsertId();

    $pdo->commit();

    jsonResponse(
        true,
        "Review submitted successfully. It will be visible after approval.",
        [
            "review_id"  => $reviewId,
            "product_id" => $productId,
            "order_id"   => $orderId,
            "rating"     => $rating,
            "status"     => "pending"
        ],
        201
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "Review create error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to submit review right now.",
        null,
        500
    );
}