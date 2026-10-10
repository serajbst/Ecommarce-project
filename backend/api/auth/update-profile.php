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
| Authentication
|--------------------------------------------------------------------------
*/

if (
    !isset($authUser) ||
    !is_array($authUser) ||
    !isset($authUser["id"])
) {
    jsonResponse(
        false,
        "Authentication required.",
        null,
        401
    );
}

$userId = (int)$authUser["id"];

if ($userId <= 0) {
    jsonResponse(
        false,
        "Authentication failed.",
        null,
        401
    );
}

/*
|--------------------------------------------------------------------------
| Detect Request Type
|--------------------------------------------------------------------------
*/

$contentType = $_SERVER["CONTENT_TYPE"] ?? "";

$isMultipart = stripos(
    $contentType,
    "multipart/form-data"
) !== false;

/*
|--------------------------------------------------------------------------
| Read Input
|--------------------------------------------------------------------------
*/

if ($isMultipart) {

    $input = $_POST;

} else {

    $rawInput = file_get_contents("php://input");

    if (
        $rawInput === false ||
        strlen($rawInput) > 20000
    ) {
        jsonResponse(
            false,
            "Invalid request.",
            null,
            400
        );
    }

    $input = json_decode(
        $rawInput,
        true
    );

    if (
        !is_array($input) ||
        json_last_error() !== JSON_ERROR_NONE
    ) {
        jsonResponse(
            false,
            "Invalid JSON request.",
            null,
            400
        );
    }
}

/*
|--------------------------------------------------------------------------
| Detect Which Fields Were Submitted
|--------------------------------------------------------------------------
| array_key_exists() distinguishes "not sent" from "sent empty".
|--------------------------------------------------------------------------
*/

$hasName = array_key_exists("name", $input);
$hasMobile = array_key_exists("mobile", $input);
$hasEmail = array_key_exists("email", $input);

$hasAddress = array_key_exists("address", $input);
$hasCity = array_key_exists("city", $input);
$hasState = array_key_exists("state", $input);
$hasPincode = array_key_exists("pincode", $input);
$hasAddressType = array_key_exists("address_type", $input);

$hasAnyAddressField = (
    $hasAddress ||
    $hasCity ||
    $hasState ||
    $hasPincode ||
    $hasAddressType
);

$hasAnyUserField = (
    $hasName ||
    $hasMobile ||
    $hasEmail
);

