<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

require_once __DIR__ . "/../PHPMailer/src/Exception.php";
require_once __DIR__ . "/../PHPMailer/src/PHPMailer.php";
require_once __DIR__ . "/../PHPMailer/src/SMTP.php";


/**
 * Send new order notification to admin.
 *
 * Email failure must never cancel a successfully created order.
 */
function sendOrderNotification(array $order, array $items): bool
{
    $mailConfig = require __DIR__ . "/mail.php";

    $mail = new PHPMailer(true);

    try {

        /*
         * ---------------------------------------------------------
         * Gmail SMTP
         * ---------------------------------------------------------
         */

        $mail->isSMTP();

        $mail->Host = (string) $mailConfig["host"];
        $mail->SMTPAuth = true;

        $mail->Username = (string) $mailConfig["username"];
        $mail->Password = (string) $mailConfig["password"];

        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = (int) $mailConfig["port"];


        /*
         * ---------------------------------------------------------
         * Sender
         * ---------------------------------------------------------
         */

        $mail->setFrom(
            (string) $mailConfig["from_email"],
            (string) $mailConfig["from_name"]
        );


        /*
         * ---------------------------------------------------------
         * Admin Recipient
         * ---------------------------------------------------------
         */

        $mail->addAddress(
            (string) $mailConfig["admin_email"],
            (string) $mailConfig["admin_name"]
        );


        /*
         * ---------------------------------------------------------
         * Email Format
         * ---------------------------------------------------------
         */

        $mail->isHTML(true);

        $mail->CharSet = "UTF-8";


        /*
         * ---------------------------------------------------------
         * Order Data
         * ---------------------------------------------------------
         */

        $orderNumber = htmlspecialchars(
            (string) ($order["order_number"] ?? ""),
            ENT_QUOTES,
            "UTF-8"
        );

        $customerName = htmlspecialchars(
            (string) ($order["customer_name"] ?? ""),
            ENT_QUOTES,
            "UTF-8"
        );

        $customerMobile = htmlspecialchars(
            (string) ($order["customer_mobile"] ?? ""),
            ENT_QUOTES,
            "UTF-8"
        );

        $customerEmailRaw = trim(
            (string) ($order["customer_email"] ?? "")
        );

        $customerEmail = htmlspecialchars(
            $customerEmailRaw !== ""
                ? $customerEmailRaw
                : "Not provided",
            ENT_QUOTES,
            "UTF-8"
        );

        $address = htmlspecialchars(
            (string) ($order["address_line"] ?? ""),
            ENT_QUOTES,
            "UTF-8"
        );

        $city = htmlspecialchars(
            (string) ($order["city"] ?? ""),
            ENT_QUOTES,
            "UTF-8"
        );

        $state = htmlspecialchars(
            (string) ($order["state"] ?? ""),
            ENT_QUOTES,
            "UTF-8"
        );

        $pincode = htmlspecialchars(
            (string) ($order["pincode"] ?? ""),
            ENT_QUOTES,
            "UTF-8"
        );

        $paymentMethod = htmlspecialchars(
            strtoupper(
                (string) ($order["payment_method"] ?? "")
            ),
            ENT_QUOTES,
            "UTF-8"
        );

        $notesRaw = trim(
            (string) ($order["notes"] ?? "")
        );

        $notes = htmlspecialchars(
            $notesRaw !== ""
                ? $notesRaw
                : "No notes",
            ENT_QUOTES,
            "UTF-8"
        );


        /*
         * ---------------------------------------------------------
         * Amounts
         * ---------------------------------------------------------
         */

        $subtotal = number_format(
            (float) ($order["subtotal"] ?? 0),
            2
        );

        $deliveryCharge = number_format(
            (float) ($order["delivery_charge"] ?? 0),
            2
        );

        $discount = number_format(
            (float) ($order["discount"] ?? 0),
            2
        );

        $total = number_format(
            (float) ($order["total"] ?? 0),
            2
        );


        /*
         * ---------------------------------------------------------
         * Product Rows
         * ---------------------------------------------------------
         */

        $itemsHtml = "";

        foreach ($items as $item) {

            $productName = htmlspecialchars(
                (string) ($item["product_name"] ?? "Product"),
                ENT_QUOTES,
                "UTF-8"
            );

            $quantity = (int) ($item["quantity"] ?? 0);

            $price = number_format(
                (float) ($item["price"] ?? 0),
                2
            );

            $itemTotal = number_format(
                (float) ($item["total"] ?? 0),
                2
            );

            $skuRaw = trim(
                (string) ($item["sku"] ?? "")
            );

            $sku = htmlspecialchars(
                $skuRaw !== ""
                    ? $skuRaw
                    : "-",
                ENT_QUOTES,
                "UTF-8"
            );

            $itemsHtml .= "
                <tr>
                    <td style='
                        padding:10px;
                        border-bottom:1px solid #eeeeee;
                    '>
                        {$productName}
                    </td>

                    <td style='
                        padding:10px;
                        border-bottom:1px solid #eeeeee;
                        text-align:center;
                    '>
                        {$quantity}
                    </td>

                    <td style='
                        padding:10px;
                        border-bottom:1px solid #eeeeee;
                        text-align:right;
                    '>
                        ₹{$price}
                    </td>

                    <td style='
                        padding:10px;
                        border-bottom:1px solid #eeeeee;
                        text-align:right;
                    '>
                        ₹{$itemTotal}
                    </td>

                    <td style='
                        padding:10px;
                        border-bottom:1px solid #eeeeee;
                        text-align:center;
                    '>
                        {$sku}
                    </td>
                </tr>
            ";
        }


        /*
         * ---------------------------------------------------------
         * Subject
         * ---------------------------------------------------------
         */

        $mail->Subject = "New Order - {$orderNumber}";


        /*
         * ---------------------------------------------------------
         * HTML Email
         * ---------------------------------------------------------
         */

        $mail->Body = "
            <div style='
                margin:0;
                padding:20px;
                background:#f5f7fb;
                font-family:Arial,Helvetica,sans-serif;
            '>

                <div style='
                    max-width:750px;
                    margin:0 auto;
                    background:#ffffff;
                    border-radius:10px;
                    padding:25px;
                    border:1px solid #e5e7eb;
                '>

                    <h2 style='
                        margin-top:0;
                        color:#111827;
                    '>
                        New Order Received
                    </h2>

                    <p style='color:#374151;'>
                        A new order has been placed on
                        <strong>AshrafChak</strong>.
                    </p>

                    <hr>

                    <h3 style='color:#111827;'>
                        Order Details
                    </h3>

                    <p style='line-height:1.8;'>
                        <strong>Order Number:</strong>
                        {$orderNumber}<br>

                        <strong>Payment Method:</strong>
                        {$paymentMethod}<br>

                        <strong>Payment Status:</strong>
                        Pending<br>

                        <strong>Order Status:</strong>
                        Pending
                    </p>


                    <h3 style='color:#111827;'>
                        Customer Details
                    </h3>

                    <p style='line-height:1.8;'>
                        <strong>Name:</strong>
                        {$customerName}<br>

                        <strong>Mobile:</strong>
                        {$customerMobile}<br>

                        <strong>Email:</strong>
                        {$customerEmail}
                    </p>


                    <h3 style='color:#111827;'>
                        Delivery Address
                    </h3>

                    <p style='line-height:1.8;'>
                        {$address}<br>
                        {$city}, {$state} - {$pincode}
                    </p>


                    <h3 style='color:#111827;'>
                        Products
                    </h3>

                    <table
                        width='100%'
                        cellspacing='0'
                        cellpadding='0'
                        style='
                            border-collapse:collapse;
                            font-size:14px;
                        '
                    >

                        <thead>
                            <tr style='background:#f3f4f6;'>

                                <th style='
                                    padding:10px;
                                    text-align:left;
                                '>
                                    Product
                                </th>

                                <th style='
                                    padding:10px;
                                    text-align:center;
                                '>
                                    Qty
                                </th>

                                <th style='
                                    padding:10px;
                                    text-align:right;
                                '>
                                    Price
                                </th>

                                <th style='
                                    padding:10px;
                                    text-align:right;
                                '>
                                    Total
                                </th>

                                <th style='
                                    padding:10px;
                                    text-align:center;
                                '>
                                    SKU
                                </th>

                            </tr>
                        </thead>

                        <tbody>
                            {$itemsHtml}
                        </tbody>

                    </table>


                    <br>


                    <table
                        width='100%'
                        cellspacing='0'
                        cellpadding='0'
                        style='
                            border-collapse:collapse;
                            font-size:14px;
                        '
                    >

                        <tr>
                            <td style='padding:6px;'>
                                Subtotal
                            </td>

                            <td style='
                                padding:6px;
                                text-align:right;
                            '>
                                ₹{$subtotal}
                            </td>
                        </tr>


                        <tr>
                            <td style='padding:6px;'>
                                Delivery
                            </td>

                            <td style='
                                padding:6px;
                                text-align:right;
                            '>
                                ₹{$deliveryCharge}
                            </td>
                        </tr>


                        <tr>
                            <td style='padding:6px;'>
                                Discount
                            </td>

                            <td style='
                                padding:6px;
                                text-align:right;
                            '>
                                ₹{$discount}
                            </td>
                        </tr>


                        <tr>
                            <td style='
                                padding:12px 6px;
                                font-size:18px;
                            '>
                                <strong>Total</strong>
                            </td>

                            <td style='
                                padding:12px 6px;
                                text-align:right;
                                font-size:18px;
                            '>
                                <strong>
                                    ₹{$total}
                                </strong>
                            </td>
                        </tr>

                    </table>


                    <hr>


                    <h3 style='color:#111827;'>
                        Customer Notes
                    </h3>

                    <p style='
                        background:#f9fafb;
                        padding:12px;
                        border-radius:6px;
                        color:#374151;
                    '>
                        {$notes}
                    </p>


                    <hr>


                    <p style='
                        font-size:12px;
                        color:#6b7280;
                        margin-bottom:0;
                    '>
                        This is an automatic order notification
                        from AshrafChak.
                    </p>

                </div>

            </div>
        ";


        /*
         * ---------------------------------------------------------
         * Plain Text Fallback
         * ---------------------------------------------------------
         */

        $mail->AltBody =
            "New AshrafChak Order\n\n" .
            "Order Number: {$orderNumber}\n" .
            "Customer: {$customerName}\n" .
            "Mobile: {$customerMobile}\n" .
            "Email: {$customerEmail}\n" .
            "Payment Method: {$paymentMethod}\n" .
            "Subtotal: ₹{$subtotal}\n" .
            "Delivery: ₹{$deliveryCharge}\n" .
            "Discount: ₹{$discount}\n" .
            "Total: ₹{$total}\n" .
            "Address: {$address}, {$city}, {$state} - {$pincode}\n" .
            "Notes: {$notes}\n";


        /*
         * ---------------------------------------------------------
         * Send Email
         * ---------------------------------------------------------
         */

        $mail->send();

        error_log(
            "AshrafBazar SMTP: Order email sent successfully to " .
            $mailConfig["admin_email"]
        );

        return true;


    } catch (Exception $e) {

        /*
         * Email failure must NOT cancel the order.
         */

        error_log(
            "AshrafBazar Order Email Error: " .
            $e->getMessage()
        );

        return false;


    } catch (Throwable $e) {

        error_log(
            "AshrafBazar Order Email Unexpected Error: " .
            $e->getMessage()
        );

        return false;
    }
}