<?php

declare(strict_types=1);

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../config/Response.php";

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
    header("Access-Control-Allow-Origin: " . $allowedOrigin);
}

header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Only GET
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    jsonResponse(
        false,
        "Only GET method is allowed.",
        null,
        405
    );
}

/*
|--------------------------------------------------------------------------
| Query Parameters
|--------------------------------------------------------------------------
*/

$city = trim(
    (string)($_GET["city"] ?? "")
);

$pincode = trim(
    (string)($_GET["pincode"] ?? "")
);

if (strlen($city) > 100) {
    jsonResponse(
        false,
        "Invalid city.",
        null,
        422
    );
}

if (
    $pincode !== "" &&
    !preg_match("/^[0-9]{6}$/", $pincode)
) {
    jsonResponse(
        false,
        "Invalid pincode.",
        null,
        422
    );
}

try {

    /*
    |--------------------------------------------------------------------------
    | Find Specific Pincode
    |--------------------------------------------------------------------------
    */

    if ($pincode !== "") {

        $stmt = $pdo->prepare("
            SELECT
                id,
                area_name,
                city,
                state,
                pincode,
                delivery_charge,
                minimum_order,
                estimated_days
            FROM delivery_areas
            WHERE status = 'active'
              AND pincode = :pincode
            ORDER BY id ASC
            LIMIT 1
        ");

        $stmt->execute([
            ":pincode" => $pincode
        ]);

        $area = $stmt->fetch();

        if (!$area) {
            jsonResponse(
                true,
                "Delivery is not available for this pincode.",
                [
                    "available" => false,
                    "area" => null
                ],
                200
            );
        }

        $area["id"] = (int)$area["id"];
        $area["delivery_charge"] =
            (float)$area["delivery_charge"];
        $area["minimum_order"] =
            (float)$area["minimum_order"];

        jsonResponse(
            true,
            "Delivery area found.",
            [
                "available" => true,
                "area" => $area
            ],
            200
        );
    }

    /*
    |--------------------------------------------------------------------------
    | List Active Areas
    |--------------------------------------------------------------------------
    */

    $where = [
        "status = 'active'"
    ];

    $params = [];

    if ($city !== "") {

        $where[] = "LOWER(city) = LOWER(:city)";

        $params[":city"] = $city;
    }

    $whereSql = implode(
        " AND ",
        $where
    );

    $stmt = $pdo->prepare("
        SELECT
            id,
            area_name,
            city,
            state,
            pincode,
            delivery_charge,
            minimum_order,
            estimated_days
        FROM delivery_areas
        WHERE {$whereSql}
        ORDER BY area_name ASC, id ASC
    ");

    $stmt->execute($params);

    $areas = $stmt->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Format Response
    |--------------------------------------------------------------------------
    */

    foreach ($areas as &$area) {

        $area["id"] = (int)$area["id"];

        $area["delivery_charge"] =
            (float)$area["delivery_charge"];

        $area["minimum_order"] =
            (float)$area["minimum_order"];
    }

    unset($area);

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Delivery areas fetched successfully.",
        [
            "areas" => $areas,
            "count" => count($areas)
        ],
        200
    );

} catch (PDOException $e) {

    error_log(
        "AshrafBazar Delivery Areas Index Error: "
        . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to fetch delivery areas.",
        null,
        500
    );
}