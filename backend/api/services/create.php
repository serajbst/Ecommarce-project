<?php

declare(strict_types=1);

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../config/response.php";
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

$requestOrigin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($requestOrigin, $allowedOrigins, true)) {
    header(
        "Access-Control-Allow-Origin: " .
        $requestOrigin
    );
}

header("Vary: Origin");

header(
    "Access-Control-Allow-Headers: Content-Type, Authorization"
);

header(
    "Access-Control-Allow-Methods: POST, OPTIONS"
);

header(
    "Access-Control-Allow-Credentials: true"
);

header(
    "Content-Type: application/json; charset=UTF-8"
);

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
| Method
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
| Authorization
|--------------------------------------------------------------------------
*/

requireAdmin();

/*
|--------------------------------------------------------------------------
| Text Fields
|--------------------------------------------------------------------------
*/

$name =
    trim((string) ($_POST["name"] ?? ""));

$description =
    trim((string) ($_POST["description"] ?? ""));

$phone =
    preg_replace(
        "/\D+/",
        "",
        (string) ($_POST["phone"] ?? "")
    );

$whatsapp =
    preg_replace(
        "/\D+/",
        "",
        (string) ($_POST["whatsapp"] ?? "")
    );

$isActiveRaw =
    $_POST["is_active"] ?? "1";

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

if ($name === "") {
    jsonResponse(
        false,
        "Service name is required.",
        null,
        422
    );
}

if (mb_strlen($name) > 150) {
    jsonResponse(
        false,
        "Service name cannot exceed 150 characters.",
        null,
        422
    );
}

if ($description === "") {
    jsonResponse(
        false,
        "Service description is required.",
        null,
        422
    );
}

if (mb_strlen($description) > 5000) {
    jsonResponse(
        false,
        "Service description cannot exceed 5000 characters.",
        null,
        422
    );
}

if (!preg_match("/^[0-9]{10}$/", $phone)) {
    jsonResponse(
        false,
        "Please enter a valid 10 digit contact number.",
        null,
        422
    );
}

