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
header("Access-Control-Allow-Methods: POST, OPTIONS");
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
| Method
|--------------------------------------------------------------------------
*/

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") {
    jsonResponse(
        false,
        "Only POST method is allowed.",
        null,
        405
    );
}

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

requireAdminOnly();

/*
|--------------------------------------------------------------------------
| Upload Configuration
|--------------------------------------------------------------------------
*/

$uploadDirectory = __DIR__ . "/../../uploads/banners";

if (!is_dir($uploadDirectory)) {
    if (!mkdir($uploadDirectory, 0755, true) && !is_dir($uploadDirectory)) {
        jsonResponse(
            false,
            "Unable to create upload directory.",
            null,
            500
        );
    }
}

/*
|--------------------------------------------------------------------------
| File Validation
|--------------------------------------------------------------------------
*/

if (
    !isset($_FILES["image"]) ||
    !is_array($_FILES["image"])
) {
    jsonResponse(
        false,
        "Banner image is required.",
        null,
        422
    );
}

$file = $_FILES["image"];

if (!isset($file["error"]) || $file["error"] !== UPLOAD_ERR_OK) {
    jsonResponse(
        false,
        "Banner image upload failed.",
        null,
        422
    );
}

if (
    !isset($file["tmp_name"]) ||
    !is_string($file["tmp_name"]) ||
    !is_uploaded_file($file["tmp_name"])
) {
    jsonResponse(
        false,
        "Invalid uploaded file.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| File Size
|--------------------------------------------------------------------------
*/

$maxFileSize = 5 * 1024 * 1024; // 5 MB

if (
    !isset($file["size"]) ||
    (int) $file["size"] <= 0 ||
    (int) $file["size"] > $maxFileSize
) {
    jsonResponse(
        false,
        "Banner image must be between 1 byte and 5 MB.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| MIME Detection
|--------------------------------------------------------------------------
*/

$finfo = new finfo(FILEINFO_MIME_TYPE);

$mimeType = $finfo->file($file["tmp_name"]);

$allowedMimeTypes = [
    "image/jpeg" => "jpg",
    "image/png"  => "png",
    "image/webp" => "webp"
];

if (!isset($allowedMimeTypes[$mimeType])) {
    jsonResponse(
        false,
        "Only JPG, PNG and WEBP images are allowed.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Real Image Validation
|--------------------------------------------------------------------------
*/

$imageInfo = @getimagesize($file["tmp_name"]);

if ($imageInfo === false) {
    jsonResponse(
        false,
        "Uploaded file is not a valid image.",
        null,
        422
    );
}

$width = isset($imageInfo[0])
    ? (int) $imageInfo[0]
    : 0;

$height = isset($imageInfo[1])
    ? (int) $imageInfo[1]
    : 0;

if ($width < 100 || $height < 50) {
    jsonResponse(
        false,
        "Banner image dimensions are too small.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Generate Safe Filename
|--------------------------------------------------------------------------
*/

$extension = $allowedMimeTypes[$mimeType];

$filename =
    bin2hex(random_bytes(16)) .
    "_" .
    time() .
    "." .
    $extension;

$destination = $uploadDirectory . "/" . $filename;

/*
|--------------------------------------------------------------------------
| Move File
|--------------------------------------------------------------------------
*/

if (!move_uploaded_file($file["tmp_name"], $destination)) {
    jsonResponse(
        false,
        "Unable to save banner image.",
        null,
        500
    );
}

/*
|--------------------------------------------------------------------------
| Database Insert
|--------------------------------------------------------------------------
*/

try {

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO banners (
            image
        ) VALUES (
            :image
        )
    ");

    $stmt->execute([
        ":image" => $filename
    ]);

    $bannerId = (int) $pdo->lastInsertId();

    $stmt = $pdo->prepare("
        SELECT
            id,
            image,
            created_at
        FROM banners
        WHERE id = :id
        LIMIT 1
    ");

    $stmt->execute([
        ":id" => $bannerId
    ]);

    $banner = $stmt->fetch();

    if (!$banner) {
        throw new RuntimeException(
            "Banner could not be retrieved after creation."
        );
    }

    $banner["id"] = (int) $banner["id"];

    $banner["image_url"] =
        rtrim(UPLOAD_URL, "/") .
        "/banners/" .
        ltrim((string) $banner["image"], "/");

    $pdo->commit();

    jsonResponse(
        true,
        "Banner added successfully.",
        [
            "banner" => $banner
        ],
        201
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if (is_file($destination)) {
        @unlink($destination);
    }

    error_log(
        "AshrafBazar Banner Create PDO Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to add banner.",
        null,
        500
    );

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if (is_file($destination)) {
        @unlink($destination);
    }

    error_log(
        "AshrafBazar Banner Create Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to add banner.",
        null,
        500
    );
}