$hasUploadedImage = (
    $isMultipart &&
    isset($_FILES["profile_image"]) &&
    is_array($_FILES["profile_image"]) &&
    (int)($_FILES["profile_image"]["error"] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE
);

/*
|--------------------------------------------------------------------------
| Early "no changes" short-circuit
|--------------------------------------------------------------------------
| If nothing at all was submitted and no file was uploaded,
| return success without touching the database.
|--------------------------------------------------------------------------
*/

if (
    !$hasAnyUserField &&
    !$hasAnyAddressField &&
    !$hasUploadedImage
) {
    jsonResponse(
        true,
        "No profile changes were provided.",
        [
            "user" => null,
            "address" => null
        ],
        200
    );
}

/*
|--------------------------------------------------------------------------
| Submitted User Values (validated below)
|--------------------------------------------------------------------------
*/

$name = null;
$mobile = null;
$email = null;

if ($hasName) {
    $name = trim((string)($input["name"] ?? ""));
}

if ($hasMobile) {
    $mobile = trim((string)($input["mobile"] ?? ""));
}

/*
|--------------------------------------------------------------------------
| Submitted Address Values (validated below)
|--------------------------------------------------------------------------
*/

$address = null;
$city = null;
$state = null;
$pincode = null;
$addressType = null;

if ($hasAddress) {
    $address = trim((string)($input["address"] ?? ""));
}

if ($hasCity) {
    $city = trim((string)($input["city"] ?? ""));
}

if ($hasState) {
    $state = trim((string)($input["state"] ?? ""));
}

if ($hasPincode) {
    $pincode = trim((string)($input["pincode"] ?? ""));
}

if ($hasAddressType) {
    $addressType = strtolower(
        trim((string)($input["address_type"] ?? ""))
    );
}

/*
|--------------------------------------------------------------------------
| Validation — only submitted fields
|--------------------------------------------------------------------------
*/

if ($hasName) {

    if ($name === "") {
        jsonResponse(
            false,
            "Full name is required.",
            null,
            422
        );
    }

    if (
        mb_strlen($name) < 2 ||
        mb_strlen($name) > 100
    ) {
        jsonResponse(
            false,
            "Full name must be between 2 and 100 characters.",
            null,
            422
        );
    }
}

if ($hasMobile) {

    if (
        !preg_match(
            '/^[6-9][0-9]{9}$/',
            $mobile
        )
    ) {
        jsonResponse(
            false,
            "Please enter a valid 10-digit mobile number.",
            null,
            422
        );
    }
}

$email = null;

if ($hasEmail) {

    $emailRaw = trim((string)($input["email"] ?? ""));

    if ($emailRaw === "") {
        // Allow clearing email — matches existing behavior.
        $email = null;
    } else {

        if (
            mb_strlen($emailRaw) > 150 ||
            !filter_var(
                $emailRaw,
                FILTER_VALIDATE_EMAIL
            )
        ) {
            jsonResponse(
                false,
                "Please enter a valid email address.",
                null,
                422
            );
        }

        $email = strtolower($emailRaw);
    }
}

if ($hasAddress) {

    if ($address === "") {
        jsonResponse(
            false,
            "Delivery address is required.",
            null,
            422
        );
    }

    if (mb_strlen($address) > 5000) {
        jsonResponse(
            false,
            "Address is too long.",
            null,
            422
        );
    }
}

if ($hasCity) {

    if ($city === "") {
        jsonResponse(
            false,
            "City is required.",
            null,
            422
        );
    }

    if (mb_strlen($city) > 100) {
        jsonResponse(
            false,
            "City is too long.",
            null,
            422
        );
    }
}

if ($hasState) {

    if ($state === "") {
        jsonResponse(
            false,
            "State is required.",
            null,
            422
        );
    }

    if (mb_strlen($state) > 100) {
        jsonResponse(
            false,
            "State is too long.",
            null,
            422
        );
    }
}

if ($hasPincode) {

    if ($pincode !== "") {

        if (
            !preg_match(
                '/^[0-9]{6}$/',
                $pincode
            )
        ) {
            jsonResponse(
                false,
                "Please enter a valid 6-digit PIN code.",
                null,
                422
            );
        }
    }
}

if ($hasAddressType) {

    $allowedAddressTypes = [
        "home",
        "work",
        "other"
    ];

    if (
        !in_array(
            $addressType,
            $allowedAddressTypes,
            true
        )
    ) {
        jsonResponse(
            false,
            "Invalid address type.",
            null,
            422
        );
    }
}

/*
|--------------------------------------------------------------------------
| Profile Image Upload
|--------------------------------------------------------------------------
| (Validation kept identical to the existing secure implementation.)
|--------------------------------------------------------------------------
*/

$newProfileImage = null;
$oldProfileImage = null;
$uploadedImagePath = null;

if ($isMultipart && isset($_FILES["profile_image"])) {

    $file = $_FILES["profile_image"];

    if (
        !isset($file["error"]) ||
        $file["error"] !== UPLOAD_ERR_OK
    ) {

        $uploadError = (int)($file["error"] ?? -1);

        $message = "Profile image upload failed.";

        if ($uploadError === UPLOAD_ERR_INI_SIZE) {
            $message = "Profile image is too large.";
        }

        if ($uploadError === UPLOAD_ERR_NO_FILE) {
            $message = "No profile image selected.";
        }

        jsonResponse(
            false,
            $message,
            null,
            422
        );
    }

    $maxFileSize = 5 * 1024 * 1024;

    if (
        !isset($file["size"]) ||
        (int)$file["size"] <= 0
    ) {
        jsonResponse(
            false,
            "Invalid profile image.",
            null,
            422
        );
    }

    if ((int)$file["size"] > $maxFileSize) {
        jsonResponse(
            false,
            "Profile image must not exceed 5 MB.",
            null,
            422
        );
    }

    $tmpName = (string)($file["tmp_name"] ?? "");

    if (
        $tmpName === "" ||
        !is_uploaded_file($tmpName)
    ) {
        jsonResponse(
            false,
            "Invalid uploaded file.",
            null,
            422
        );
    }

    $imageInfo = @getimagesize($tmpName);

    if ($imageInfo === false) {
        jsonResponse(
            false,
            "Uploaded file is not a valid image.",
            null,
            422
        );
    }

    $width = (int)($imageInfo[0] ?? 0);
    $height = (int)($imageInfo[1] ?? 0);

    if (
        $width <= 0 ||
        $height <= 0 ||
        $width > 4000 ||
        $height > 4000
    ) {
        jsonResponse(
            false,
            "Image dimensions are not supported.",
            null,
            422
        );
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);

    $mimeType = $finfo->file($tmpName);

    $allowedMimeTypes = [
        "image/jpeg" => "jpg",
        "image/png"  => "png",
        "image/webp" => "webp"
    ];

    if (
        !isset($allowedMimeTypes[$mimeType])
    ) {
        jsonResponse(
            false,
            "Only JPG, PNG and WEBP images are allowed.",
            null,
            422
        );
    }

    $extension = $allowedMimeTypes[$mimeType];

    try {
        $randomName = bin2hex(
            random_bytes(24)
        );
    } catch (Throwable $e) {
        jsonResponse(
            false,
            "Unable to process profile image.",
            null,
            500
        );
    }

    $newProfileImage =
        $randomName . "." . $extension;

    $uploadDirectory =
        __DIR__ . "/../../uploads/profile";

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
            "Profile image directory is not writable.",
            null,
            500
        );
    }

    $uploadedImagePath =
        $uploadDirectory .
        DIRECTORY_SEPARATOR .
        $newProfileImage;

    if (
        !move_uploaded_file(
            $tmpName,
            $uploadedImagePath
        )
    ) {
        jsonResponse(
            false,
            "Unable to save profile image.",
            null,
            500
        );
    }

    @chmod(
        $uploadedImagePath,
        0644
    );
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
    | Lock Current User
    |--------------------------------------------------------------------------
    */

    $userStmt = $pdo->prepare("
        SELECT
            id,
            name,
            email,
            mobile,
            profile_image,
            role,
            status
        FROM users
        WHERE id = :id
        LIMIT 1
        FOR UPDATE
    ");

    $userStmt->execute([
        ":id" => $userId
    ]);

    $user = $userStmt->fetch();

    if (!$user) {

        if (
            $uploadedImagePath !== null &&
            is_file($uploadedImagePath)
        ) {
            @unlink($uploadedImagePath);
        }

        $pdo->rollBack();

        jsonResponse(
            false,
            "User account not found.",
            null,
            404
        );
    }

    if ((string)$user["status"] !== "active") {

        if (
            $uploadedImagePath !== null &&
            is_file($uploadedImagePath)
        ) {
            @unlink($uploadedImagePath);
        }

        $pdo->rollBack();

        jsonResponse(
            false,
            "Your account is currently unavailable.",
            null,
            403
        );
    }

    $oldProfileImage =
        !empty($user["profile_image"])
            ? (string)$user["profile_image"]
            : null;

    /*
    |--------------------------------------------------------------------------
    | Effective values (baseline overlaid with submitted values)
    |--------------------------------------------------------------------------
    */

    $effectiveName = $hasName
        ? $name
        : (string)$user["name"];

    $effectiveMobile = $hasMobile
        ? $mobile
        : (string)$user["mobile"];

    /*
    |--------------------------------------------------------------------------
    | Mobile Uniqueness — only if submitted AND actually changed
    |--------------------------------------------------------------------------
    */

    if ($hasMobile && $mobile !== (string)$user["mobile"]) {

        $mobileStmt = $pdo->prepare("
            SELECT id
            FROM users
            WHERE mobile = :mobile
              AND id <> :id
            LIMIT 1
        ");

        $mobileStmt->execute([
            ":mobile" => $mobile,
            ":id" => $userId
        ]);

        if ($mobileStmt->fetch()) {

            if (
                $uploadedImagePath !== null &&
                is_file($uploadedImagePath)
            ) {
                @unlink($uploadedImagePath);
            }

            $pdo->rollBack();

            jsonResponse(
                false,
                "This mobile number is already registered with another account.",
                null,
                409
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Email Uniqueness — only if submitted AND actually changed
    |--------------------------------------------------------------------------
    */

    $currentEmail = $user["email"] !== null
        ? (string)$user["email"]
        : null;

    if ($hasEmail && $email !== $currentEmail) {

        if ($email !== null) {

            $emailStmt = $pdo->prepare("
                SELECT id
                FROM users
                WHERE email = :email
                  AND id <> :id
                LIMIT 1
            ");

            $emailStmt->execute([
                ":email" => $email,
                ":id" => $userId
            ]);

            if ($emailStmt->fetch()) {

                if (
                    $uploadedImagePath !== null &&
                    is_file($uploadedImagePath)
                ) {
                    @unlink($uploadedImagePath);
                }

                $pdo->rollBack();

                jsonResponse(
                    false,
                    "This email address is already registered with another account.",
                    null,
                    409
                );
            }
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Load Existing Address (baseline)
    |--------------------------------------------------------------------------
    | Only queried when address fields were submitted OR when the user's
    | name/mobile changed (to preserve the existing sync behavior).
    |--------------------------------------------------------------------------
    */

    $existingAddress = null;
    $addressId = null;

    $needsAddressLookup = (
        $hasAnyAddressField ||
        $hasName ||
        $hasMobile
    );

    if ($needsAddressLookup) {

        $addressStmt = $pdo->prepare("
            SELECT
                id,
                user_id,
                name,
                mobile,
                address_line,
                city,
                state,
                pincode,
                address_type,
                is_default
            FROM addresses
            WHERE user_id = :user_id
            ORDER BY
                is_default DESC,
                id ASC
            LIMIT 1
            FOR UPDATE
        ");

        $addressStmt->execute([
            ":user_id" => $userId
        ]);

        $existingAddress = $addressStmt->fetch() ?: null;

        if ($existingAddress) {
            $addressId = (int)$existingAddress["id"];
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Build Dynamic UPDATE for users
    |--------------------------------------------------------------------------
    */

    $userUpdates = [];
    $userParams = [":id" => $userId];

    if ($hasName && $name !== (string)$user["name"]) {
        $userUpdates[] = "name = :name";
        $userParams[":name"] = $name;
    }

    if ($hasMobile && $mobile !== (string)$user["mobile"]) {
        $userUpdates[] = "mobile = :mobile";
        $userParams[":mobile"] = $mobile;
    }

    if ($hasEmail && $email !== $currentEmail) {
        $userUpdates[] = "email = :email";
        $userParams[":email"] = $email;
    }

    if ($newProfileImage !== null) {
        $userUpdates[] = "profile_image = :profile_image";
        $userParams[":profile_image"] = $newProfileImage;
    }

    /*
    |--------------------------------------------------------------------------
    | Address update — ONLY if an address field was actually submitted,
    | OR if the user's name/mobile changed and an address already exists
    | (intentional sync behavior).
    |--------------------------------------------------------------------------
    */

    $syncAddressName = false;
    $syncAddressMobile = false;
    $addressModified = false;

    if ($existingAddress) {

        $syncAddressName = (
            $hasName &&
            $name !== (string)$existingAddress["name"]
        );

        $syncAddressMobile = (
            $hasMobile &&
            $mobile !== (string)$existingAddress["mobile"]
        );

        $addrUpdates = [];
        $addrParams = [
            ":id" => $addressId,
            ":user_id" => $userId
        ];

        if ($hasAddress && $address !== (string)$existingAddress["address_line"]) {
            $addrUpdates[] = "address_line = :address_line";
            $addrParams[":address_line"] = $address;
        }

        if ($hasCity && $city !== (string)$existingAddress["city"]) {
            $addrUpdates[] = "city = :city";
            $addrParams[":city"] = $city;
        }

        if ($hasState && $state !== (string)$existingAddress["state"]) {
            $addrUpdates[] = "state = :state";
            $addrParams[":state"] = $state;
        }

        if ($hasPincode && $pincode !== (string)$existingAddress["pincode"]) {
            $addrUpdates[] = "pincode = :pincode";
            $addrParams[":pincode"] = $pincode;
        }

        if ($hasAddressType && $addressType !== (string)$existingAddress["address_type"]) {
            $addrUpdates[] = "address_type = :address_type";
            $addrParams[":address_type"] = $addressType;
        }

        if ($syncAddressName) {
            $addrUpdates[] = "name = :addr_name";
            $addrParams[":addr_name"] = $name;
        }

        if ($syncAddressMobile) {
            $addrUpdates[] = "mobile = :addr_mobile";
            $addrParams[":addr_mobile"] = $mobile;
        }

        if (!empty($addrUpdates)) {

            $sql = "UPDATE addresses SET "
                . implode(", ", $addrUpdates)
                . " WHERE id = :id AND user_id = :user_id LIMIT 1";

            $updateAddress = $pdo->prepare($sql);
            $updateAddress->execute($addrParams);

            $addressModified = true;
        }

        /*
        |------------------------------------------------------------------
        | Clear default flag from OTHER addresses — ONLY when:
        |   1. An address field was actually submitted, AND
        |   2. The current address is (or becomes) default.
        |------------------------------------------------------------------
        */

        if ($hasAnyAddressField) {

            $clearDefaults = $pdo->prepare("
                UPDATE addresses
                SET is_default = 0
                WHERE user_id = :user_id
                  AND id <> :id
                  AND is_default = 1
            ");

            $clearDefaults->execute([
                ":user_id" => $userId,
                ":id" => $addressId
            ]);
        }

    } else if ($hasAnyAddressField) {

        /*
        |--------------------------------------------------------------------------
        | No address exists but address fields were submitted.
        |--------------------------------------------------------------------------
        | A brand-new address needs a complete set.
        |--------------------------------------------------------------------------
        */

        $newAddressLine = $hasAddress ? $address : null;
        $newCity = $hasCity ? $city : null;
        $newState = $hasState ? $state : null;
        $newPincode = $hasPincode ? $pincode : null;
        $newAddressType = $hasAddressType ? $addressType : "home";

        if (
            $newAddressLine === null ||
            $newAddressLine === "" ||
            $newCity === null ||
            $newCity === "" ||
            $newState === null ||
            $newState === "" ||
            $newPincode === null ||
            $newPincode === ""
        ) {
            if (
                $uploadedImagePath !== null &&
                is_file($uploadedImagePath)
            ) {
                @unlink($uploadedImagePath);
            }

            $pdo->rollBack();

            jsonResponse(
                false,
                "A complete address is required to create your first address. Please provide address, city, state and pincode.",
                null,
                422
            );
        }

        $insertAddress = $pdo->prepare("
            INSERT INTO addresses (
                user_id,
                name,
                mobile,
                address_line,
                city,
                state,
                pincode,
                address_type,
                is_default
            )
            VALUES (
                :user_id,
                :name,
                :mobile,
                :address_line,
                :city,
                :state,
                :pincode,
                :address_type,
                1
            )
        ");

        $insertAddress->execute([
            ":user_id" => $userId,
            ":name" => $effectiveName,
            ":mobile" => $effectiveMobile,
            ":address_line" => $newAddressLine,
            ":city" => $newCity,
            ":state" => $newState,
            ":pincode" => $newPincode,
            ":address_type" => $newAddressType
        ]);

        $addressId = (int)$pdo->lastInsertId();
        $addressModified = true;
    }

    /*
    |--------------------------------------------------------------------------
    | Apply user UPDATE (if any)
    |--------------------------------------------------------------------------
    */

    if (!empty($userUpdates)) {

        $sql = "UPDATE users SET "
            . implode(", ", $userUpdates)
            . " WHERE id = :id LIMIT 1";

        $updateUser = $pdo->prepare($sql);
        $updateUser->execute($userParams);
    }

    /*
    |--------------------------------------------------------------------------
    | Fetch Final User
    |--------------------------------------------------------------------------
    */

    $finalUserStmt = $pdo->prepare("
        SELECT
            id,
            name,
            email,
            mobile,
            profile_image,
            role,
            status,
            created_at,
            updated_at
        FROM users
        WHERE id = :id
        LIMIT 1
    ");

    $finalUserStmt->execute([
        ":id" => $userId
    ]);

    $finalUser = $finalUserStmt->fetch();

    if (!$finalUser) {
        throw new RuntimeException(
            "Updated user could not be loaded."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Fetch Final Address (may be null)
    |--------------------------------------------------------------------------
    */

    $finalAddress = null;

    if ($addressId !== null) {

        $finalAddressStmt = $pdo->prepare("
            SELECT
                id,
                user_id,
                name,
                mobile,
                address_line,
                city,
                state,
                pincode,
                address_type,
                is_default,
                created_at,
                updated_at
            FROM addresses
            WHERE id = :id
              AND user_id = :user_id
            LIMIT 1
        ");

        $finalAddressStmt->execute([
            ":id" => $addressId,
            ":user_id" => $userId
        ]);

        $finalAddress = $finalAddressStmt->fetch() ?: null;
    }

    /*
    |--------------------------------------------------------------------------
    | Profile Image URL
    |--------------------------------------------------------------------------
    */

    $profileImageUrl = null;

    if (!empty($finalUser["profile_image"])) {

        $profileImageUrl =
            rtrim(UPLOAD_URL, "/") .
            "/profile/" .
            ltrim(
                (string)$finalUser["profile_image"],
                "/"
            );
    }

    $finalUser["id"] =
        (int)$finalUser["id"];

    $finalUser["profile_image_url"] =
        $profileImageUrl;

    if ($finalAddress !== null) {

        $finalAddress["id"] =
            (int)$finalAddress["id"];

        $finalAddress["user_id"] =
            (int)$finalAddress["user_id"];

        $finalAddress["is_default"] =
            (int)$finalAddress["is_default"];
    }

    /*
    |--------------------------------------------------------------------------
    | Commit
    |--------------------------------------------------------------------------
    */

    $pdo->commit();

    /*
    |--------------------------------------------------------------------------
    | Delete Old Profile Image (only after successful commit)
    |--------------------------------------------------------------------------
    */

    if (
        $newProfileImage !== null &&
        $oldProfileImage !== null &&
        $oldProfileImage !== $newProfileImage
    ) {

        $oldFileName = basename($oldProfileImage);

        $oldFilePath =
            __DIR__ .
            "/../../uploads/profile/" .
            $oldFileName;

        if (
            is_file($oldFilePath) &&
            is_writable($oldFilePath)
        ) {
            @unlink($oldFilePath);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Profile updated successfully.",
        [
            "user" => $finalUser,
            "address" => $finalAddress
        ],
        200
    );

} catch (PDOException $e) {

    if (
        $uploadedImagePath !== null &&
        is_file($uploadedImagePath)
    ) {
        @unlink($uploadedImagePath);
    }

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "AshrafBazar Update Profile DB Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to update profile.",
        null,
        500
    );

} catch (Throwable $e) {

    if (
        $uploadedImagePath !== null &&
        is_file($uploadedImagePath)
    ) {
        @unlink($uploadedImagePath);
    }

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "AshrafBazar Update Profile Error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to update profile.",
        null,
        500
    );
}