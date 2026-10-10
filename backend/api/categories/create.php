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
    header(
        "Access-Control-Allow-Origin: " . $origin
    );
}

header("Vary: Origin");

header(
    "Access-Control-Allow-Methods: POST, OPTIONS"
);

header(
    "Access-Control-Allow-Headers: Content-Type, Authorization"
);

header(
    "Access-Control-Allow-Credentials: true"
);

header(
    "Content-Type: application/json; charset=UTF-8"
);

/*
|--------------------------------------------------------------------------
| OPTIONS / Preflight
|--------------------------------------------------------------------------
*/

if (
    ($_SERVER["REQUEST_METHOD"] ?? "") === "OPTIONS"
) {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Method
|--------------------------------------------------------------------------
*/

if (
    ($_SERVER["REQUEST_METHOD"] ?? "") !== "POST"
) {
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
    | Input
    |--------------------------------------------------------------------------
    */

    $name = trim(
        (string)($_POST["name"] ?? "")
    );

    $slug = trim(
        (string)($_POST["slug"] ?? "")
    );

    $description = trim(
        (string)($_POST["description"] ?? "")
    );

    $status = strtolower(
        trim(
            (string)(
                $_POST["status"] ?? "active"
            )
        )
    );

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    if ($name === "") {
        jsonResponse(
            false,
            "Category name is required.",
            null,
            422
        );
    }

    if (mb_strlen($name) > 100) {
        jsonResponse(
            false,
            "Category name must not exceed 100 characters.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Generate Slug If Empty
    |--------------------------------------------------------------------------
    */

    if ($slug === "") {

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
    }

    if ($slug === "") {
        jsonResponse(
            false,
            "Valid category slug is required.",
            null,
            422
        );
    }

    if (mb_strlen($slug) > 100) {
        jsonResponse(
            false,
            "Category slug must not exceed 100 characters.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Slug Format
    |--------------------------------------------------------------------------
    */

    if (
        !preg_match(
            "/^[a-z0-9]+(?:-[a-z0-9]+)*$/",
            $slug
        )
    ) {
        jsonResponse(
            false,
            "Invalid category slug.",
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
        "inactive"
    ];

    if (
        !in_array(
            $status,
            $allowedStatuses,
            true
        )
    ) {
        jsonResponse(
            false,
            "Invalid category status.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Description Length
    |--------------------------------------------------------------------------
    */

    if (mb_strlen($description) > 5000) {
        jsonResponse(
            false,
            "Description is too long.",
            null,
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Image Variables
    |--------------------------------------------------------------------------
    */

    $imagePath = null;
    $newImageFullPath = null;

    /*
    |--------------------------------------------------------------------------
    | Transaction
    |--------------------------------------------------------------------------
    */

    $pdo->beginTransaction();

    /*
    |--------------------------------------------------------------------------
    | Duplicate Name
    |--------------------------------------------------------------------------
    */

    $nameStmt = $pdo->prepare("
        SELECT id
        FROM categories
        WHERE LOWER(name) = LOWER(:name)
        LIMIT 1
    ");

    $nameStmt->execute([
        ":name" => $name
    ]);

    if ($nameStmt->fetch()) {

        $pdo->rollBack();

        jsonResponse(
            false,
            "Category with this name already exists.",
            null,
            409
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Duplicate Slug
    |--------------------------------------------------------------------------
    */

    $slugStmt = $pdo->prepare("
        SELECT id
        FROM categories
        WHERE slug = :slug
        LIMIT 1
    ");

    $slugStmt->execute([
        ":slug" => $slug
    ]);

    if ($slugStmt->fetch()) {

        $pdo->rollBack();

        jsonResponse(
            false,
            "Category slug already exists.",
            null,
            409
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Image Upload
    |--------------------------------------------------------------------------
    */

    if (
        isset($_FILES["image"]) &&
        is_array($_FILES["image"]) &&
        $_FILES["image"]["error"] !==
            UPLOAD_ERR_NO_FILE
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
                "Category image upload failed.",
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
                "Category image must not exceed 5MB.",
                null,
                422
            );
        }

        /*
        | MIME Type
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
        | Verify Real Image
        */

        if (
            @getimagesize(
                $file["tmp_name"]
            ) === false
        ) {

            $pdo->rollBack();

            jsonResponse(
                false,
                "Invalid category image.",
                null,
                422
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Upload Directory
        |--------------------------------------------------------------------------
        */

        $uploadDirectory =
            __DIR__ .
            "/../../uploads/categories";

        if (
            !is_dir(
                $uploadDirectory
            )
        ) {

            if (
                !mkdir(
                    $uploadDirectory,
                    0755,
                    true
                )
            ) {

                $pdo->rollBack();

                jsonResponse(
                    false,
                    "Unable to create category upload directory.",
                    null,
                    500
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Random Filename
        |--------------------------------------------------------------------------
        */

        try {

            $randomName =
                bin2hex(
                    random_bytes(16)
                );

        } catch (Throwable $e) {

            $pdo->rollBack();

            error_log(
                "Category image filename error: " .
                $e->getMessage()
            );

            jsonResponse(
                false,
                "Unable to process category image.",
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
        |--------------------------------------------------------------------------
        | Move Image
        |--------------------------------------------------------------------------
        */

        if (
            !move_uploaded_file(
                $file["tmp_name"],
                $newImageFullPath
            )
        ) {

            $pdo->rollBack();

            jsonResponse(
                false,
                "Unable to save category image.",
                null,
                500
            );
        }

        /*
        |--------------------------------------------------------------------------
        | DB Relative Path
        |--------------------------------------------------------------------------
        */

        $imagePath =
            "/uploads/categories/" .
            $fileName;
    }

    /*
    |--------------------------------------------------------------------------
    | Insert Category
    |--------------------------------------------------------------------------
    */

    $insertStmt = $pdo->prepare("
        INSERT INTO categories
        (
            name,
            slug,
            image,
            description,
            status,
            sort_order
        )
        VALUES
        (
            :name,
            :slug,
            :image,
            :description,
            :status,
            :sort_order
        )
    ");

    $insertStmt->execute([
        ":name" =>
            $name,

        ":slug" =>
            $slug,

        ":image" =>
            $imagePath,

        ":description" =>
            $description !== ""
                ? $description
                : null,

        ":status" =>
            $status,

        ":sort_order" =>
            0
    ]);

    /*
    |--------------------------------------------------------------------------
    | New Category ID
    |--------------------------------------------------------------------------
    */

    $categoryId =
        (int)$pdo->lastInsertId();

    /*
    |--------------------------------------------------------------------------
    | Commit
    |--------------------------------------------------------------------------
    */

    $pdo->commit();

    /*
    |--------------------------------------------------------------------------
    | Return Created Category
    |--------------------------------------------------------------------------
    */

    $categoryStmt = $pdo->prepare("
        SELECT
            id,
            name,
            slug,
            image,
            description,
            status,
            sort_order,
            created_at,
            updated_at
        FROM categories
        WHERE id = :id
        LIMIT 1
    ");

    $categoryStmt->execute([
        ":id" =>
            $categoryId
    ]);

    $category =
        $categoryStmt->fetch();

    if ($category) {
        $category["id"] =
            (int)$category["id"];

        $category["sort_order"] =
            (int)$category["sort_order"];
    }

    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Category created successfully.",
        [
            "category" =>
                $category
        ],
        201
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    /*
    | Cleanup uploaded image if DB failed
    */

    if (
        isset($newImageFullPath) &&
        $newImageFullPath &&
        is_file($newImageFullPath)
    ) {
        @unlink(
            $newImageFullPath
        );
    }

    error_log(
        "AshrafBazar Category Create PDO Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to create category.",
        null,
        500
    );

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    /*
    | Cleanup uploaded image if anything failed
    */

    if (
        isset($newImageFullPath) &&
        $newImageFullPath &&
        is_file($newImageFullPath)
    ) {
        @unlink(
            $newImageFullPath
        );
    }

    error_log(
        "AshrafBazar Category Create Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to create category.",
        null,
        500
    );
}