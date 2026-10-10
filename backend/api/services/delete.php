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
    "Access-Control-Allow-Methods: DELETE, OPTIONS"
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

if ($_SERVER["REQUEST_METHOD"] !== "DELETE") {
    jsonResponse(
        false,
        "Only DELETE method is allowed.",
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
| Service ID
|--------------------------------------------------------------------------
|
| Expected:
|
| DELETE /api/services/delete.php?id=123
|
*/

$id = filter_input(
    INPUT_GET,
    "id",
    FILTER_VALIDATE_INT,
    [
        "options" => [
            "min_range" => 1
        ]
    ]
);

if (
    $id === false ||
    $id === null
) {
    jsonResponse(
        false,
        "Valid service ID is required.",
        null,
        422
    );
}

$serviceId =
    (int) $id;

/*
|--------------------------------------------------------------------------
| Database
|--------------------------------------------------------------------------
*/

try {

    /*
    |--------------------------------------------------------------------------
    | Find Service
    |--------------------------------------------------------------------------
    */

    $findStmt =
        $pdo->prepare("
            SELECT
                id,
                name,
                image
            FROM services
            WHERE id = :id
            LIMIT 1
        ");

    $findStmt->execute([
        ":id" => $serviceId
    ]);

    $service =
        $findStmt->fetch(
            PDO::FETCH_ASSOC
        );

    if (!$service) {
        jsonResponse(
            false,
            "Service not found.",
            null,
            404
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Database Record
    |--------------------------------------------------------------------------
    */

    $pdo->beginTransaction();

    $deleteStmt =
        $pdo->prepare("
            DELETE FROM services
            WHERE id = :id
            LIMIT 1
        ");

    $deleteStmt->execute([
        ":id" => $serviceId
    ]);

    if ($deleteStmt->rowCount() !== 1) {

        $pdo->rollBack();

        jsonResponse(
            false,
            "Service could not be deleted.",
            null,
            500
        );
    }

    $pdo->commit();

    /*
    |--------------------------------------------------------------------------
    | Delete Image File
    |--------------------------------------------------------------------------
    |
    | Database deletion succeeded.
    | Image cleanup is performed afterwards.
    |
    */

    $imageDeleted = true;

    $imagePath =
        trim(
            (string) (
                $service["image"] ?? ""
            )
        );

    if ($imagePath !== "") {

        /*
        | Only allow deletion from our
        | services upload directory.
        */

        $servicesDirectory =
            realpath(
                __DIR__ .
                "/../../uploads/services"
            );

        if ($servicesDirectory !== false) {

            $relativeImagePath =
                ltrim(
                    $imagePath,
                    "/\\"
                );

            /*
            | Prevent path traversal.
            */

            if (
                str_starts_with(
                    $relativeImagePath,
                    "uploads/services/"
                )
            ) {

                $filename =
                    basename(
                        $relativeImagePath
                    );

                $imageFile =
                    $servicesDirectory .
                    DIRECTORY_SEPARATOR .
                    $filename;

                if (is_file($imageFile)) {

                    if (!@unlink($imageFile)) {

                        $imageDeleted = false;

                        error_log(
                            "Unable to delete service image: " .
                            $imageFile
                        );
                    }
                }
            }
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        $imageDeleted
            ? "Service deleted successfully."
            : "Service deleted successfully, but its image could not be removed.",
        [
            "id" =>
                $serviceId,

            "name" =>
                (string) $service["name"],

            "image_deleted" =>
                $imageDeleted
        ]
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "Service delete error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to delete service right now.",
        null,
        500
    );

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "Service delete unexpected error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to delete service right now.",
        null,
        500
    );
}