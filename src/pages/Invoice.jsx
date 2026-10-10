import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE =
  "http://localhost/ashrafbazar/backend/api";

const INVOICE_API =
  `${API_BASE}/invoices/show.php`;

const formatMoney = (value) => {
  const number = Number(value);

  return `₹${Number.isFinite(number)
    ? number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00"}`;
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatPaymentMethod = (value) => {
  if (!value) return "—";

  const method = String(value).toLowerCase();

  if (method === "cod") return "Cash on Delivery";
  if (method === "razorpay") return "Razorpay";
  if (method === "phonepe") return "PhonePe";
  if (method === "paytm") return "Paytm";

  return value;
};

const formatStatus = (value) => {
  if (!value) return "—";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

function Invoice() {
  const { id } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = () => {
    return (
      localStorage.getItem("admin_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      localStorage.getItem("user_token") ||
      ""
    );
  };

  const loadInvoice = useCallback(async () => {
    if (!id) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "Authentication token is missing. Please login again."
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${INVOICE_API}?order_id=${encodeURIComponent(id)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();

      let result;

      try {
        result = text
          ? JSON.parse(text)
          : null;
      } catch {
        throw new Error(
          `Invalid server response (${response.status}).`
        );
      }

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            `Request failed with status ${response.status}.`
        );
      }

      setInvoice(result.data);
    } catch (err) {
      console.error(
        "Invoice API error:",
        err
      );

      setInvoice(null);
      setError(
        err?.message ||
          "Unable to load invoice."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  // This route is a standalone invoice document. Keep the customer
  // header/bottom navigation visually behind it while the invoice is open.
  useEffect(() => {
    document.body.classList.add("ashraf-invoice-route");

    return () => {
      document.body.classList.remove("ashraf-invoice-route");
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-4xl">

          <div className="h-10 w-48 animate-pulse rounded bg-slate-200" />

          <div className="mt-6 h-[700px] animate-pulse rounded-2xl bg-white shadow-sm" />

        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">

        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <i className="fa-solid fa-file-circle-xmark text-2xl" />
          </div>

          <h1 className="mt-5 text-xl font-extrabold text-slate-900">
            Invoice unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error ||
              "Unable to load invoice."}
          </p>

          <div className="mt-6 flex justify-center gap-3">

            <button
              type="button"
              onClick={loadInvoice}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              <i className="fa-solid fa-rotate-right mr-2" />
              Try Again
            </button>

            <Link
              to="/orders"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              My Orders
            </Link>

          </div>

        </div>

      </div>
    );
  }

  const store = invoice.store || {};
  const customer = invoice.customer || {};
  const items = Array.isArray(invoice.items)
    ? invoice.items
    : [];
  const summary = invoice.summary || {};
  const payment = invoice.payment;

  return (
    <>
      {/* PRINT CSS */}

      <style>
        {`
          /* Standalone invoice route */
          body.ashraf-invoice-route {
            overflow-x: hidden !important;
          }

          /* Cover the customer Header / bottom navigation on screen.
             They remain mounted by App.jsx, but cannot appear over the invoice. */
          .ashraf-invoice-shell {
            position: fixed !important;
            inset: 0 !important;
            z-index: 99999 !important;
            overflow-y: auto !important;
            background: #f1f5f9 !important;
          }

          @media print {
            @page {
              size: A4;
              margin: 8mm;
            }

            html,
            body {
              width: 210mm !important;
              min-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              overflow: visible !important;
            }

            /*
             * Print ONLY the invoice route.
             * This prevents App.jsx Header and MobileBottomNav from
             * creating a second printed page.
             */
            body * {
              visibility: hidden !important;
            }

            .ashraf-invoice-shell,
            .ashraf-invoice-shell * {
              visibility: visible !important;
            }

            .ashraf-invoice-shell {
              position: static !important;
              inset: auto !important;
              width: 100% !important;
              min-height: 0 !important;
              max-height: none !important;
              overflow: visible !important;
              background: white !important;
            }

            .no-print {
              display: none !important;
            }

            .invoice-page {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .invoice-paper {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              overflow: visible !important;
            }

            .invoice-paper table {
              min-width: 0 !important;
              width: 100% !important;
            }

            .invoice-paper .overflow-x-auto {
              overflow: visible !important;
            }

            /* Avoid rows/cards splitting across pages. */
            .invoice-paper table tr,
            .invoice-paper .border-b,
            .invoice-paper .border-t {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            .invoice-paper {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        `}
      </style>

      <div className="ashraf-invoice-shell min-h-screen bg-slate-100 px-3 py-6 sm:px-6 sm:py-10">

        {/* =================================================
            TOP ACTIONS
        ================================================= */}

        <div className="no-print invoice-page mx-auto mb-5 flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600"
          >
            <i className="fa-solid fa-arrow-left" />
            Back to Orders
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700"
          >
            <i className="fa-solid fa-print" />
            Print / Save PDF
          </button>

        </div>

        {/* =================================================
            INVOICE
        ================================================= */}

        <div className="invoice-page mx-auto max-w-4xl">

          <div className="invoice-paper overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="border-b border-slate-200 px-5 py-6 sm:px-8 sm:py-8">

              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

                {/* STORE */}

                <div>

                  <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    {store.name ||
                      "AshrafChak"}
                  </h1>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {store.tagline ||
                      "Aapki Local Online Dukaan"}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {store.city ||
                      "Simri Bakhtiyarpur"}
                    {store.state
                      ? `, ${store.state}`
                      : ""}
                  </p>

                </div>

                {/* INVOICE INFO */}

                <div className="sm:text-right">

                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Invoice
                  </p>

                  <h2 className="mt-1 text-xl font-black text-blue-600">
                    {invoice.invoice_number}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Date:{" "}
                    <span className="font-semibold text-slate-700">
                      {formatDate(
                        invoice.invoice_date
                      )}
                    </span>
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Order:{" "}
                    <span className="font-bold text-slate-700">
                      #{invoice.order_number}
                    </span>
                  </p>

                </div>

              </div>

            </div>

            {/* =================================================
                CUSTOMER + PAYMENT
            ================================================= */}

            <div className="grid gap-6 border-b border-slate-200 px-5 py-6 sm:grid-cols-2 sm:px-8">

              {/* BILL TO */}

              <div>

                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Bill To
                </p>

                <h3 className="mt-2 text-base font-extrabold text-slate-900">
                  {customer.name ||
                    "Customer"}
                </h3>

                <div className="mt-2 space-y-1 text-sm leading-5 text-slate-600">

                  {customer.mobile && (
                    <p>
                      <i className="fa-solid fa-phone mr-2 w-4 text-slate-400" />
                      {customer.mobile}
                    </p>
                  )}

                  {customer.email && (
                    <p className="break-all">
                      <i className="fa-solid fa-envelope mr-2 w-4 text-slate-400" />
                      {customer.email}
                    </p>
                  )}

                  {customer.address_line && (
                    <p>
                      <i className="fa-solid fa-location-dot mr-2 w-4 text-slate-400" />
                      {customer.address_line}
                    </p>
                  )}

                  <p>
                    {customer.city || ""}
                    {customer.state
                      ? `, ${customer.state}`
                      : ""}
                    {customer.pincode
                      ? ` - ${customer.pincode}`
                      : ""}
                  </p>

                </div>

              </div>

              {/* PAYMENT */}

              <div className="sm:text-right">

                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Payment
                </p>

                <p className="mt-2 text-base font-extrabold text-slate-900">
                  {formatPaymentMethod(
                    payment?.payment_method ||
                      invoice.payment_method
                  )}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Status:{" "}
                  <span className="font-bold text-slate-700">
                    {formatStatus(
                      payment?.status ||
                        invoice.payment_status
                    )}
                  </span>
                </p>

                {payment?.transaction_id && (
                  <p className="mt-1 break-all text-xs text-slate-400">
                    Transaction ID:{" "}
                    {payment.transaction_id}
                  </p>
                )}

              </div>

            </div>

            {/* =================================================
                ITEMS
            ================================================= */}

            <div className="px-5 py-6 sm:px-8">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[600px]">

                  <thead>

                    <tr className="border-b-2 border-slate-200">

                      <th className="pb-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                        #
                      </th>

                      <th className="pb-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                        Product
                      </th>

                      <th className="pb-3 text-center text-xs font-extrabold uppercase tracking-wide text-slate-500">
                        Qty
                      </th>

                      <th className="pb-3 text-right text-xs font-extrabold uppercase tracking-wide text-slate-500">
                        Price
                      </th>

                      <th className="pb-3 text-right text-xs font-extrabold uppercase tracking-wide text-slate-500">
                        Total
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {items.map(
                      (item, index) => (
                        <tr
                          key={
                            item.id ||
                            `${item.product_id}-${index}`
                          }
                          className="border-b border-slate-100"
                        >

                          <td className="py-4 text-sm text-slate-400">
                            {index + 1}
                          </td>

                          <td className="py-4">

                            <p className="text-sm font-bold text-slate-800">
                              {item.product_name}
                            </p>

                            {item.sku && (
                              <p className="mt-1 text-xs text-slate-400">
                                SKU: {item.sku}
                              </p>
                            )}

                          </td>

                          <td className="py-4 text-center text-sm font-semibold text-slate-700">
                            {item.quantity}
                          </td>

                          <td className="py-4 text-right text-sm text-slate-600">
                            {formatMoney(
                              item.price
                            )}
                          </td>

                          <td className="py-4 text-right text-sm font-extrabold text-slate-900">
                            {formatMoney(
                              item.total
                            )}
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

            {/* =================================================
                TOTAL
            ================================================= */}

            <div className="border-t border-slate-200 px-5 py-6 sm:px-8">

              <div className="ml-auto w-full max-w-sm space-y-3">

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Subtotal</span>

                  <span className="font-semibold">
                    {formatMoney(
                      summary.subtotal
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Delivery Charge</span>

                  <span className="font-semibold">
                    {formatMoney(
                      summary.delivery_charge
                    )}
                  </span>
                </div>

                {Number(summary.discount) > 0 && (
                  <div className="flex items-center justify-between text-sm text-emerald-600">
                    <span>Discount</span>

                    <span className="font-semibold">
                      -{" "}
                      {formatMoney(
                        summary.discount
                      )}
                    </span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-3">

                  <div className="flex items-center justify-between">

                    <span className="text-base font-extrabold text-slate-900">
                      Grand Total
                    </span>

                    <span className="text-xl font-black text-blue-600">
                      {formatMoney(
                        summary.total
                      )}
                    </span>

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-6 text-center sm:px-8">

              <p className="text-sm font-bold text-slate-700">
                Thank you for shopping with{" "}
                {store.name ||
                  "AshrafChak"}!
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {store.tagline ||
                  "Aapki Local Online Dukaan"}
              </p>

              <p className="mt-4 text-[11px] text-slate-400">
                This is a computer-generated invoice.
              </p>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}

export default Invoice;