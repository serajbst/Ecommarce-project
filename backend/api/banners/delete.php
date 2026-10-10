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
}

header("Vary: Origin");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

/*
|--------------------------------------------------------------------------
| OPTIONS
|--------------------------------------------------------------------------
*/

if (($_SERVER["REQUEST_METHOD"] ?? "") === "OPTIONS") {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Method Check
|--------------------------------------------------------------------------
*/

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "DELETE") {
    jsonResponse(
        false,
        "Only DELETE method is allowed.",
        null,
        405
    );
}

/*
|--------------------------------------------------------------------------
| Admin Authentication
|--------------------------------------------------------------------------
*/

requireAdminOnly();

/*
|--------------------------------------------------------------------------
| Get Banner ID
|--------------------------------------------------------------------------
*/

$bannerId = filter_input(
    INPUT_GET,
    "id",
    FILTER_VALIDATE_INT
);

if (
    $bannerId === false ||
    $bannerId === null ||
    $bannerId <= 0
) {
    jsonResponse(
        false,
        "Valid banner ID is required.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Delete Banner
|--------------------------------------------------------------------------
*/

try {

    $pdo->beginTransaction();

    /*
     * Lock the banner row while deleting.
     */
    $stmt = $pdo->prepare("
        SELECT
            id,
            image
        FROM banners
        WHERE id = :id
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->execute([
        ":id" => $bannerId
    ]);

    $banner = $stmt->fetch();

    if (!$banner) {

        $pdo->rollBack();

        jsonResponse(
            false,
            "Banner not found.",
            null,
            404
        );
    }

    /*
     * Delete database record.
     */
    $deleteStmt = $pdo->prepare("
        DELETE FROM banners
        WHERE id = :id
    ");

    $deleteStmt->execute([
        ":id" => $bannerId
    ]);

    if ($deleteStmt->rowCount() !== 1) {
        throw new RuntimeException(
            "Banner could not be deleted."
        );
    }

    $pdo->commit();

    /*
     * Delete physical image after successful DB deletion.
     */
    $imageDeleted = false;

    if (
        isset($banner["image"]) &&
        is_string($banner["image"]) &&
        $banner["image"] !== ""
    ) {

        /*
         * basename() prevents path traversal.
         */
        $safeFilename = basename($banner["image"]);

        $imagePath =
            __DIR__ .
            "/../../uploads/banners/" .
            $safeFilename;

        if (is_file($imagePath)) {
            $imageDeleted = @unlink($imagePath);
        }
    }

    jsonResponse(
        true,
        "Banner deleted successfully.",
        [
            "id" => (int) $banner["id"],
            "image_deleted" => $imageDeleted
        ],
        200
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "AshrafBazar Banner Delete PDO Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to delete banner.",
        null,
        500
    );

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "AshrafBazar Banner Delete Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to delete banner.",
        null,
        500
    );
}