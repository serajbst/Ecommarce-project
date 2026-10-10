<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

$allowedOrigin = "http://localhost:5173";

if (
    isset($_SERVER["HTTP_ORIGIN"]) &&
    $_SERVER["HTTP_ORIGIN"] === $allowedOrigin
) {
    header(
        "Access-Control-Allow-Origin: " .
        $allowedOrigin
    );
}

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
| OPTIONS
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}


/*
|--------------------------------------------------------------------------
| Config
|--------------------------------------------------------------------------
*/

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../config/Response.php";
require_once __DIR__ . "/../../middleware/auth.php";


/*
|--------------------------------------------------------------------------
| Only POST
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
| Admin Authentication
|--------------------------------------------------------------------------
*/

requireAdminOnly();


/*
|--------------------------------------------------------------------------
| Category ID
|--------------------------------------------------------------------------
*/

$id = filter_var(
    $_POST["id"] ?? null,
    FILTER_VALIDATE_INT
);

if (
    $id === false ||
    $id === null ||
    $id <= 0
) {

    jsonResponse(
        false,
        "Valid category ID is required.",
        null,
        422
    );
}


/*
|--------------------------------------------------------------------------
| Category Name
|--------------------------------------------------------------------------
*/

$name = trim(
    (string)(
        $_POST["name"] ?? ""
    )
);

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
| Description
|--------------------------------------------------------------------------
*/

$description = trim(
    (string)(
        $_POST["description"] ?? ""
    )
);

if (mb_strlen($description) > 500) {

    jsonResponse(
        false,
        "Description must not exceed 500 characters.",
        null,
        422
    );
}


/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

$status = strtolower(
    trim(
        (string)(
            $_POST["status"] ?? "active"
        )
    )
);

