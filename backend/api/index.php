<?php

declare(strict_types=1);

require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../config/config.php";
require_once __DIR__ . "/../helpers/Response.php";

jsonResponse(
    true,
    "AshrafBazar API is working.",
    [
        "app" => APP_NAME,
        "database" => "connected",
        "time" => date("Y-m-d H:i:s")
    ]
);