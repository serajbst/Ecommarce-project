<?php
declare(strict_types=1);

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../helpers/Response.php";
require_once __DIR__ . "/../../middleware/auth.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: PUT, PATCH, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if (
    $_SERVER["REQUEST_METHOD"] !== "PUT" &&
    $_SERVER["REQUEST_METHOD"] !== "PATCH"
) {
    jsonResponse(false, "Method not allowed.", null, 405);
}

requireAuth();

$userId = (int) $authUser["id"];

$addressId = filter_input(
    INPUT_GET,
    "id",
    FILTER_VALIDATE_INT,
    [
        "options" => [
            "min_range" => 1
        ]
    ]
);

if (!$addressId) {
    jsonResponse(false, "Valid address id is required.", null, 422);
}

$input = json_decode(
    file_get_contents("php://input"),
    true
);

if (!is_array($input)) {
    jsonResponse(false, "Invalid JSON request.", null, 400);
}

/*
 * Check that address belongs to current user.
 */
try {

    $checkStmt = $pdo->prepare("
        SELECT id
        FROM addresses
        WHERE
            id = :id
            AND user_id = :user_id
        LIMIT 1
    ");

    $checkStmt->execute([
        ":id" => $addressId,
        ":user_id" => $userId
    ]);

    if (!$checkStmt->fetch()) {
        jsonResponse(false, "Address not found.", null, 404);
    }

    $fields = [];
    $params = [
        ":id" => $addressId,
        ":user_id" => $userId
    ];

    /*
     * Update only supplied fields.
     */
    if (array_key_exists("name", $input)) {
        $name = trim((string) $input["name"]);

        if ($name === "" || mb_strlen($name) > 100) {
            jsonResponse(false, "Invalid name.", null, 422);
        }

        $fields[] = "name = :name";
        $params[":name"] = $name;
    }

    if (array_key_exists("mobile", $input)) {
        $mobile = trim((string) $input["mobile"]);

        if (!preg_match('/^[6-9][0-9]{9}$/', $mobile)) {
            jsonResponse(
                false,
                "Enter a valid 10-digit mobile number.",
                null,
                422
            );
        }

        $fields[] = "mobile = :mobile";
        $params[":mobile"] = $mobile;
    }

    if (array_key_exists("address_line", $input)) {
        $addressLine = trim((string) $input["address_line"]);

        if (
            $addressLine === "" ||
            mb_strlen($addressLine) > 2000
        ) {
            jsonResponse(false, "Invalid address.", null, 422);
        }

        $fields[] = "address_line = :address_line";
        $params[":address_line"] = $addressLine;
    }

    if (array_key_exists("city", $input)) {
        $city = trim((string) $input["city"]);

        if ($city === "" || mb_strlen($city) > 100) {
            jsonResponse(false, "Invalid city.", null, 422);
        }

        $fields[] = "city = :city";
        $params[":city"] = $city;
    }

    if (array_key_exists("state", $input)) {
        $state = trim((string) $input["state"]);

        if ($state === "" || mb_strlen($state) > 100) {
            jsonResponse(false, "Invalid state.", null, 422);
        }

        $fields[] = "state = :state";
        $params[":state"] = $state;
    }

    if (array_key_exists("pincode", $input)) {
        $pincode = trim((string) $input["pincode"]);

        if (!preg_match('/^[0-9]{6}$/', $pincode)) {
            jsonResponse(
                false,
                "Enter a valid 6-digit pincode.",
                null,
                422
            );
        }

        $fields[] = "pincode = :pincode";
        $params[":pincode"] = $pincode;
    }

    if (array_key_exists("address_type", $input)) {
        $addressType = trim((string) $input["address_type"]);

        if (
            !in_array(
                $addressType,
                ["home", "work", "other"],
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

        $fields[] = "address_type = :address_type";
        $params[":address_type"] = $addressType;
    }

    $isDefaultProvided = array_key_exists(
        "is_default",
        $input
    );

    $isDefault = false;

    if ($isDefaultProvided) {
        $isDefault = filter_var(
            $input["is_default"],
            FILTER_VALIDATE_BOOLEAN,
            FILTER_NULL_ON_FAILURE
        );

        if ($isDefault === null) {
            jsonResponse(
                false,
                "Invalid is_default value.",
                null,
                422
            );
        }

        $isDefault = (bool) $isDefault;
    }

    if (empty($fields) && !$isDefaultProvided) {
        jsonResponse(
            false,
            "No fields to update.",
            null,
            422
        );
    }

    $pdo->beginTransaction();

    /*
     * If making this address default,
     * remove default from all other addresses.
     */
    if ($isDefaultProvided && $isDefault === true) {

        $resetStmt = $pdo->prepare("
            UPDATE addresses
            SET is_default = 0
            WHERE
                user_id = :user_id
                AND id != :id
        ");

        $resetStmt->execute([
            ":user_id" => $userId,
            ":id" => $addressId
        ]);

        $fields[] = "is_default = 1";

    } elseif ($isDefaultProvided && $isDefault === false) {

        /*
         * Do not allow a user to remove the default flag
         * if this would leave the account without a default
         * address. Another address can be made default later.
         */
        $currentStmt = $pdo->prepare("
            SELECT is_default
            FROM addresses
            WHERE
                id = :id
                AND user_id = :user_id
            LIMIT 1
        ");

        $currentStmt->execute([
            ":id" => $addressId,
            ":user_id" => $userId
        ]);

        $current = $currentStmt->fetch();

        if (
            $current &&
            (int) $current["is_default"] === 1
        ) {
            $pdo->rollBack();

            jsonResponse(
                false,
                "Make another address default before removing this default address.",
                null,
                422
            );
        }

        $fields[] = "is_default = 0";
    }

    if (!empty($fields)) {

        $sql = "
            UPDATE addresses
            SET " . implode(", ", $fields) . "
            WHERE
                id = :id
                AND user_id = :user_id
        ";

        $updateStmt = $pdo->prepare($sql);
        $updateStmt->execute($params);
    }

    /*
     * Fetch updated address.
     */
    $addressStmt = $pdo->prepare("
        SELECT
            id,
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
        WHERE
            id = :id
            AND user_id = :user_id
        LIMIT 1
    ");

    $addressStmt->execute([
        ":id" => $addressId,
        ":user_id" => $userId
    ]);

    $address = $addressStmt->fetch();

    if (!$address) {
        $pdo->rollBack();

        jsonResponse(
            false,
            "Address could not be fetched after update.",
            null,
            500
        );
    }

    $pdo->commit();

    $address["id"] = (int) $address["id"];
    $address["is_default"] = (int) $address["is_default"];

    jsonResponse(
        true,
        "Address updated successfully.",
        $address
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "Address update error: " .
        $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to update address right now.",
        null,
        500
    );
}