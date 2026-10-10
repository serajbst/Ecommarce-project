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
| Admin Authentication
|--------------------------------------------------------------------------
*/

requireAdminOnly();

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function cleanString($value): string
{
    return trim((string)($value ?? ""));
}

function removeUploadedFiles(array $files): void
{
    foreach ($files as $file) {
        if (
            isset($file["path"]) &&
            is_string($file["path"]) &&
            is_file($file["path"])
        ) {
            @unlink($file["path"]);
        }
    }
}

/*
|--------------------------------------------------------------------------
| Read Product Data
|--------------------------------------------------------------------------
*/

$name = cleanString($_POST["name"] ?? "");

$categoryId = (int)($_POST["category_id"] ?? 0);

$priceRaw = cleanString($_POST["price"] ?? "");

$oldPriceRaw = cleanString($_POST["old_price"] ?? "");

$sku = cleanString($_POST["sku"] ?? "");

$description = cleanString(
    $_POST["description"] ?? ""
);

$shortDescription = cleanString(
    $_POST["short_description"] ?? ""
);

$stockRaw = cleanString(
    $_POST["stock"] ?? "0"
);

$lowStockLimitRaw = cleanString(
    $_POST["low_stock_limit"] ?? "5"
);

$status = strtolower(
    cleanString($_POST["status"] ?? "active")
);

$featuredRaw = $_POST["featured"] ?? "0";

/*
|--------------------------------------------------------------------------
| Basic Validation
|--------------------------------------------------------------------------
*/

if ($name === "") {
    jsonResponse(
        false,
        "Product name is required.",
        null,
        422
    );
}

if (mb_strlen($name) > 255) {
    jsonResponse(
        false,
        "Product name is too long.",
        null,
        422
    );
}

if ($categoryId <= 0) {
    jsonResponse(
        false,
        "Valid category is required.",
        null,
        422
    );
}

if ($priceRaw === "" || !is_numeric($priceRaw)) {
    jsonResponse(
        false,
        "Valid product price is required.",
        null,
        422
    );
}

$price = (float)$priceRaw;