if (!preg_match("/^[0-9]{10}$/", $whatsapp)) {
    jsonResponse(
        false,
        "Please enter a valid 10 digit WhatsApp number.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Active Status
|--------------------------------------------------------------------------
*/

if (
    $isActiveRaw === "1" ||
    $isActiveRaw === "true"
) {

    $isActive = 1;

} elseif (
    $isActiveRaw === "0" ||
    $isActiveRaw === "false"
) {

    $isActive = 0;

} else {

    jsonResponse(
        false,
        "Invalid active status.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Image Required
|--------------------------------------------------------------------------
*/

if (
    !isset($_FILES["image"]) ||
    !is_array($_FILES["image"])
) {
    jsonResponse(
        false,
        "Service image is required.",
        null,
        422
    );
}

$image = $_FILES["image"];

/*
|--------------------------------------------------------------------------
| Upload Error
|--------------------------------------------------------------------------
*/

if (
    !isset($image["error"]) ||
    $image["error"] !== UPLOAD_ERR_OK
) {
    jsonResponse(
        false,
        "Image upload failed.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Validate Temporary File
|--------------------------------------------------------------------------
*/

if (
    !isset($image["tmp_name"]) ||
    !is_string($image["tmp_name"]) ||
    !is_uploaded_file($image["tmp_name"])
) {
    jsonResponse(
        false,
        "Invalid uploaded image.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| File Size
|--------------------------------------------------------------------------
*/

$maxFileSize =
    5 * 1024 * 1024;

if (
    !isset($image["size"]) ||
    (int) $image["size"] <= 0
) {
    jsonResponse(
        false,
        "Invalid image file.",
        null,
        422
    );
}

if (
    (int) $image["size"] >
    $maxFileSize
) {
    jsonResponse(
        false,
        "Image size cannot exceed 5 MB.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| MIME Detection
|--------------------------------------------------------------------------
*/

$finfo =
    new finfo(FILEINFO_MIME_TYPE);

$mimeType =
    $finfo->file(
        $image["tmp_name"]
    );

$allowedMimeTypes = [
    "image/jpeg" => "jpg",
    "image/png" => "png",
    "image/webp" => "webp"
];

if (
    !isset(
        $allowedMimeTypes[$mimeType]
    )
) {
    jsonResponse(
        false,
        "Only JPG, PNG and WEBP images are allowed.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Verify Actual Image
|--------------------------------------------------------------------------
*/

$imageInfo =
    @getimagesize(
        $image["tmp_name"]
    );

if ($imageInfo === false) {
    jsonResponse(
        false,
        "Invalid image file.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Image Dimensions
|--------------------------------------------------------------------------
*/

$maxWidth = 5000;
$maxHeight = 5000;

$imageWidth =
    (int) ($imageInfo[0] ?? 0);

$imageHeight =
    (int) ($imageInfo[1] ?? 0);

if (
    $imageWidth <= 0 ||
    $imageHeight <= 0
) {
    jsonResponse(
        false,
        "Invalid image dimensions.",
        null,
        422
    );
}

if (
    $imageWidth > $maxWidth ||
    $imageHeight > $maxHeight
) {
    jsonResponse(
        false,
        "Image dimensions are too large.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Duplicate Service Name
|--------------------------------------------------------------------------
*/

try {

    $stmt = $pdo->prepare("
        SELECT id
        FROM services
        WHERE name = :name
        LIMIT 1
    ");

    $stmt->execute([
        ":name" => $name
    ]);

    if ($stmt->fetch()) {
        jsonResponse(
            false,
            "A service with this name already exists.",
            null,
            409
        );
    }

} catch (PDOException $e) {

    error_log(
        "Service duplicate check error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to validate service right now.",
        null,
        500
    );
}

/*
|--------------------------------------------------------------------------
| Upload Directory
|--------------------------------------------------------------------------
*/

$uploadDirectory =
    __DIR__ .
    "/../../uploads/services";

if (!is_dir($uploadDirectory)) {

    if (
        !mkdir(
            $uploadDirectory,
            0755,
            true
        )
    ) {
        jsonResponse(
            false,
            "Unable to create image upload directory.",
            null,
            500
        );
    }
}

if (!is_writable($uploadDirectory)) {
    jsonResponse(
        false,
        "Image upload directory is not writable.",
        null,
        500
    );
}

/*
|--------------------------------------------------------------------------
| Safe Filename
|--------------------------------------------------------------------------
*/

$extension =
    $allowedMimeTypes[$mimeType];

try {

    $randomName =
        bin2hex(
            random_bytes(16)
        );

} catch (Throwable $e) {

    error_log(
        "Random filename error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to process image.",
        null,
        500
    );
}

$filename =
    "service_" .
    $randomName .
    "." .
    $extension;

$destination =
    $uploadDirectory .
    DIRECTORY_SEPARATOR .
    $filename;

$imagePath =
    "uploads/services/" .
    $filename;

/*
|--------------------------------------------------------------------------
| Move Image
|--------------------------------------------------------------------------
*/

if (
    !move_uploaded_file(
        $image["tmp_name"],
        $destination
    )
) {
    jsonResponse(
        false,
        "Unable to save uploaded image.",
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
        INSERT INTO services
        (
            name,
            description,
            image,
            phone,
            whatsapp,
            is_active
        )
        VALUES
        (
            :name,
            :description,
            :image,
            :phone,
            :whatsapp,
            :is_active
        )
    ");

    $stmt->execute([
        ":name" =>
            $name,

        ":description" =>
            $description,

        ":image" =>
            $imagePath,

        ":phone" =>
            $phone,

        ":whatsapp" =>
            $whatsapp,

        ":is_active" =>
            $isActive
    ]);

    $serviceId =
        (int) $pdo->lastInsertId();

    $pdo->commit();

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if (is_file($destination)) {
        @unlink($destination);
    }

    error_log(
        "Service create DB error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to create service.",
        null,
        500
    );
}

/*
|--------------------------------------------------------------------------
| Fetch Created Service
|--------------------------------------------------------------------------
*/

try {

    $stmt = $pdo->prepare("
        SELECT
            id,
            name,
            description,
            image,
            phone,
            whatsapp,
            is_active,
            created_at,
            updated_at
        FROM services
        WHERE id = :id
        LIMIT 1
    ");

    $stmt->execute([
        ":id" => $serviceId
    ]);

    $service =
        $stmt->fetch(
            PDO::FETCH_ASSOC
        );

    if (!$service) {

        jsonResponse(
            false,
            "Service created but could not be retrieved.",
            null,
            500
        );
    }

} catch (PDOException $e) {

    error_log(
        "Service fetch after create error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Service was created but could not be retrieved.",
        null,
        500
    );
}

/*
|--------------------------------------------------------------------------
| Full Image URL
|--------------------------------------------------------------------------
*/

$service["image"] =
    rtrim(BASE_URL, "/") .
    "/" .
    ltrim(
        (string) $service["image"],
        "/"
    );

$service["id"] =
    (int) $service["id"];

$service["is_active"] =
    (int) $service["is_active"];

/*
|--------------------------------------------------------------------------
| Response
|--------------------------------------------------------------------------
*/

jsonResponse(
    true,
    "Service created successfully.",
    $service,
    201
);