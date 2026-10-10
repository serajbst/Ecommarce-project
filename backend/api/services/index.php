<?php

declare(strict_types=1);

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../config/config.php";
require_once __DIR__ . "/../../config/response.php";

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

$allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

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
| Only GET
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    jsonResponse(
        false,
        "Method not allowed.",
        null,
        405
    );
}

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| Customer:
|   No Authorization header
|   → Can only see active services
|
| Admin:
|   Authorization header present
|   → Authenticate + allow admin/staff
|   → Can see active/inactive according to filter
|
|--------------------------------------------------------------------------
*/

$authorizationHeader =
    $_SERVER["HTTP_AUTHORIZATION"] ??
    $_SERVER["REDIRECT_HTTP_AUTHORIZATION"] ??
    "";

$isAuthenticatedRequest = trim($authorizationHeader) !== "";

if ($isAuthenticatedRequest) {
    require_once __DIR__ . "/../../middleware/auth.php";

    // auth.php already authenticates the token.
    requireAdmin();
}

/*
|--------------------------------------------------------------------------
| Query Parameters
|--------------------------------------------------------------------------
*/

$search = trim((string) ($_GET["search"] ?? ""));
$status = trim((string) ($_GET["status"] ?? ""));

$page = max(1, (int) ($_GET["page"] ?? 1));

$limit = (int) ($_GET["limit"] ?? 20);

if ($limit < 1) {
    $limit = 20;
}

if ($limit > 100) {
    $limit = 100;
}

$offset = ($page - 1) * $limit;

/*
|--------------------------------------------------------------------------
| Customer Request
|--------------------------------------------------------------------------
|
| Without authentication:
| Always return ACTIVE services only.
|
*/

if (!$isAuthenticatedRequest) {
    $status = "active";
}

/*
|--------------------------------------------------------------------------
| Build WHERE
|--------------------------------------------------------------------------
*/

$where = [];
$params = [];

/*
|--------------------------------------------------------------------------
| Status Filter
|--------------------------------------------------------------------------
*/

if ($status === "active") {
    $where[] = "is_active = 1";
} elseif ($status === "inactive") {
    $where[] = "is_active = 0";
} elseif ($status === "all") {
    // Admin can request all services.
} else {
    /*
    |--------------------------------------------------------------------------
    | Default
    |--------------------------------------------------------------------------
    |
    | Customer is already forced to active above.
    | Admin default is also active for safer listing.
    |
    */
    $where[] = "is_active = 1";
}

/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
*/

if ($search !== "") {
    $where[] = "
        (
            name LIKE :search
            OR description LIKE :search
            OR phone LIKE :search
            OR whatsapp LIKE :search
        )
    ";

    $params[":search"] = "%" . $search . "%";
}

/*
|--------------------------------------------------------------------------
| WHERE SQL
|--------------------------------------------------------------------------
*/

$whereSql = "";

if (!empty($where)) {
    $whereSql = "WHERE " . implode(" AND ", $where);
}

try {

    /*
    |--------------------------------------------------------------------------
    | Total Count
    |--------------------------------------------------------------------------
    */

    $countSql = "
        SELECT COUNT(*)
        FROM services
        {$whereSql}
    ";

    $countStmt = $pdo->prepare($countSql);

    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value, PDO::PARAM_STR);
    }

    $countStmt->execute();

    $total = (int) $countStmt->fetchColumn();

    /*
    |--------------------------------------------------------------------------
    | Fetch Services
    |--------------------------------------------------------------------------
    */

    $sql = "
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
        {$whereSql}
        ORDER BY created_at DESC, id DESC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $pdo->prepare($sql);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value, PDO::PARAM_STR);
    }

    $stmt->bindValue(":limit", $limit, PDO::PARAM_INT);
    $stmt->bindValue(":offset", $offset, PDO::PARAM_INT);

    $stmt->execute();

    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /*
    |--------------------------------------------------------------------------
    | Normalize Data
    |--------------------------------------------------------------------------
    */

    foreach ($services as &$service) {

        $service["id"] = (int) $service["id"];

        $service["is_active"] = (int) $service["is_active"];

        /*
        |--------------------------------------------------------------------------
        | Full Image URL
        |--------------------------------------------------------------------------
        */

        if (!empty($service["image"])) {
            $service["image"] =
                rtrim(BASE_URL, "/") .
                "/" .
                ltrim($service["image"], "/");
        }
    }

    unset($service);

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    $totalPages = $total > 0
        ? (int) ceil($total / $limit)
        : 0;

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    jsonResponse(
        true,
        "Services fetched successfully.",
        [
            "services" => $services,

            "pagination" => [
                "page" => $page,
                "limit" => $limit,
                "total" => $total,
                "total_pages" => $totalPages,
            ],
        ],
        200
    );

} catch (PDOException $e) {

    error_log(
        "Services index error: " . $e->getMessage()
    );

    jsonResponse(
        false,
        "Unable to load services at the moment.",
        null,
        500
    );
}