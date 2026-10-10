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
    header("Access-Control-Allow-Origin: {$origin}");
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

try {

    /*
    |--------------------------------------------------------------------------
    | Product ID
    |--------------------------------------------------------------------------
    */

    $productId = filter_var(
        $_POST["id"] ?? null,
        FILTER_VALIDATE_INT,
        [
            "options" => [
                "min_range" => 1
            ]
        ]
    );

    if (!$productId) {
        jsonResponse(
            false,
            "Valid product ID is required.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Input
    |--------------------------------------------------------------------------
    */

    $name = trim(
        (string)($_POST["name"] ?? "")
    );

    $categoryId = filter_var(
        $_POST["category_id"] ?? null,
        FILTER_VALIDATE_INT,
        [
            "options" => [
                "min_range" => 1
            ]
        ]
    );

    $priceRaw = trim(
        (string)($_POST["price"] ?? "")
    );

    $oldPriceRaw = trim(
        (string)($_POST["old_price"] ?? "")
    );

    $sku = trim(
        (string)($_POST["sku"] ?? "")
    );

    $stockRaw = trim(
        (string)($_POST["stock"] ?? "")
    );

    $description = trim(
        (string)($_POST["description"] ?? "")
    );

    $shortDescription = trim(
        (string)($_POST["short_description"] ?? "")
    );

    $status = trim(
        (string)($_POST["status"] ?? "active")
    );

    $featuredRaw = trim(
        (string)($_POST["featured"] ?? "0")
    );

    /*
    |--------------------------------------------------------------------------
    | Validation
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

    if (mb_strlen($name) > 150) {
        jsonResponse(
            false,
            "Product name is too long.",
            null,
            422
        );
    }

    if (!$categoryId) {
        jsonResponse(
            false,
            "Valid category is required.",
            null,
            422
        );
    }

    if (
        $priceRaw === "" ||
        !is_numeric($priceRaw)
    ) {
        jsonResponse(
            false,
            "Valid price is required.",
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
        filter_var(
            $stockRaw,
            FILTER_VALIDATE_INT
        ) === false
    ) {
        jsonResponse(
            false,
            "Valid stock quantity is required.",
            null,
            422
        );
    }

    $stock = (int)$stockRaw;

    if ($stock < 0) {
        jsonResponse(
            false,
            "Stock cannot be negative.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    $allowedStatuses = [
        "active",
        "inactive",
        "out_of_stock"
    ];

    if (!in_array(
        $status,
        $allowedStatuses,
        true
    )) {
        jsonResponse(
            false,
            "Invalid product status.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Featured
    |--------------------------------------------------------------------------
    */

    $featured = (
        $featuredRaw === "1"
    ) ? 1 : 0;

    /*
    |--------------------------------------------------------------------------
    | Transaction
    |--------------------------------------------------------------------------
    */

    $pdo->beginTransaction();

    /*
    |--------------------------------------------------------------------------
    | Get Existing Product
    |--------------------------------------------------------------------------
    */

    $productStmt = $pdo->prepare("
        SELECT
            id,
            category_id,
            name,
            sku,
            price,
            old_price,
            stock,
            image,
            status,
            featured
        FROM products
        WHERE id = :id
        LIMIT 1
        FOR UPDATE
    ");

    $productStmt->execute([
        ":id" => $productId
    ]);

    $existingProduct =
        $productStmt->fetch();

    if (!$existingProduct) {

        $pdo->rollBack();

        jsonResponse(
            false,
            "Product not found.",
            null,
            404
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Category
    |--------------------------------------------------------------------------
    */

    $categoryStmt = $pdo->prepare("
        SELECT id, status
        FROM categories
        WHERE id = :id
        LIMIT 1
    ");

    $categoryStmt->execute([
        ":id" => $categoryId
    ]);

    $category =
        $categoryStmt->fetch();

    if (!$category) {

        $pdo->rollBack();

        jsonResponse(
            false,
            "Category not found.",
            null,
            404
        );
    }

    if ($category["status"] !== "active") {

        $pdo->rollBack();

        jsonResponse(
            false,
            "Selected category is inactive.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SKU Duplicate Check
    |--------------------------------------------------------------------------
    */

    $skuStmt = $pdo->prepare("
        SELECT id
        FROM products
        WHERE sku = :sku
        AND id != :id
        LIMIT 1
    ");

    $skuStmt->execute([
        ":sku" => $sku,
        ":id" => $productId
    ]);

    if ($skuStmt->fetch()) {

        $pdo->rollBack();

        jsonResponse(
            false,
            "SKU already exists.",
            null,
            409
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Slug
    |--------------------------------------------------------------------------
    */

    $slug = strtolower(
        trim(
            preg_replace(
                "/[^a-zA-Z0-9]+/",
                "-",
                $name
            ),
            "-"
        )
    );

    if ($slug === "") {
        $slug = "product-" . $productId;
    }

    $slugStmt = $pdo->prepare("
        SELECT id
        FROM products
        WHERE slug = :slug
        AND id != :id
        LIMIT 1
    ");

    $slugStmt->execute([
        ":slug" => $slug,
        ":id" => $productId
    ]);

    if ($slugStmt->fetch()) {
        $slug .= "-" . $productId;
    }

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT:
    | Keep Existing Image By Default
    |--------------------------------------------------------------------------
    */

    $oldImage =
        $existingProduct["image"];

    $imagePath = $oldImage;

    $newImageUploaded = false;

    $newImageFullPath = null;

    /*
    |--------------------------------------------------------------------------
    | New Image Upload
    |--------------------------------------------------------------------------
    */

    if (
        isset($_FILES["image"]) &&
        is_array($_FILES["image"]) &&
        $_FILES["image"]["error"] !== UPLOAD_ERR_NO_FILE
    ) {

        $file = $_FILES["image"];

        /*
        | Upload Error
        */

        if (
            $file["error"] !==
            UPLOAD_ERR_OK
        ) {

            $pdo->rollBack();

            jsonResponse(
                false,
                "Image upload failed.",
                null,
                422
            );
        }

        /*
        | Size
        */

        if (
            (int)$file["size"] >
            5 * 1024 * 1024
        ) {

            $pdo->rollBack();

            jsonResponse(
                false,
                "Image size must not exceed 5MB.",
                null,
                422
            );
        }

        /*
        | MIME
        */

        $finfo =
            new finfo(FILEINFO_MIME_TYPE);

        $mimeType =
            $finfo->file(
                $file["tmp_name"]
            );

        $allowedMimeTypes = [
            "image/jpeg" => "jpg",
            "image/png"  => "png",
            "image/webp" => "webp"
        ];

        if (
            !isset(
                $allowedMimeTypes[$mimeType]
            )
        ) {

            $pdo->rollBack();

            jsonResponse(
                false,
                "Only JPG, PNG and WEBP images are allowed.",
                null,
                422
            );
        }

        /*
        | Verify actual image
        */

        if (
            @getimagesize(
                $file["tmp_name"]
            ) === false
        ) {

            $pdo->rollBack();

            jsonResponse(
                false,
                "Invalid image file.",
                null,
                422
            );
        }

        /*
        | Upload Directory
        */

        $uploadDirectory =
            __DIR__ .
            "/../../uploads/products";

        if (!is_dir(
            $uploadDirectory
        )) {

            if (!mkdir(
                $uploadDirectory,
                0755,
                true
            )) {

                $pdo->rollBack();

                jsonResponse(
                    false,
                    "Unable to create upload directory.",
                    null,
                    500
                );
            }
        }

        /*
        | Random Filename
        */

        try {

            $randomName =
                bin2hex(
                    random_bytes(16)
                );

        } catch (Throwable $e) {

            $pdo->rollBack();

            error_log(
                "Image filename error: " .
                $e->getMessage()
            );

            jsonResponse(
                false,
                "Unable to process image.",
                null,
                500
            );
        }

        $extension =
            $allowedMimeTypes[
                $mimeType
            ];

        $fileName =
            $randomName .
            "." .
            $extension;

        $newImageFullPath =
            $uploadDirectory .
            DIRECTORY_SEPARATOR .
            $fileName;

        /*
        | Move New Image
        */

        if (!move_uploaded_file(
            $file["tmp_name"],
            $newImageFullPath
        )) {

            $pdo->rollBack();

            jsonResponse(
                false,
                "Unable to save image.",
                null,
                500
            );
        }

        /*
        |--------------------------------------------------------------------------
        | DB stores relative backend path
        |--------------------------------------------------------------------------
        */

        $imagePath =
            "/uploads/products/" .
            $fileName;

        $newImageUploaded = true;
    }

    /*
    |--------------------------------------------------------------------------
    | Inventory
    |--------------------------------------------------------------------------
    */

    $oldStock =
        (int)$existingProduct["stock"];

    $stockDifference =
        $stock - $oldStock;

    /*
    |--------------------------------------------------------------------------
    | Update Product
    |--------------------------------------------------------------------------
    */

    $updateStmt = $pdo->prepare("
        UPDATE products
        SET
            category_id = :category_id,
            name = :name,
            slug = :slug,
            sku = :sku,
            description = :description,
            short_description = :short_description,
            price = :price,
            old_price = :old_price,
            stock = :stock,
            image = :image,
            status = :status,
            featured = :featured,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
    ");

    $updateStmt->execute([
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

        ":image" =>
            $imagePath,

        ":status" =>
            $status,

        ":featured" =>
            $featured,

        ":id" =>
            $productId
    ]);

    /*
    |--------------------------------------------------------------------------
    | Inventory Transaction
    |--------------------------------------------------------------------------
    */

    if ($stockDifference !== 0) {

        $inventoryType =
            $stockDifference > 0
                ? "in"
                : "out";

        $inventoryStmt =
            $pdo->prepare("
                INSERT INTO inventory_transactions
                (
                    product_id,
                    type,
                    quantity,
                    reference_type,
                    reference_id,
                    note
                )
                VALUES
                (
                    :product_id,
                    :type,
                    :quantity,
                    :reference_type,
                    :reference_id,
                    :note
                )
            ");

        $inventoryStmt->execute([
            ":product_id" =>
                $productId,

            ":type" =>
                $inventoryType,

            ":quantity" =>
                abs($stockDifference),

            ":reference_type" =>
                "product_update",

            ":reference_id" =>
                $productId,

            ":note" =>
                "Stock adjusted during product update."
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Commit
    |--------------------------------------------------------------------------
    */

    $pdo->commit();

    /*
    |--------------------------------------------------------------------------
    | Delete Old Image ONLY AFTER SUCCESS
    |--------------------------------------------------------------------------
    */

    if (
        $newImageUploaded &&
        !empty($oldImage)
    ) {

        /*
        | Old image can be:
        | /uploads/products/file.jpg
        */

        $oldImageRelative =
            ltrim(
                (string)$oldImage,
                "/"
            );

        $oldImageFullPath =
            __DIR__ .
            "/../../" .
            $oldImageRelative;

        if (
            is_file(
                $oldImageFullPath
            )
        ) {
            @unlink(
                $oldImageFullPath
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Return Updated Product
    |--------------------------------------------------------------------------
    */

    $resultStmt = $pdo->prepare("
        SELECT
            id,
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
            rating,
            review_count,
            status,
            featured,
            created_at,
            updated_at
        FROM products
        WHERE id = :id
        LIMIT 1
    ");

    $resultStmt->execute([
        ":id" => $productId
    ]);

    $updatedProduct =
        $resultStmt->fetch();

    if ($updatedProduct) {

        $updatedProduct["id"] =
            (int)$updatedProduct["id"];

        $updatedProduct["category_id"] =
            (int)$updatedProduct["category_id"];

        $updatedProduct["price"] =
            (float)$updatedProduct["price"];

        $updatedProduct["old_price"] =
            $updatedProduct["old_price"] !== null
                ? (float)$updatedProduct["old_price"]
                : null;

        $updatedProduct["stock"] =
            (int)$updatedProduct["stock"];

        $updatedProduct["low_stock_limit"] =
            (int)$updatedProduct["low_stock_limit"];

        $updatedProduct["rating"] =
            $updatedProduct["rating"] !== null
                ? (float)$updatedProduct["rating"]
                : 0;

        $updatedProduct["review_count"] =
            (int)$updatedProduct["review_count"];

        $updatedProduct["featured"] =
            (int)$updatedProduct["featured"];
    }

    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Product updated successfully.",
        [
            "product" =>
                $updatedProduct
        ]
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    /*
    | If new image was moved but DB failed,
    | remove the new orphan image.
    */

    if (
        isset($newImageFullPath) &&
        $newImageFullPath &&
        is_file($newImageFullPath)
    ) {
        @unlink($newImageFullPath);
    }

    error_log(
        "AshrafBazar Product Update PDO Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to update product.",
        null,
        500
    );

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if (
        isset($newImageFullPath) &&
        $newImageFullPath &&
        is_file($newImageFullPath)
    ) {
        @unlink($newImageFullPath);
    }

    error_log(
        "AshrafBazar Product Update Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to update product.",
        null,
        500
    );
}