if (
    !in_array(
        $status,
        [
            "active",
            "inactive"
        ],
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
| Generate Slug
|--------------------------------------------------------------------------
*/

$slug = strtolower($name);

$slug = preg_replace(
    "/[^a-z0-9]+/",
    "-",
    $slug
);

$slug = trim(
    (string)$slug,
    "-"
);

if ($slug === "") {

    jsonResponse(
        false,
        "Unable to generate category slug.",
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


/*
|--------------------------------------------------------------------------
| Create Directory If Missing
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| Database
|--------------------------------------------------------------------------
*/

$newImagePath = null;

$oldImagePath = null;

try {

    /*
    |--------------------------------------------------------------------------
    | Find Existing Category
    |--------------------------------------------------------------------------
    */

    $categoryStmt = $pdo->prepare("
        SELECT
            id,
            name,
            slug,
            image,
            icon,
            description,
            status,
            sort_order
        FROM categories
        WHERE id = ?
        LIMIT 1
    ");

    $categoryStmt->execute([
        $id
    ]);

    $existingCategory =
        $categoryStmt->fetch(
            PDO::FETCH_ASSOC
        );

    if (!$existingCategory) {

        jsonResponse(
            false,
            "Category not found.",
            null,
            404
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Duplicate Name
    |--------------------------------------------------------------------------
    */

    $nameStmt = $pdo->prepare("
        SELECT id
        FROM categories
        WHERE LOWER(name) = LOWER(?)
          AND id != ?
        LIMIT 1
    ");

    $nameStmt->execute([
        $name,
        $id
    ]);

    if ($nameStmt->fetch()) {

        jsonResponse(
            false,
            "Another category with this name already exists.",
            null,
            409
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
            FROM categories
            WHERE slug = ?
              AND id != ?
            LIMIT 1
        ");

        $slugStmt->execute([
            $slug,
            $id
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

            jsonResponse(
                false,
                "Unable to generate a unique category slug.",
                null,
                500
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | Existing Values
    |--------------------------------------------------------------------------
    */

    $image =
        $existingCategory["image"] ?? null;

    $icon =
        $existingCategory["icon"] ?? null;

    $sortOrder =
        (int)(
            $existingCategory["sort_order"] ?? 0
        );


    /*
    |--------------------------------------------------------------------------
    | Image Upload
    |--------------------------------------------------------------------------
    */

    $hasNewImage =
        isset($_FILES["image"]) &&
        is_array($_FILES["image"]) &&
        (
            (int)(
                $_FILES["image"]["error"]
                ?? UPLOAD_ERR_NO_FILE
            )
            !== UPLOAD_ERR_NO_FILE
        );


    if ($hasNewImage) {

        $file = $_FILES["image"];


        /*
        | Upload Error
        */

        if (
            !isset($file["error"]) ||
            (int)$file["error"] !== UPLOAD_ERR_OK
        ) {

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

        $maxFileSize =
            2 * 1024 * 1024;

        if (
            !isset($file["size"]) ||
            (int)$file["size"] <= 0
        ) {

            jsonResponse(
                false,
                "Invalid image file.",
                null,
                422
            );
        }

        if (
            (int)$file["size"] >
            $maxFileSize
        ) {

            jsonResponse(
                false,
                "Image size must be 2MB or less.",
                null,
                422
            );
        }


        /*
        | Temporary File
        */

        $tmpFile =
            $file["tmp_name"] ?? "";

        if (
            !is_string($tmpFile) ||
            $tmpFile === "" ||
            !is_uploaded_file($tmpFile)
        ) {

            jsonResponse(
                false,
                "Invalid uploaded image.",
                null,
                422
            );
        }


        /*
        | MIME Type
        */

        $finfo =
            new finfo(
                FILEINFO_MIME_TYPE
            );

        $mimeType =
            $finfo->file(
                $tmpFile
            );


        $allowedMimeTypes = [
            "image/jpeg" => "jpg",
            "image/png"  => "png",
            "image/webp" => "webp",
        ];


        if (
            !isset(
                $allowedMimeTypes[
                    $mimeType
                ]
            )
        ) {

            jsonResponse(
                false,
                "Only JPG, PNG and WebP images are allowed.",
                null,
                422
            );
        }


        /*
        | Validate Real Image
        */

        $imageInfo =
            @getimagesize(
                $tmpFile
            );

        if ($imageInfo === false) {

            jsonResponse(
                false,
                "Uploaded file is not a valid image.",
                null,
                422
            );
        }


        /*
        | Secure Random Filename
        */

        $extension =
            $allowedMimeTypes[
                $mimeType
            ];

        $filename =
            bin2hex(
                random_bytes(16)
            ) .
            "." .
            $extension;


        $destination =
            $uploadDirectory .
            DIRECTORY_SEPARATOR .
            $filename;


        /*
        | Move Uploaded File
        */

        if (
            !move_uploaded_file(
                $tmpFile,
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
        | DB path
        */

        $newImagePath =
            "uploads/categories/" .
            $filename;


        /*
        | Existing image for cleanup
        */

        $oldImage =
            trim(
                (string)(
                    $existingCategory["image"]
                    ?? ""
                )
            );

        if (
            $oldImage !== "" &&
            str_starts_with(
                $oldImage,
                "uploads/categories/"
            )
        ) {

            $oldImagePath =
                __DIR__ .
                "/../../" .
                ltrim(
                    $oldImage,
                    "/"
                );
        }

        $image =
            $newImagePath;
    }


    /*
    |--------------------------------------------------------------------------
    | Transaction
    |--------------------------------------------------------------------------
    */

    $pdo->beginTransaction();


    /*
    |--------------------------------------------------------------------------
    | Update Category
    |--------------------------------------------------------------------------
    */

    $updateStmt = $pdo->prepare("
        UPDATE categories
        SET
            name = :name,
            slug = :slug,
            description = :description,
            status = :status,
            image = :image,
            icon = :icon,
            sort_order = :sort_order,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
    ");


    $updateStmt->execute([
        ":name" =>
            $name,

        ":slug" =>
            $slug,

        ":description" =>
            $description !== ""
                ? $description
                : null,

        ":status" =>
            $status,

        ":image" =>
            $image,

        ":icon" =>
            $icon,

        ":sort_order" =>
            $sortOrder,

        ":id" =>
            $id
    ]);


    /*
    |--------------------------------------------------------------------------
    | Fetch Updated Category
    |--------------------------------------------------------------------------
    */

    $updatedStmt = $pdo->prepare("
        SELECT
            id,
            name,
            slug,
            image,
            icon,
            description,
            status,
            sort_order,
            created_at,
            updated_at
        FROM categories
        WHERE id = ?
        LIMIT 1
    ");

    $updatedStmt->execute([
        $id
    ]);

    $category =
        $updatedStmt->fetch(
            PDO::FETCH_ASSOC
        );


    if (!$category) {

        $pdo->rollBack();

        /*
        | Remove newly uploaded image
        */

        if (
            $newImagePath !== null &&
            is_file(
                $uploadDirectory .
                DIRECTORY_SEPARATOR .
                basename(
                    $newImagePath
                )
            )
        ) {

            @unlink(
                $uploadDirectory .
                DIRECTORY_SEPARATOR .
                basename(
                    $newImagePath
                )
            );
        }

        jsonResponse(
            false,
            "Category was updated but could not be loaded.",
            null,
            500
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Commit
    |--------------------------------------------------------------------------
    */

    $pdo->commit();


    /*
    |--------------------------------------------------------------------------
    | Delete Old Image
    | Only AFTER successful DB commit
    |--------------------------------------------------------------------------
    */

    if (
        $oldImagePath !== null &&
        is_file($oldImagePath)
    ) {

        @unlink(
            $oldImagePath
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Normalize Response
    |--------------------------------------------------------------------------
    */

    $category["id"] =
        (int)$category["id"];

    $category["sort_order"] =
        (int)$category["sort_order"];


    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Category updated successfully.",
        [
            "category" =>
                $category
        ],
        200
    );


} catch (PDOException $e) {

    if (
        $pdo->inTransaction()
    ) {
        $pdo->rollBack();
    }


    /*
    | Remove newly uploaded image
    | if DB update failed
    */

    if (
        $newImagePath !== null
    ) {

        $newImageFile =
            $uploadDirectory .
            DIRECTORY_SEPARATOR .
            basename(
                $newImagePath
            );

        if (
            is_file(
                $newImageFile
            )
        ) {

            @unlink(
                $newImageFile
            );
        }
    }


    error_log(
        "AshrafBazar Update Category DB Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to update category.",
        null,
        500
    );


} catch (Throwable $e) {

    if (
        $pdo->inTransaction()
    ) {
        $pdo->rollBack();
    }


    /*
    | Remove newly uploaded image
    */

    if (
        $newImagePath !== null
    ) {

        $newImageFile =
            $uploadDirectory .
            DIRECTORY_SEPARATOR .
            basename(
                $newImagePath
            );

        if (
            is_file(
                $newImageFile
            )
        ) {

            @unlink(
                $newImageFile
            );
        }
    }


    error_log(
        "AshrafBazar Update Category Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to update category.",
        null,
        500
    );
}