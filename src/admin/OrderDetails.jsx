import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";

/* =========================================================
   API
========================================================= */

const API_BASE =
  "http://localhost/ashrafbazar/backend/api";

const ORDER_DETAILS_API =
  `${API_BASE}/orders/show.php`;

const UPDATE_ORDER_API =
  `${API_BASE}/orders/update.php`;

const BACKEND_BASE =
  "http://localhost/ashrafbazar/backend";

/* =========================================================
   ADMIN TOKEN
========================================================= */

function getAdminToken() {
  return (
    localStorage.getItem("admin_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    ""
  );
}

/* =========================================================
   IMAGE URL
========================================================= */

function getImageUrl(image) {
  if (!image) {
    return "";
  }

  const value = String(image).trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${BACKEND_BASE}${value}`;
  }

  if (
    value.startsWith("uploads/")
  ) {
    return `${BACKEND_BASE}/${value}`;
  }

  if (
    value.startsWith("images/")
  ) {
    return value.startsWith("/")
      ? value
      : `/${value}`;
  }

  return `${BACKEND_BASE}/uploads/${value}`;
}

/* =========================================================
   RESPONSE PARSER
========================================================= */

async function parseResponse(response) {
  const text =
    await response.text();

  let data = null;

  try {
    data = text
      ? JSON.parse(text)
      : null;
  } catch {
    throw new Error(
      "Server returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !data?.success
  ) {
    throw new Error(
      data?.message ||
        "Unable to process request."
    );
  }

  return data;
}

/* =========================================================
   DATE
========================================================= */

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

/* =========================================================
   PRICE
========================================================= */

function formatPrice(value) {
  const amount =
    Number(value);

  if (
    !Number.isFinite(amount)
  ) {
    return "₹0";
  }

  return `₹${amount.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}

/* =========================================================
   NUMBER
========================================================= */

function toNumber(value) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(status) {
  return String(status || "")
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_")
    .trim();
}

/* =========================================================
   STATUS LABEL
========================================================= */

function getStatusLabel(status) {
  const normalized =
    normalizeStatus(status);

  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    out_for_delivery:
      "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
  };

  return (
    labels[normalized] ||
    "Pending"
  );
}

/* =========================================================
   PAYMENT LABEL
========================================================= */

function getPaymentLabel(payment) {
  const normalized =
    String(payment || "")
      .toLowerCase()
      .trim();

  const labels = {
    cod: "COD",
    razorpay: "Razorpay",
    phonepe: "PhonePe",
    paytm: "Paytm",
  };

  return (
    labels[normalized] ||
    (normalized
      ? normalized
          .replaceAll(
            "_",
            " "
          )
          .replace(
            /\b\w/g,
            (char) =>
              char.toUpperCase()
          )
      : "—")
  );
}

/* =========================================================
   PAYMENT STATUS LABEL
========================================================= */

function getPaymentStatusLabel(
  status
) {
  const normalized =
    String(status || "")
      .toLowerCase()
      .trim();

  const labels = {
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
  };

  return (
    labels[normalized] ||
    "Pending"
  );
}

/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {
  switch (
    normalizeStatus(status)
  ) {
    case "pending":
      return "bg-amber-50 text-amber-700";

    case "confirmed":
      return "bg-cyan-50 text-cyan-700";

    case "processing":
      return "bg-blue-50 text-blue-700";

    case "shipped":
      return "bg-violet-50 text-violet-700";

    case "out_for_delivery":
      return "bg-orange-50 text-orange-700";

    case "delivered":
      return "bg-emerald-50 text-emerald-700";

    case "cancelled":
      return "bg-red-50 text-red-700";

    case "returned":
      return "bg-purple-50 text-purple-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

/* =========================================================
   PAYMENT CLASS
========================================================= */

function getPaymentClass(
  status
) {
  switch (
    String(status || "")
      .toLowerCase()
      .trim()
  ) {
    case "paid":
      return "bg-emerald-50 text-emerald-700";

    case "failed":
      return "bg-red-50 text-red-700";

    case "refunded":
      return "bg-purple-50 text-purple-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
}

/* =========================================================
   ORDER STATUSES
========================================================= */

const orderStatuses = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "processing",
    label: "Processing",
  },
  {
    value: "shipped",
    label: "Shipped",
  },
  {
    value: "out_for_delivery",
    label: "Out for Delivery",
  },
  {
    value: "delivered",
    label: "Delivered",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
  {
    value: "returned",
    label: "Returned",
  },
];

/* =========================================================
   STATUS TRANSITIONS
   Must match backend
========================================================= */

const allowedTransitions = {
  pending: [
    "confirmed",
    "cancelled",
  ],

  confirmed: [
    "processing",
    "cancelled",
  ],

  processing: [
    "shipped",
    "cancelled",
  ],

  shipped: [
    "out_for_delivery",
    "cancelled",
  ],

  out_for_delivery: [
    "delivered",
    "returned",
  ],

  delivered: [
    "returned",
  ],

  cancelled: [],

  returned: [],
};

/* =========================================================
   AVAILABLE STATUSES
========================================================= */

function getAvailableStatuses(
  currentStatus
) {
  const current =
    normalizeStatus(
      currentStatus
    );

  const allowed =
    allowedTransitions[
      current
    ] || [];

  return orderStatuses.filter(
    (status) =>
      status.value === current ||
      allowed.includes(
        status.value
      )
  );
}

/* =========================================================
   TIMELINE
========================================================= */

const timelineStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

/* =========================================================
   NORMALIZE ITEM
========================================================= */

function normalizeItem(
  item,
  index
) {
  const quantity =
    Math.max(
      1,
      parseInt(
        item?.quantity,
        10
      ) || 1
    );

  const price =
    toNumber(
      item?.price
    );

  const total =
    toNumber(
      item?.total
    ) ||
    price * quantity;

  return {
    ...item,

    id:
      item?.id ??
      `item-${index}`,

    name:
      item?.product_name ||
      item?.name ||
      "Product",

    sku:
      item?.sku ||
      "—",

    price,

    quantity,

    total,

    image:
      item?.image ||
      item?.product_image ||
      item?.image_url ||
      "",
  };
}

/* =========================================================
   NORMALIZE ORDER
========================================================= */

function normalizeOrder(
  raw
) {
  const source =
    raw?.order ||
    raw?.data?.order ||
    raw?.data ||
    raw ||
    {};

  const rawItems =
    Array.isArray(
      source?.items
    )
      ? source.items
      : Array.isArray(
          source?.order_items
        )
      ? source.order_items
      : [];

  const items =
    rawItems.map(
      normalizeItem
    );

  const customerName =
    source?.customer_name ||
    source?.customer?.name ||
    "Customer";

  const customerMobile =
    source?.customer_mobile ||
    source?.customer?.mobile ||
    "—";

  const customerEmail =
    source?.customer_email ||
    source?.customer?.email ||
    "";

  const address =
    source?.address ||
    {};

  return {
    ...source,

    id:
      Number(source?.id) ||
      source?.order_number ||
      "",

    orderNumber:
      source?.order_number ||
      source?.id ||
      "—",

    date:
      source?.created_at ||
      source?.date ||
      "",

    updatedAt:
      source?.updated_at ||
      "",

    customer: {
      name:
        customerName,

      mobile:
        customerMobile,

      email:
        customerEmail,
    },

    address: {
      name:
        address?.name ||
        customerName,

      address:
        address?.address_line ||
        address?.address ||
        source?.address_line ||
        "—",

      city:
        address?.city ||
        source?.city ||
        "—",

      state:
        address?.state ||
        source?.state ||
        "—",

      pin:
        address?.pincode ||
        address?.pin ||
        source?.pincode ||
        "—",
    },

    items,

    subtotal:
      toNumber(
        source?.subtotal
      ),

    discount:
      toNumber(
        source?.discount
      ),

    delivery:
      toNumber(
        source?.delivery_charge ??
          source?.delivery
      ),

    total:
      toNumber(
        source?.total ??
          source?.grand_total
      ),

    payment:
      source?.payment_method ||
      source?.payment ||
      "cod",

    paymentStatus:
      normalizeStatus(
        source?.payment_status ||
          "pending"
      ),

    status:
      normalizeStatus(
        source?.order_status ||
          source?.status ||
          "pending"
      ),

    note:
      source?.notes ||
      source?.note ||
      "",
  };
}

/* =========================================================
   ORDER DETAILS
========================================================= */

function OrderDetails() {
  const { id } =
    useParams();

  const [order, setOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [selectedStatus, setSelectedStatus] =
    useState("");

  const [updating, setUpdating] =
    useState(false);

  /* =======================================================
     LOAD ORDER
  ======================================================= */

  const loadOrder = useCallback(
    async (isRefresh = false) => {
      const token =
        getAdminToken();

      if (!token) {
        setLoading(false);
        setError(
          "Admin authentication token is missing. Please login again."
        );
        return;
      }

      if (!id) {
        setLoading(false);
        setError(
          "Invalid order ID."
        );
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        /*
        |--------------------------------------------------------------------------
        | Use order ID in query string
        |--------------------------------------------------------------------------
        */

        const url =
          `${ORDER_DETAILS_API}?id=${encodeURIComponent(
            id
          )}`;

        const response =
          await fetch(url, {
            method: "GET",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          });

        const result =
          await parseResponse(
            response
          );

        const normalized =
          normalizeOrder(
            result?.data
          );

        setOrder(
          normalized
        );

        setSelectedStatus(
          normalized.status
        );

      } catch (err) {
        console.error(
          "Admin Order Details API error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load order details."
        );

        if (!isRefresh) {
          setOrder(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  /* =======================================================
     SUCCESS MESSAGE
  ======================================================= */

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer =
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [successMessage]);

  /* =======================================================
     AVAILABLE STATUS OPTIONS
  ======================================================= */

  const availableStatuses =
    useMemo(() => {
      if (!order) {
        return [];
      }

      return getAvailableStatuses(
        order.status
      );
    }, [order]);

  /* =======================================================
     STATUS UPDATE
  ======================================================= */

  const updateStatus =
    async () => {
      if (!order) {
        return;
      }

      const token =
        getAdminToken();

      if (!token) {
        setError(
          "Admin authentication token is missing. Please login again."
        );
        return;
      }

      const currentStatus =
        normalizeStatus(
          order.status
        );

      const newStatus =
        normalizeStatus(
          selectedStatus
        );

      if (
        !newStatus ||
        newStatus ===
          currentStatus
      ) {
        return;
      }

      const allowed =
        allowedTransitions[
          currentStatus
        ] || [];

      if (
        !allowed.includes(
          newStatus
        )
      ) {
        setError(
          `Cannot change order from "${getStatusLabel(
            currentStatus
          )}" to "${getStatusLabel(
            newStatus
          )}".`
        );
        return;
      }

      setUpdating(true);
      setError("");
      setSuccessMessage("");

      try {
        const response =
          await fetch(
            UPDATE_ORDER_API,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                order_id:
                  Number(order.id),

                order_status:
                  newStatus,
              }),
            }
          );

        const result =
          await parseResponse(
            response
          );

        /*
        |--------------------------------------------------------------------------
        | Reload complete order from backend
        |--------------------------------------------------------------------------
        */

        setSuccessMessage(
          result?.message ||
            "Order status updated successfully."
        );

        await loadOrder(
          true
        );

      } catch (err) {
        console.error(
          "Order status update error:",
          err
        );

        setError(
          err?.message ||
            "Unable to update order status."
        );
      } finally {
        setUpdating(false);
      }
    };

  /* =======================================================
     TIMELINE CURRENT INDEX
  ======================================================= */

  const currentStatusIndex =
    order
      ? timelineStatuses.indexOf(
          order.status
        )
      : -1;

  /* =======================================================
     FINAL STATUS
  ======================================================= */

  const isFinalStatus =
    order
      ? [
          "cancelled",
          "returned",
        ].includes(
          order.status
        )
      : false;

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">

        <div className="mb-6">
          <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />

          <div className="mt-3 h-8 w-56 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="animate-pulse">
            <div className="h-4 w-28 rounded bg-slate-200" />

            <div className="mt-4 h-10 w-full rounded-xl bg-slate-100" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">

          <div className="space-y-6">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-44 rounded bg-slate-200" />

                <div className="h-20 rounded-xl bg-slate-100" />

                <div className="h-20 rounded-xl bg-slate-100" />
              </div>
            </div>

          </div>

          <div className="space-y-6">

            <div className="h-52 animate-pulse rounded-2xl bg-slate-200" />

            <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />

          </div>

        </div>

      </div>
    );
  }

  /* =======================================================
     ERROR / NO ORDER
  ======================================================= */

  if (!order) {
    return (
      <div className="mx-auto max-w-7xl">

        <div className="mb-6">

          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            <i className="fa-solid fa-arrow-left" />
            Back to Orders
          </Link>

        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center">

          <i className="fa-solid fa-circle-exclamation text-4xl text-red-400" />

          <h2 className="mt-4 font-heading text-xl font-extrabold text-slate-900">
            Unable to load order
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {error ||
              "Order not found."}
          </p>

          <button
            type="button"
            onClick={() =>
              loadOrder()
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            <i className="fa-solid fa-rotate-right" />
            Try Again
          </button>

        </div>

      </div>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <div className="mx-auto max-w-7xl">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">

            <Link
              to="/admin/orders"
              className="font-semibold hover:text-blue-600"
            >
              Orders
            </Link>

            <i className="fa-solid fa-chevron-right text-[10px]" />

            <span>
              #{order.orderNumber}
            </span>

          </div>

          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Order #
            {order.orderNumber}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Placed on{" "}
            {formatDate(
              order.date
            )}
          </p>

        </div>

        <div className="flex gap-2">

          <Link
            to={`/orders/${order.id}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            <i className="fa-solid fa-file-invoice" />
            View Bill
          </Link>

          <button
            type="button"
            onClick={() =>
              loadOrder(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i
              className={`fa-solid fa-rotate-right ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>

          <Link
            to="/admin/orders"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <i className="fa-solid fa-arrow-left" />
            Back
          </Link>

        </div>

      </div>

      {/* ===================================================
          SUCCESS
      =================================================== */}

      {successMessage && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">

          <i className="fa-solid fa-circle-check" />

          <span>
            {successMessage}
          </span>

        </div>
      )}

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <i className="fa-solid fa-circle-exclamation mt-0.5" />

          <div className="flex-1">

            <p className="font-bold">
              Unable to complete request
            </p>

            <p className="mt-0.5">
              {error}
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="text-red-400 hover:text-red-600"
          >
            <i className="fa-solid fa-xmark" />
          </button>

        </div>
      )}

      {/* ===================================================
          STATUS ACTION
      =================================================== */}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Current Status
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClass(
                  order.status
                )}`}
              >
                {getStatusLabel(
                  order.status
                )}
              </span>

              <span className="text-sm text-slate-500">
                Payment:{" "}
                <strong className="text-slate-700">
                  {getPaymentLabel(
                    order.payment
                  )}
                </strong>
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${getPaymentClass(
                  order.paymentStatus
                )}`}
              >
                {getPaymentStatusLabel(
                  order.paymentStatus
                )}
              </span>

            </div>

          </div>

          <div className="flex flex-col gap-2 sm:flex-row">

            <select
              value={
                selectedStatus ||
                order.status
              }
              disabled={
                updating ||
                isFinalStatus
              }
              onChange={(e) =>
                setSelectedStatus(
                  e.target.value
                )
              }
              className={`rounded-xl border-0 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 ${getStatusClass(
                order.status
              )}`}
            >

              {availableStatuses.map(
                (status) => (
                  <option
                    key={
                      status.value
                    }
                    value={
                      status.value
                    }
                  >
                    {status.label}
                  </option>
                )
              )}

            </select>

            <button
              type="button"
              onClick={
                updateStatus
              }
              disabled={
                updating ||
                isFinalStatus ||
                selectedStatus ===
                  order.status
              }
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {updating ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk mr-2" />
                  Save Status
                </>
              )}

            </button>

          </div>

        </div>

        {isFinalStatus && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
            <i className="fa-solid fa-lock mr-2" />
            This order is closed and its status cannot be changed.
          </div>
        )}

      </div>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">

        {/* =================================================
            LEFT
        ================================================= */}

        <div className="space-y-6">

          {/* =================================================
              PRODUCTS
          ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-5 sm:p-6">

              <h2 className="font-heading text-lg font-extrabold text-slate-900">
                Ordered Products
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {order.items.length}{" "}
                {order.items.length ===
                1
                  ? "product"
                  : "products"}{" "}
                in this order.
              </p>

            </div>

            <div className="divide-y divide-slate-100">

              {order.items.length ===
              0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No order items found.
                </div>
              ) : (
                order.items.map(
                  (item) => {

                    const imageUrl =
                      getImageUrl(
                        item.image
                      );

                    return (
                      <div
                        key={
                          item.id
                        }
                        className="flex gap-4 p-5 sm:p-6"
                      >

                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">

                          {imageUrl ? (
                            <img
                              src={
                                imageUrl
                              }
                              alt={
                                item.name
                              }
                              className="h-full w-full object-contain"
                              onError={(
                                e
                              ) => {
                                e.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                              <i className="fa-solid fa-box text-xl" />
                            </div>
                          )}

                        </div>

                        <div className="min-w-0 flex-1">

                          <h3 className="font-bold text-slate-900">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            SKU:{" "}
                            {item.sku}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">

                            <span className="text-slate-500">
                              Qty:{" "}
                              <strong className="text-slate-800">
                                {
                                  item.quantity
                                }
                              </strong>
                            </span>

                            <span className="text-slate-500">
                              Price:{" "}
                              <strong className="text-slate-800">
                                {formatPrice(
                                  item.price
                                )}
                              </strong>
                            </span>

                          </div>

                        </div>

                        <div className="text-right">

                          <p className="font-extrabold text-slate-900">
                            {formatPrice(
                              item.total
                            )}
                          </p>

                        </div>

                      </div>
                    );
                  }
                )
              )}

            </div>

            {/* SUMMARY */}

            <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-6">

              <div className="ml-auto max-w-sm space-y-3">

                <div className="flex justify-between text-sm">

                  <span className="text-slate-500">
                    Subtotal
                  </span>

                  <span className="font-semibold text-slate-800">
                    {formatPrice(
                      order.subtotal
                    )}
                  </span>

                </div>

                <div className="flex justify-between text-sm">

                  <span className="text-slate-500">
                    Discount
                  </span>

                  <span className="font-semibold text-emerald-600">
                    -{" "}
                    {formatPrice(
                      order.discount
                    )}
                  </span>

                </div>

                <div className="flex justify-between text-sm">

                  <span className="text-slate-500">
                    Delivery
                  </span>

                  <span className="font-semibold text-slate-800">
                    {formatPrice(
                      order.delivery
                    )}
                  </span>

                </div>

                <div className="border-t border-slate-200 pt-3">

                  <div className="flex justify-between">

                    <span className="font-heading font-extrabold text-slate-900">
                      Total
                    </span>

                    <span className="font-heading text-xl font-extrabold text-blue-600">
                      {formatPrice(
                        order.total
                      )}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              STATUS TIMELINE
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Order Timeline
            </h2>

            <div className="mt-6">

              {timelineStatuses.map(
                (
                  step,
                  index
                ) => {

                  const completed =
                    currentStatusIndex >=
                    index;

                  return (
                    <div
                      key={step}
                      className="relative flex gap-4 pb-7 last:pb-0"
                    >

                      {index !==
                        timelineStatuses.length -
                          1 && (
                        <div
                          className={`absolute left-[9px] top-5 h-full w-0.5 ${
                            index <
                            currentStatusIndex
                              ? "bg-blue-500"
                              : "bg-slate-200"
                          }`}
                        />
                      )}

                      <div
                        className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          completed
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {completed && (
                          <i className="fa-solid fa-check text-[9px]" />
                        )}
                      </div>

                      <div className="-mt-1">

                        <p
                          className={`text-sm font-bold ${
                            completed
                              ? "text-slate-900"
                              : "text-slate-400"
                          }`}
                        >
                          {getStatusLabel(
                            step
                          )}
                        </p>

                        {completed &&
                          index ===
                            currentStatusIndex && (
                            <p className="mt-1 text-xs text-slate-500">
                              Current order status
                            </p>
                          )}

                      </div>

                    </div>
                  );
                }
              )}

              {[
                "cancelled",
                "returned",
              ].includes(
                order.status
              ) && (
                <div className="relative flex gap-4">

                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                    <i className="fa-solid fa-xmark text-[9px]" />
                  </div>

                  <div className="-mt-1">

                    <p className="text-sm font-bold text-red-700">
                      {getStatusLabel(
                        order.status
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Final order status
                    </p>

                  </div>

                </div>
              )}

            </div>

          </section>

          {/* =================================================
              CUSTOMER NOTE
          ================================================= */}

          {order.note && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <i className="fa-regular fa-note-sticky" />
                </div>

                <div>

                  <h2 className="font-bold text-slate-900">
                    Customer Note
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {order.note}
                  </p>

                </div>

              </div>

            </section>
          )}

        </div>

        {/* =================================================
            RIGHT
        ================================================= */}

        <div className="space-y-6">

          {/* =================================================
              CUSTOMER
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Customer
            </h2>

            <div className="mt-5 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <i className="fa-solid fa-user" />
              </div>

              <div>

                <p className="font-bold text-slate-900">
                  {
                    order.customer
                      .name
                  }
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Customer
                </p>

              </div>

            </div>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">

              <div className="flex items-start gap-3 text-sm">

                <i className="fa-solid fa-phone mt-0.5 w-4 text-slate-400" />

                <span className="text-slate-600">
                  {
                    order.customer
                      .mobile
                  }
                </span>

              </div>

              {order.customer.email && (
                <div className="flex items-start gap-3 text-sm">

                  <i className="fa-solid fa-envelope mt-0.5 w-4 text-slate-400" />

                  <span className="break-all text-slate-600">
                    {
                      order.customer
                        .email
                    }
                  </span>

                </div>
              )}

            </div>

          </section>

          {/* =================================================
              DELIVERY ADDRESS
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Delivery Address
            </h2>

            <div className="mt-5 flex gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <i className="fa-solid fa-location-dot" />
              </div>

              <div className="text-sm leading-6 text-slate-600">

                <p className="font-bold text-slate-900">
                  {
                    order.address
                      .name
                  }
                </p>

                <p>
                  {
                    order.address
                      .address
                  }
                </p>

                <p>
                  {
                    order.address
                      .city
                  }
                  ,{" "}
                  {
                    order.address
                      .state
                  }
                </p>

                <p>
                  PIN -{" "}
                  {
                    order.address
                      .pin
                  }
                </p>

              </div>

            </div>

          </section>

          {/* =================================================
              PAYMENT
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Payment Details
            </h2>

            <div className="mt-5 space-y-4">

              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-slate-500">
                  Method
                </span>

                <span className="text-sm font-bold text-slate-800">
                  {getPaymentLabel(
                    order.payment
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-slate-500">
                  Payment Status
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${getPaymentClass(
                    order.paymentStatus
                  )}`}
                >
                  {getPaymentStatusLabel(
                    order.paymentStatus
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">

                <span className="font-bold text-slate-800">
                  Order Total
                </span>

                <span className="font-heading text-lg font-extrabold text-slate-900">
                  {formatPrice(
                    order.total
                  )}
                </span>

              </div>

            </div>

          </section>

        </div>

      </div>

    </div>
  );
}

export default OrderDetails;