if ($price < 0) {
    jsonResponse(
        false,
        "Price cannot be negative.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Old Price
|--------------------------------------------------------------------------
*/

$oldPrice = null;

if ($oldPriceRaw !== "") {

    if (!is_numeric($oldPriceRaw)) {
        jsonResponse(
            false,
            "Invalid old price.",
            null,
            422
        );
    }

    $oldPrice = (float)$oldPriceRaw;

    if ($oldPrice < 0) {
        jsonResponse(
            false,
            "Old price cannot be negative.",
            null,
            422
        );
    }
}

/*
|--------------------------------------------------------------------------
| SKU
|--------------------------------------------------------------------------
*/

if ($sku === "") {
    jsonResponse(
        false,
        "SKU is required.",
        null,
        422
    );
}

if (mb_strlen($sku) > 100) {
    jsonResponse(
        false,
        "SKU is too long.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Stock
|--------------------------------------------------------------------------
*/

if (
    $stockRaw === "" ||
    !preg_match('/^\d+$/', $stockRaw)
) {
    jsonResponse(
        false,
        "Invalid stock quantity.",
        null,
        422
    );
}

$stock = (int)$stockRaw;

/*
|--------------------------------------------------------------------------
| Low Stock Limit
|--------------------------------------------------------------------------
*/

if (
    $lowStockLimitRaw === "" ||
    !preg_match('/^\d+$/', $lowStockLimitRaw)
) {
    jsonResponse(
        false,
        "Invalid low stock limit.",
        null,
        422
    );
}

$lowStockLimit = (int)$lowStockLimitRaw;

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

$statusMap = [
    "active" => "active",
    "inactive" => "inactive",
    "out of stock" => "out_of_stock",
    "out_of_stock" => "out_of_stock"
];

if (!isset($statusMap[$status])) {
    jsonResponse(
        false,
        "Invalid product status.",
        null,
        422
    );
}

$status = $statusMap[$status];

/*
|--------------------------------------------------------------------------
| Featured
|--------------------------------------------------------------------------
*/

$featured = 0;

if (
    $featuredRaw === true ||
    $featuredRaw === 1 ||
    $featuredRaw === "1" ||
    strtolower((string)$featuredRaw) === "true" ||
    strtolower((string)$featuredRaw) === "yes"
) {
    $featured = 1;
}

/*
|--------------------------------------------------------------------------
| Generate Slug
|--------------------------------------------------------------------------
*/

$slug = strtolower($name);

$slug = preg_replace(
    "/[^a-z0-9]+/",
    "-",
    $slug
);

$slug = trim($slug, "-");

if ($slug === "") {
    jsonResponse(
        false,
        "Unable to generate product slug.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Images
|--------------------------------------------------------------------------
|
| Frontend should send:
|
| images[]
|
| Maximum 5 images.
|
| Old single "image" upload is also supported.
|
*/

$uploadedImages = [];

$uploadDir = __DIR__ . "/../../uploads/products";

$uploadUrl = UPLOAD_URL . "/products";

$maxFileSize = 5 * 1024 * 1024;

$allowedMimeTypes = [
    "image/jpeg" => "jpg",
    "image/png" => "png",
    "image/webp" => "webp"
];

/*
|--------------------------------------------------------------------------
| Normalize Uploaded Files
|--------------------------------------------------------------------------
*/

$files = [];

if (
    isset($_FILES["images"]) &&
    is_array($_FILES["images"]["name"])
) {

    $count = count($_FILES["images"]["name"]);

    if ($count > 5) {
        jsonResponse(
            false,
            "Maximum 5 images are allowed.",
            null,
            422
        );
    }

    for ($i = 0; $i < $count; $i++) {

        if (
            !isset(
                $_FILES["images"]["error"][$i],
                $_FILES["images"]["tmp_name"][$i],
                $_FILES["images"]["size"][$i]
            )
        ) {
            continue;
        }

        if (
            $_FILES["images"]["error"][$i] ===
            UPLOAD_ERR_NO_FILE
        ) {
            continue;
        }

        $files[] = [
            "name" =>
                $_FILES["images"]["name"][$i],

            "tmp_name" =>
                $_FILES["images"]["tmp_name"][$i],

            "size" =>
                (int)$_FILES["images"]["size"][$i],

            "error" =>
                (int)$_FILES["images"]["error"][$i]
        ];
    }

} elseif (
    isset($_FILES["image"]) &&
    is_array($_FILES["image"]) &&
    $_FILES["image"]["error"] !== UPLOAD_ERR_NO_FILE
) {

    $files[] = [
        "name" =>
            $_FILES["image"]["name"],

        "tmp_name" =>
            $_FILES["image"]["tmp_name"],

        "size" =>
            (int)$_FILES["image"]["size"],

        "error" =>
            (int)$_FILES["image"]["error"]
    ];
}

if (count($files) > 5) {
    jsonResponse(
        false,
        "Maximum 5 images are allowed.",
        null,
        422
    );
}

/*
|--------------------------------------------------------------------------
| Upload Directory
|--------------------------------------------------------------------------
*/

if (!empty($files) && !is_dir($uploadDir)) {

    if (!mkdir($uploadDir, 0755, true)) {
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
| Validate & Upload Images
|--------------------------------------------------------------------------
*/

foreach ($files as $file) {

    if ($file["error"] !== UPLOAD_ERR_OK) {

        removeUploadedFiles($uploadedImages);

        jsonResponse(
            false,
            "One of the images failed to upload.",
            null,
            422
        );
    }

    if (!is_uploaded_file($file["tmp_name"])) {

        removeUploadedFiles($uploadedImages);

        jsonResponse(
            false,
            "Invalid uploaded image.",
            null,
            422
        );
    }

    if ($file["size"] <= 0) {

        removeUploadedFiles($uploadedImages);

        jsonResponse(
            false,
            "Invalid image file.",
            null,
            422
        );
    }

    if ($file["size"] > $maxFileSize) {

        removeUploadedFiles($uploadedImages);

        jsonResponse(
            false,
            "Each image must not exceed 5 MB.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MIME Check
    |--------------------------------------------------------------------------
    */

    $finfo = new finfo(FILEINFO_MIME_TYPE);

    $mimeType = $finfo->file(
        $file["tmp_name"]
    );

    if (!isset($allowedMimeTypes[$mimeType])) {

        removeUploadedFiles($uploadedImages);

        jsonResponse(
            false,
            "Only JPG, PNG and WEBP images are allowed.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Real Image Check
    |--------------------------------------------------------------------------
    */

    $imageInfo = @getimagesize(
        $file["tmp_name"]
    );

    if ($imageInfo === false) {

        removeUploadedFiles($uploadedImages);

        jsonResponse(
            false,
            "Invalid image file.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Generate Safe Filename
    |--------------------------------------------------------------------------
    */

    $extension =
        $allowedMimeTypes[$mimeType];

    $filename =
        "product_" .
        bin2hex(random_bytes(16)) .
        "." .
        $extension;

    $destination =
        $uploadDir .
        DIRECTORY_SEPARATOR .
        $filename;

    /*
    |--------------------------------------------------------------------------
    | Move File
    |--------------------------------------------------------------------------
    */

    if (
        !move_uploaded_file(
            $file["tmp_name"],
            $destination
        )
    ) {

        removeUploadedFiles($uploadedImages);

        jsonResponse(
            false,
            "Unable to save product image.",
            null,
            500
        );
    }

    $uploadedImages[] = [
        "path" => $destination,
        "url" =>
            $uploadUrl . "/" . $filename
    ];
}

/*
|--------------------------------------------------------------------------
| Main Image
|--------------------------------------------------------------------------
*/

$imageUrl = null;

if (!empty($uploadedImages)) {
    $imageUrl =
        $uploadedImages[0]["url"];
}

/*
|--------------------------------------------------------------------------
| Database Transaction
|--------------------------------------------------------------------------
*/

try {

    $pdo->beginTransaction();

    /*
    |--------------------------------------------------------------------------
    | Category
    |--------------------------------------------------------------------------
    */

    $categoryStmt = $pdo->prepare("
        SELECT id, name, slug
        FROM categories
        WHERE id = ?
          AND status = 'active'
        LIMIT 1
        FOR UPDATE
    ");

    $categoryStmt->execute([
        $categoryId
    ]);

    $category =
        $categoryStmt->fetch();

    if (!$category) {

        throw new RuntimeException(
            "Selected category does not exist or is inactive."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SKU
    |--------------------------------------------------------------------------
    */

    $skuStmt = $pdo->prepare("
        SELECT id
        FROM products
        WHERE sku = ?
        LIMIT 1
        FOR UPDATE
    ");

    $skuStmt->execute([
        $sku
    ]);

    if ($skuStmt->fetch()) {

        throw new RuntimeException(
            "SKU already exists."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Unique Slug
    |--------------------------------------------------------------------------
    */

    $baseSlug = $slug;

    $counter = 1;

    while (true) {

        $slugStmt = $pdo->prepare("
            SELECT id
            FROM products
            WHERE slug = ?
            LIMIT 1
        ");

        $slugStmt->execute([
            $slug
        ]);

        if (!$slugStmt->fetch()) {
            break;
        }

        $slug =
            $baseSlug .
            "-" .
            $counter;

        $counter++;

        if ($counter > 10000) {

            throw new RuntimeException(
                "Unable to generate unique product URL."
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Insert Product
    |--------------------------------------------------------------------------
    */

    $insertStmt = $pdo->prepare("
        INSERT INTO products (
            category_id,
            name,
            slug,
            sku,
            description,
            short_description,
            price,
            old_price,
            stock,
            low_stock_limit,
            image,
            featured,
            status
        )
        VALUES (
            :category_id,
            :name,
            :slug,
            :sku,
            :description,
            :short_description,
            :price,
            :old_price,
            :stock,
            :low_stock_limit,
            :image,
            :featured,
            :status
        )
    ");

    $insertStmt->execute([
        ":category_id" =>
            $categoryId,

        ":name" =>
            $name,

        ":slug" =>
            $slug,

        ":sku" =>
            $sku,

        ":description" =>
            $description !== ""
                ? $description
                : null,

        ":short_description" =>
            $shortDescription !== ""
                ? $shortDescription
                : null,

        ":price" =>
            $price,

        ":old_price" =>
            $oldPrice,

        ":stock" =>
            $stock,

        ":low_stock_limit" =>
            $lowStockLimit,

        ":image" =>
            $imageUrl,

        ":featured" =>
            $featured,

        ":status" =>
            $status
    ]);

    $productId =
        (int)$pdo->lastInsertId();

    /*
    |--------------------------------------------------------------------------
    | Insert Product Gallery Images
    |--------------------------------------------------------------------------
    */

    if (!empty($uploadedImages)) {

        $imageStmt = $pdo->prepare("
            INSERT INTO product_images (
                product_id,
                image,
                sort_order
            )
            VALUES (
                :product_id,
                :image,
                :sort_order
            )
        ");

        foreach (
            $uploadedImages
            as $index => $uploadedImage
        ) {

            $imageStmt->execute([
                ":product_id" =>
                    $productId,

                ":image" =>
                    $uploadedImage["url"],

                ":sort_order" =>
                    $index
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Opening Inventory
    |--------------------------------------------------------------------------
    */

    if ($stock > 0) {

        $inventoryStmt = $pdo->prepare("
            INSERT INTO inventory_transactions (
                product_id,
                type,
                quantity,
                reference_type,
                reference_id,
                note
            )
            VALUES (
                :product_id,
                'purchase',
                :quantity,
                'product_creation',
                :reference_id,
                :note
            )
        ");

        $inventoryStmt->execute([
            ":product_id" =>
                $productId,

            ":quantity" =>
                $stock,

            ":reference_id" =>
                $productId,

            ":note" =>
                "Opening stock added during product creation."
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Fetch Created Product
    |--------------------------------------------------------------------------
    */

    $productStmt = $pdo->prepare("
        SELECT
            p.id,
            p.category_id,
            p.name,
            p.slug,
            p.sku,
            p.short_description,
            p.description,
            p.price,
            p.old_price,
            p.stock,
            p.low_stock_limit,
            p.image,
            p.rating,
            p.review_count,
            p.status,
            p.featured,
            p.created_at,
            p.updated_at,
            c.name AS category_name,
            c.slug AS category_slug
        FROM products p
        INNER JOIN categories c
            ON c.id = p.category_id
        WHERE p.id = ?
        LIMIT 1
    ");

    $productStmt->execute([
        $productId
    ]);

    $product =
        $productStmt->fetch();

    if (!$product) {

        throw new RuntimeException(
            "Created product could not be loaded."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Fetch Gallery
    |--------------------------------------------------------------------------
    */

    $galleryStmt = $pdo->prepare("
        SELECT
            id,
            product_id,
            image,
            sort_order
        FROM product_images
        WHERE product_id = ?
        ORDER BY sort_order ASC, id ASC
    ");

    $galleryStmt->execute([
        $productId
    ]);

    $gallery =
        $galleryStmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Commit
    |--------------------------------------------------------------------------
    */

    $pdo->commit();

    /*
    |--------------------------------------------------------------------------
    | Format Response
    |--------------------------------------------------------------------------
    */

    $product["id"] =
        (int)$product["id"];

    $product["category_id"] =
        (int)$product["category_id"];

    $product["price"] =
        (float)$product["price"];

    $product["old_price"] =
        $product["old_price"] !== null
            ? (float)$product["old_price"]
            : null;

    $product["stock"] =
        (int)$product["stock"];

    $product["low_stock_limit"] =
        (int)$product["low_stock_limit"];

    $product["rating"] =
        $product["rating"] !== null
            ? (float)$product["rating"]
            : 0;

    $product["review_count"] =
        (int)$product["review_count"];

    $product["featured"] =
        (int)$product["featured"];

    /*
    |--------------------------------------------------------------------------
    | Format Gallery
    |--------------------------------------------------------------------------
    */

    foreach ($gallery as &$galleryImage) {

        $galleryImage["id"] =
            (int)$galleryImage["id"];

        $galleryImage["product_id"] =
            (int)$galleryImage["product_id"];

        $galleryImage["sort_order"] =
            (int)$galleryImage["sort_order"];
    }

    unset($galleryImage);

    $product["images"] =
        $gallery;

    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Product created successfully.",
        [
            "product" => $product
        ],
        201
    );

} catch (RuntimeException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    removeUploadedFiles(
        $uploadedImages
    );

    /*
    |--------------------------------------------------------------------------
    | Known Validation / Business Errors
    |--------------------------------------------------------------------------
    */

    $message = $e->getMessage();

    $statusCode = 422;

    if ($message === "SKU already exists.") {
        $statusCode = 409;
    }

    jsonResponse(
        false,
        $message,
        null,
        $statusCode
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    removeUploadedFiles(
        $uploadedImages
    );

    error_log(
        "AshrafBazar Product Create PDO Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to create product.",
        null,
        500
    );

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    removeUploadedFiles(
        $uploadedImages
    );

    error_log(
        "AshrafBazar Product Create Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to create product.",
        null,
        500
    );
}