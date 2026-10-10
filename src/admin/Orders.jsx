import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/* =========================================================
   API
========================================================= */

const API_BASE =
  "http://localhost/ashrafbazar/backend/api";

const ORDERS_API =
  `${API_BASE}/orders/index.php`;

const UPDATE_ORDER_API =
  `${API_BASE}/orders/update.php`;

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
   RESPONSE PARSER
========================================================= */

async function parseResponse(response) {
  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      "Server returned an invalid response."
    );
  }

  if (!response.ok || !data?.success) {
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

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =========================================================
   PRICE
========================================================= */

function formatPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₹0";
  }

  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
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
  const normalized = normalizeStatus(status);

  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
  };

  return labels[normalized] || "Pending";
}

/* =========================================================
   PAYMENT LABEL
========================================================= */

function getPaymentLabel(payment) {
  const normalized = String(payment || "")
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
          .replaceAll("_", " ")
          .replace(/\b\w/g, (char) =>
            char.toUpperCase()
          )
      : "—")
  );
}

/* =========================================================
   PAYMENT STATUS LABEL
========================================================= */

function getPaymentStatusLabel(status) {
  const normalized = String(status || "")
    .toLowerCase()
    .trim();

  const labels = {
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
  };

  return labels[normalized] || "Pending";
}

/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {
  switch (normalizeStatus(status)) {
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

function getPaymentClass(status) {
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
   ALL ORDER STATUSES
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
   AVAILABLE STATUSES

   IMPORTANT:
   No step-by-step restriction.
   Admin can directly select ANY status.
========================================================= */

function getAvailableStatuses() {
  return orderStatuses;
}

/* =========================================================
   NORMALIZE ORDER
========================================================= */

function normalizeOrder(order) {
  const rawItems = Array.isArray(order?.items)
    ? order.items
    : Array.isArray(order?.order_items)
    ? order.order_items
    : [];

  return {
    ...order,

    id:
      Number(order?.id) ||
      order?.order_number,

    order_number:
      order?.order_number ||
      order?.id ||
      "—",

    customer:
      order?.customer_name ||
      order?.name ||
      "Customer",

    mobile:
      order?.customer_mobile ||
      order?.mobile ||
      "—",

    email:
      order?.customer_email ||
      order?.email ||
      "",

    items: rawItems,

    itemCount:
      Number(order?.item_count) ||
      Number(order?.items_count) ||
      rawItems.reduce(
        (total, item) =>
          total +
          Number(item?.quantity || 0),
        0
      ),

    amount: Number(
      order?.total ??
        order?.grand_total ??
        0
    ),

    payment:
      order?.payment_method ||
      "cod",

    paymentStatus:
      order?.payment_status ||
      "pending",

    status: normalizeStatus(
      order?.order_status ||
        order?.status ||
        "pending"
    ),

    date:
      order?.created_at ||
      order?.date ||
      "",
  };
}

/* =========================================================
   ORDERS
========================================================= */

function Orders() {
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [paymentFilter, setPaymentFilter] =
    useState("All");

  const [updatingId, setUpdatingId] =
    useState(null);

  const [successMessage, setSuccessMessage] =
    useState("");

  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  const loadOrders = useCallback(
    async (isRefresh = false) => {
      const token = getAdminToken();

      if (!token) {
        setLoading(false);
        setOrders([]);

        setError(
          "Admin authentication token is missing. Please login again."
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

        const response = await fetch(
          `${ORDERS_API}?page=1&limit=100`,
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const result =
          await parseResponse(response);

        const rawOrders =
          Array.isArray(
            result?.data?.orders
          )
            ? result.data.orders
            : Array.isArray(
                result?.data
              )
            ? result.data
            : [];

        const normalizedOrders =
          rawOrders.map(
            normalizeOrder
          );

        setOrders(
          normalizedOrders
        );
      } catch (err) {
        console.error(
          "Admin Orders API error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load orders."
        );

        setOrders([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /* =======================================================
     CLEAR SUCCESS MESSAGE
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
     UPDATE ORDER STATUS
     
     ANY STATUS → ANY STATUS
======================================================= */

  const updateOrderStatus = async (
    orderId,
    newStatus
  ) => {
    const token = getAdminToken();

    if (!token) {
      setError(
        "Admin authentication token is missing. Please login again."
      );

      return;
    }

    const numericOrderId =
      Number(orderId);

    if (
      !Number.isInteger(
        numericOrderId
      ) ||
      numericOrderId <= 0
    ) {
      setError(
        "Invalid order ID."
      );

      return;
    }

    const currentOrder =
      orders.find(
        (order) =>
          Number(order.id) ===
          numericOrderId
      );

    if (!currentOrder) {
      setError(
        "Order not found."
      );

      return;
    }

    const normalizedStatus =
      normalizeStatus(newStatus);

    if (
      !orderStatuses.some(
        (status) =>
          status.value ===
          normalizedStatus
      )
    ) {
      setError(
        "Invalid order status."
      );

      return;
    }

    const currentStatus =
      normalizeStatus(
        currentOrder.status
      );

    if (
      currentStatus ===
      normalizedStatus
    ) {
      return;
    }

    setUpdatingId(
      numericOrderId
    );

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
                numericOrderId,

              order_status:
                normalizedStatus,
            }),
          }
        );

      const result =
        await parseResponse(
          response
        );

      /* =================================================
         UPDATE UI ONLY AFTER BACKEND SUCCESS
      ================================================= */

      setOrders(
        (currentOrders) =>
          currentOrders.map(
            (order) =>
              Number(order.id) ===
              numericOrderId
                ? {
                    ...order,

                    status:
                      normalizedStatus,

                    paymentStatus:
                      result?.data
                        ?.order
                        ?.payment_status ||
                      order.paymentStatus,
                  }
                : order
          )
      );

      setSuccessMessage(
        result?.message ||
          "Order status updated successfully."
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
      setUpdatingId(null);
    }
  };

  /* =======================================================
     FILTERED ORDERS
  ======================================================= */

  const filteredOrders =
    useMemo(() => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      return orders.filter(
        (order) => {
          const orderNumber =
            String(
              order.order_number ||
                ""
            ).toLowerCase();

          const customer =
            String(
              order.customer ||
                ""
            ).toLowerCase();

          const mobile =
            String(
              order.mobile ||
                ""
            ).toLowerCase();

          const matchesSearch =
            !searchText ||
            orderNumber.includes(
              searchText
            ) ||
            customer.includes(
              searchText
            ) ||
            mobile.includes(
              searchText
            );

          const matchesStatus =
            statusFilter ===
              "All" ||
            order.status ===
              statusFilter;

          const payment =
            String(
              order.payment ||
                ""
            ).toLowerCase();

          let matchesPayment =
            true;

          if (
            paymentFilter ===
            "COD"
          ) {
            matchesPayment =
              payment === "cod";
          }

          if (
            paymentFilter ===
            "Online"
          ) {
            matchesPayment =
              payment !== "cod";
          }

          return (
            matchesSearch &&
            matchesStatus &&
            matchesPayment
          );
        }
      );
    }, [
      orders,
      search,
      statusFilter,
      paymentFilter,
    ]);

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    return {
      total: orders.length,

      processing:
        orders.filter(
          (order) =>
            order.status ===
            "processing"
        ).length,

      delivered:
        orders.filter(
          (order) =>
            order.status ===
            "delivered"
        ).length,

      pendingPayment:
        orders.filter(
          (order) =>
            order.paymentStatus ===
            "pending"
        ).length,
    };
  }, [orders]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">

        <div className="mb-6">
          <div className="h-8 w-28 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="animate-pulse">
                <div className="h-3 w-24 rounded bg-slate-200" />

                <div className="mt-3 h-7 w-12 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="animate-pulse p-6">

            <div className="h-10 rounded-xl bg-slate-200" />

            <div className="mt-6 space-y-4">
              {Array.from({
                length: 5,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-14 rounded-xl bg-slate-100"
                />
              ))}
            </div>

          </div>
        </div>

      </div>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <div className="mx-auto max-w-7xl">

      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Orders
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage customer orders, payments and delivery status.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadOrders(true)
          }
          disabled={refreshing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
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

      </div>

      {/* SUCCESS */}

      {successMessage && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">

          <i className="fa-solid fa-circle-check" />

          <span>
            {successMessage}
          </span>

        </div>
      )}

      {/* ERROR */}

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
            className="text-red-400 transition hover:text-red-600"
          >
            <i className="fa-solid fa-xmark" />
          </button>

        </div>
      )}

      {/* STATS */}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <p className="text-xs font-semibold text-slate-500">
            Total Orders
          </p>

          <p className="mt-2 font-heading text-2xl font-extrabold text-slate-900">
            {stats.total}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <p className="text-xs font-semibold text-slate-500">
            Processing
          </p>

          <p className="mt-2 font-heading text-2xl font-extrabold text-blue-600">
            {stats.processing}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <p className="text-xs font-semibold text-emerald-600">
            Delivered
          </p>

          <p className="mt-2 font-heading text-2xl font-extrabold text-emerald-600">
            {stats.delivered}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <p className="text-xs font-semibold text-slate-500">
            Pending Payment
          </p>

          <p className="mt-2 font-heading text-2xl font-extrabold text-amber-600">
            {stats.pendingPayment}
          </p>

        </div>

      </div>

      {/* FILTERS */}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="grid gap-3 md:grid-cols-[1fr_210px_190px]">

          {/* SEARCH */}

          <div className="relative">

            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

            <input
              type="text"
              placeholder="Search order ID, customer or mobile..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

          </div>

          {/* STATUS FILTER */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >

            <option value="All">
              All Order Status
            </option>

            {orderStatuses.map(
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

          {/* PAYMENT FILTER */}

          <select
            value={paymentFilter}
            onChange={(e) =>
              setPaymentFilter(
                e.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >

            <option value="All">
              All Payments
            </option>

            <option value="COD">
              COD
            </option>

            <option value="Online">
              Online
            </option>

          </select>

        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">

          <span>
            Showing{" "}
            <strong className="text-slate-700">
              {
                filteredOrders.length
              }
            </strong>{" "}
            of{" "}
            <strong className="text-slate-700">
              {orders.length}
            </strong>{" "}
            orders
          </span>

          {(search ||
            statusFilter !==
              "All" ||
            paymentFilter !==
              "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter(
                  "All"
                );
                setPaymentFilter(
                  "All"
                );
              }}
              className="font-bold text-blue-600 hover:text-blue-700"
            >
              Clear Filters
            </button>
          )}

        </div>

      </div>

      {/* ===================================================
          DESKTOP TABLE
      =================================================== */}

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px]">

            <thead className="border-b border-slate-200 bg-slate-50">

              <tr>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Order
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Items
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Amount
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Payment
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {filteredOrders.map(
                (order) => {

                  const isUpdating =
                    Number(
                      updatingId
                    ) ===
                    Number(
                      order.id
                    );

                  const availableStatuses =
                    getAvailableStatuses();

                  return (
                    <tr
                      key={
                        order.id
                      }
                      className="transition hover:bg-slate-50"
                    >

                      {/* ORDER */}

                      <td className="px-6 py-4">

                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="font-bold text-blue-600 hover:text-blue-700"
                        >
                          #{order.order_number}
                        </Link>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(
                            order.date
                          )}
                        </p>

                      </td>

                      {/* CUSTOMER */}

                      <td className="px-6 py-4">

                        <p className="font-bold text-slate-800">
                          {order.customer}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {order.mobile}
                        </p>

                        {order.email && (
                          <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                            {order.email}
                          </p>
                        )}

                      </td>

                      {/* ITEMS */}

                      <td className="px-6 py-4 text-sm text-slate-600">

                        {order.itemCount}{" "}

                        {order.itemCount ===
                        1
                          ? "item"
                          : "items"}

                      </td>

                      {/* AMOUNT */}

                      <td className="px-6 py-4 font-bold text-slate-900">

                        {formatPrice(
                          order.amount
                        )}

                      </td>

                      {/* PAYMENT */}

                      <td className="px-6 py-4">

                        <div>

                          <span className="text-sm font-semibold text-slate-700">
                            {getPaymentLabel(
                              order.payment
                            )}
                          </span>

                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${getPaymentClass(
                              order.paymentStatus
                            )}`}
                          >
                            {getPaymentStatusLabel(
                              order.paymentStatus
                            )}
                          </span>

                        </div>

                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-4">

                        <div className="flex items-center">

                          <select
                            value={
                              order.status
                            }
                            disabled={
                              isUpdating
                            }
                            onChange={(
                              e
                            ) =>
                              updateOrderStatus(
                                order.id,
                                e.target.value
                              )
                            }
                            className={`rounded-full border-0 px-3 py-2 text-xs font-bold outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${getStatusClass(
                              order.status
                            )}`}
                          >

                            {availableStatuses.map(
                              (
                                status
                              ) => (
                                <option
                                  key={
                                    status.value
                                  }
                                  value={
                                    status.value
                                  }
                                >
                                  {
                                    status.label
                                  }
                                </option>
                              )
                            )}

                          </select>

                          {isUpdating && (
                            <i className="fa-solid fa-spinner fa-spin ml-2 text-xs text-slate-400" />
                          )}

                        </div>

                      </td>

                      {/* ACTION */}

                      <td className="px-6 py-4">

                        <div className="flex justify-end">

                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            title="View Order"
                          >
                            <i className="fa-solid fa-eye text-xs" />
                          </Link>

                        </div>

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ===================================================
          MOBILE CARDS
      =================================================== */}

      <div className="grid gap-4 lg:hidden">

        {filteredOrders.map(
          (order) => {

            const isUpdating =
              Number(
                updatingId
              ) ===
              Number(
                order.id
              );

            return (
              <div
                key={
                  order.id
                }
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >

                {/* TOP */}

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="font-bold text-blue-600"
                    >
                      #{order.order_number}
                    </Link>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(
                        order.date
                      )}
                    </p>

                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(
                      order.status
                    )}
                  </span>

                </div>

                {/* CUSTOMER + AMOUNT */}

                <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-4">

                  <div>

                    <p className="text-[11px] font-semibold text-slate-400">
                      Customer
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {order.customer}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {order.mobile}
                    </p>

                  </div>

                  <div>

                    <p className="text-[11px] font-semibold text-slate-400">
                      Amount
                    </p>

                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                      {formatPrice(
                        order.amount
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {order.itemCount}{" "}
                      {order.itemCount ===
                      1
                        ? "item"
                        : "items"}
                    </p>

                  </div>

                </div>

                {/* PAYMENT */}

                <div className="mt-4">

                  <p className="text-[11px] font-semibold text-slate-400">
                    Payment
                  </p>

                  <div className="mt-1 flex items-center gap-2">

                    <span className="text-sm font-bold text-slate-700">
                      {getPaymentLabel(
                        order.payment
                      )}
                    </span>

                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold ${getPaymentClass(
                        order.paymentStatus
                      )}`}
                    >
                      {getPaymentStatusLabel(
                        order.paymentStatus
                      )}
                    </span>

                  </div>

                </div>

                {/* STATUS */}

                <div className="mt-4">

                  <p className="mb-2 text-[11px] font-semibold text-slate-400">
                    Update Order Status
                  </p>

                  <div className="flex items-center gap-2">

                    <select
                      value={
                        order.status
                      }
                      disabled={
                        isUpdating
                      }
                      onChange={(
                        e
                      ) =>
                        updateOrderStatus(
                          order.id,
                          e.target.value
                        )
                      }
                      className={`min-w-0 flex-1 rounded-xl border-0 px-3 py-3 text-xs font-bold outline-none disabled:cursor-not-allowed disabled:opacity-60 ${getStatusClass(
                        order.status
                      )}`}
                    >

                      {orderStatuses.map(
                        (
                          status
                        ) => (
                          <option
                            key={
                              status.value
                            }
                            value={
                              status.value
                            }
                          >
                            {
                              status.label
                            }
                          </option>
                        )
                      )}

                    </select>

                    {isUpdating && (
                      <i className="fa-solid fa-spinner fa-spin text-sm text-slate-400" />
                    )}

                  </div>

                </div>

                {/* VIEW */}

                <div className="mt-4 flex justify-end">

                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
                  >
                    View Order

                    <i className="fa-solid fa-arrow-right" />
                  </Link>

                </div>

              </div>
            );
          }
        )}

      </div>

      {/* EMPTY */}

      {!loading &&
        filteredOrders.length ===
          0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

            <i className="fa-solid fa-box-open text-4xl text-slate-300" />

            <h3 className="mt-4 font-heading text-lg font-extrabold text-slate-800">
              {orders.length ===
              0
                ? "No orders yet"
                : "No orders found"}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {orders.length ===
              0
                ? "Customer orders will appear here."
                : "Try changing your search or filters."}
            </p>

          </div>
        )}

    </div>
  );
}

export default Orders;