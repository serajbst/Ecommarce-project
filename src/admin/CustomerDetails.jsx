import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE =
  "http://localhost/ashrafbazar/backend/api";

const CUSTOMER_API =
  `${API_BASE}/customers/show.php`;

// =====================================================
// HELPERS
// =====================================================

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const formatMoney = (value) => {
  return `₹${toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeStatus = (value) => {
  const status = String(value || "")
    .trim()
    .toLowerCase();

  if (status === "delivered") {
    return "Delivered";
  }

  if (status === "processing") {
    return "Processing";
  }

  if (status === "confirmed") {
    return "Confirmed";
  }

  if (status === "shipped") {
    return "Shipped";
  }

  if (status === "out_for_delivery") {
    return "Out for Delivery";
  }

  if (status === "pending") {
    return "Pending";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  if (status === "returned") {
    return "Returned";
  }

  return value || "Unknown";
};

const getStatusClass = (status) => {
  const normalized = String(status || "")
    .toLowerCase()
    .replaceAll(" ", "_");

  switch (normalized) {
    case "processing":
      return "bg-blue-50 text-blue-700";

    case "confirmed":
      return "bg-cyan-50 text-cyan-700";

    case "shipped":
      return "bg-violet-50 text-violet-700";

    case "out_for_delivery":
      return "bg-indigo-50 text-indigo-700";

    case "delivered":
      return "bg-emerald-50 text-emerald-700";

    case "cancelled":
      return "bg-red-50 text-red-700";

    case "returned":
      return "bg-orange-50 text-orange-700";

    case "pending":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getPaymentMethod = (value) => {
  const method = String(value || "")
    .trim()
    .toLowerCase();

  if (!method) {
    return "—";
  }

  if (method === "cod") {
    return "COD";
  }

  if (method === "razorpay") {
    return "Razorpay";
  }

  if (method === "phonepe") {
    return "PhonePe";
  }

  if (method === "paytm") {
    return "Paytm";
  }

  return value;
};

// =====================================================
// COMPONENT
// =====================================================

function CustomerDetails() {
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // ===================================================
  // AUTH
  // ===================================================

  const getAdminToken = () => {
    return localStorage.getItem("admin_token") || "";
  };

  // ===================================================
  // READ JSON
  // ===================================================

  const readJsonResponse = async (response) => {
    const text = await response.text();

    let result = null;

    try {
      result = text ? JSON.parse(text) : null;
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

    return result;
  };

  // ===================================================
  // NORMALIZE CUSTOMER
  // ===================================================

  const normalizeCustomer = (data) => {
    const source =
      data?.customer ||
      data?.user ||
      data ||
      {};

    const addresses = Array.isArray(
      data?.addresses
    )
      ? data.addresses
      : Array.isArray(
          source?.addresses
        )
      ? source.addresses
      : [];

    const orders = Array.isArray(
      data?.orders
    )
      ? data.orders
      : Array.isArray(
          source?.orders
        )
      ? source.orders
      : [];

    const statsSource =
      data?.stats ||
      source?.stats ||
      {};

    const normalizedOrders =
      orders.map((order) => ({
        ...order,

        id:
          order?.order_number ||
          order?.order_id ||
          order?.id,

        date:
          order?.created_at ||
          order?.order_date ||
          order?.date,

        items: toNumber(
          order?.items_count ??
            order?.item_count ??
            order?.items
        ),

        amount: toNumber(
          order?.total ??
            order?.grand_total ??
            order?.amount
        ),

        payment:
          getPaymentMethod(
            order?.payment_method ||
              order?.payment
          ),

        status:
          normalizeStatus(
            order?.order_status ||
              order?.status
          ),
      }));

    // -----------------------------------------------
    // Calculate fallback stats from actual orders
    // -----------------------------------------------

    const calculatedOrders =
      normalizedOrders.length;

    const calculatedCompleted =
      normalizedOrders.filter(
        (order) =>
          String(order.status)
            .toLowerCase() ===
          "delivered"
      ).length;

    const calculatedCancelled =
      normalizedOrders.filter((order) => {
        const status = String(
          order.status
        ).toLowerCase();

        return (
          status === "cancelled" ||
          status === "returned"
        );
      }).length;

    const calculatedSpent =
      normalizedOrders.reduce(
        (total, order) =>
          total + order.amount,
        0
      );

    return {
      ...source,

      id:
        source?.id ||
        id,

      name:
        source?.name ||
        "Unknown Customer",

      mobile:
        source?.mobile ||
        "—",

      email:
        source?.email ||
        "—",

      status:
        source?.status ||
        "active",

      created_at:
        source?.created_at ||
        source?.joined_at ||
        null,

      addresses,

      orders: normalizedOrders,

      stats: {
        orders: toNumber(
          statsSource?.orders ??
            statsSource?.total_orders ??
            calculatedOrders
        ),

        completed: toNumber(
          statsSource?.completed ??
            statsSource?.completed_orders ??
            calculatedCompleted
        ),

        cancelled: toNumber(
          statsSource?.cancelled ??
            statsSource?.cancelled_orders ??
            calculatedCancelled
        ),

        spent: toNumber(
          statsSource?.spent ??
            statsSource?.total_spent ??
            calculatedSpent
        ),
      },
    };
  };

  // ===================================================
  // LOAD CUSTOMER
  // ===================================================

  const loadCustomer = useCallback(
    async (showLoader = true) => {
      if (!id) {
        setError(
          "Customer ID is missing."
        );

        setLoading(false);
        return;
      }

      const token = getAdminToken();

      if (!token) {
        setError(
          "Admin authentication token is missing. Please login again."
        );

        setLoading(false);
        setRefreshing(false);

        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const params =
          new URLSearchParams();

        params.set("id", String(id));

        const response = await fetch(
          `${CUSTOMER_API}?${params.toString()}`,
          {
            method: "GET",

            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result =
          await readJsonResponse(response);

        const data =
          result?.data || {};

        const normalized =
          normalizeCustomer(data);

        setCustomer(normalized);
      } catch (requestError) {
        console.error(
          "Customer Details API error:",
          requestError
        );

        setCustomer(null);

        setError(
          requestError?.message ||
            "Unable to load customer details."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadCustomer(true);
  }, [loadCustomer]);

  // ===================================================
  // DEFAULT ADDRESS
  // ===================================================

  const defaultAddress = useMemo(() => {
    if (!customer) {
      return null;
    }

    const addresses =
      Array.isArray(customer.addresses)
        ? customer.addresses
        : [];

    if (!addresses.length) {
      return null;
    }

    return (
      addresses.find(
        (address) =>
          Number(address?.is_default) === 1 ||
          address?.is_default === true
      ) ||
      addresses[0]
    );
  }, [customer]);

  // ===================================================
  // STATUS LABEL
  // ===================================================

  const customerStatus = customer
    ? String(customer.status || "")
        .toLowerCase()
    : "";

  const customerStatusLabel =
    customerStatus === "active"
      ? "Active"
      : customerStatus === "blocked"
      ? "Blocked"
      : customerStatus === "inactive"
      ? "Inactive"
      : customer?.status || "Unknown";

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">

        <div className="mb-6">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />

          <div className="mt-3 h-8 w-64 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[330px_1fr]">

          <div className="space-y-6">

            <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />

            <div className="h-44 animate-pulse rounded-2xl bg-white shadow-sm" />

          </div>

          <div className="space-y-6">

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-2xl bg-white shadow-sm"
                  />
                )
              )}
            </div>

            <div className="h-96 animate-pulse rounded-2xl bg-white shadow-sm" />

          </div>

        </div>
      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (error || !customer) {
    return (
      <div className="mx-auto max-w-3xl">

        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <i className="fa-solid fa-user-xmark text-2xl" />
          </div>

          <h1 className="mt-5 text-xl font-extrabold text-slate-900">
            Unable to load customer
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error ||
              "Customer details could not be found."}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">

            <button
              type="button"
              onClick={() =>
                loadCustomer(true)
              }
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <i className="fa-solid fa-rotate-right mr-2" />
              Try Again
            </button>

            <Link
              to="/admin/customers"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <i className="fa-solid fa-arrow-left mr-2" />
              Back to Customers
            </Link>

          </div>

        </div>

      </div>
    );
  }

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <div className="mx-auto max-w-7xl">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">

            <Link
              to="/admin/customers"
              className="transition hover:text-blue-600"
            >
              Customers
            </Link>

            <i className="fa-solid fa-chevron-right text-[10px]" />

            <span className="max-w-[180px] truncate">
              {customer.name}
            </span>

          </div>

          <h1 className="text-2xl font-extrabold text-slate-900">
            Customer Details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Customer ID: #{customer.id}
          </p>

        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() =>
              loadCustomer(false)
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
            to="/admin/customers"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <i className="fa-solid fa-arrow-left" />
            Back
          </Link>

        </div>

      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="grid gap-6 lg:grid-cols-[330px_1fr]">

        {/* =================================================
            LEFT COLUMN
        ================================================= */}

        <div className="space-y-6">

          {/* PROFILE */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex flex-col items-center text-center">

              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-2xl font-extrabold text-blue-600">

                {customer.name
                  .charAt(0)
                  .toUpperCase()}

              </div>

              <h2 className="mt-4 text-xl font-extrabold text-slate-900">
                {customer.name}
              </h2>

              <span
                className={`mt-2 rounded-full px-3 py-1 text-xs font-bold ${
                  customerStatus ===
                  "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : customerStatus ===
                      "blocked"
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {customerStatusLabel}
              </span>

              <p className="mt-3 text-xs text-slate-400">
                Customer since{" "}
                {formatDate(
                  customer.created_at
                )}
              </p>

            </div>

            {/* CONTACT */}

            <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">

              {/* MOBILE */}

              <div className="flex items-start gap-3">

                <i className="fa-solid fa-phone mt-1 w-4 text-slate-400" />

                <div>

                  <p className="text-xs text-slate-400">
                    Mobile
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {customer.mobile}
                  </p>

                </div>

              </div>

              {/* EMAIL */}

              <div className="flex items-start gap-3">

                <i className="fa-solid fa-envelope mt-1 w-4 text-slate-400" />

                <div className="min-w-0">

                  <p className="text-xs text-slate-400">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                    {customer.email}
                  </p>

                </div>

              </div>

              {/* JOINED */}

              <div className="flex items-start gap-3">

                <i className="fa-solid fa-calendar mt-1 w-4 text-slate-400" />

                <div>

                  <p className="text-xs text-slate-400">
                    Joined
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatDate(
                      customer.created_at
                    )}
                  </p>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              DEFAULT ADDRESS
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <h2 className="text-lg font-extrabold text-slate-900">
                Default Address
              </h2>

              <i className="fa-solid fa-location-dot text-blue-600" />

            </div>

            {defaultAddress ? (
              <div className="mt-5 flex gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <i className="fa-solid fa-house" />
                </div>

                <div className="text-sm leading-6 text-slate-600">

                  <p className="font-semibold text-slate-800">
                    {defaultAddress.name ||
                      customer.name}
                  </p>

                  {defaultAddress.mobile && (
                    <p>
                      Mobile:{" "}
                      {defaultAddress.mobile}
                    </p>
                  )}

                  <p>
                    {defaultAddress.address_line ||
                      defaultAddress.address ||
                      "—"}
                  </p>

                  <p>
                    {defaultAddress.city ||
                      "—"}
                    {defaultAddress.state
                      ? `, ${defaultAddress.state}`
                      : ""}
                  </p>

                  <p>
                    PIN -{" "}
                    {defaultAddress.pincode ||
                      defaultAddress.pin ||
                      "—"}
                  </p>

                </div>

              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-slate-50 px-4 py-6 text-center">

                <i className="fa-solid fa-location-dot text-2xl text-slate-300" />

                <p className="mt-2 text-sm font-semibold text-slate-500">
                  No address saved
                </p>

              </div>
            )}

          </section>

        </div>

        {/* =================================================
            RIGHT COLUMN
        ================================================= */}

        <div className="space-y-6">

          {/* =================================================
              STATS
          ================================================= */}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

            {/* ORDERS */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <p className="text-xs font-semibold text-slate-500">
                Total Orders
              </p>

              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {customer.stats.orders}
              </p>

            </div>

            {/* COMPLETED */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <p className="text-xs font-semibold text-slate-500">
                Completed
              </p>

              <p className="mt-2 text-2xl font-extrabold text-emerald-600">
                {customer.stats.completed}
              </p>

            </div>

            {/* CANCELLED */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <p className="text-xs font-semibold text-slate-500">
                Cancelled / Returned
              </p>

              <p className="mt-2 text-2xl font-extrabold text-red-600">
                {customer.stats.cancelled}
              </p>

            </div>

            {/* SPENT */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <p className="text-xs font-semibold text-slate-500">
                Total Spent
              </p>

              <p className="mt-2 text-xl font-extrabold text-slate-900">
                {formatMoney(
                  customer.stats.spent
                )}
              </p>

            </div>

          </div>

          {/* =================================================
              ORDER HISTORY
          ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

              <div>

                <h2 className="text-lg font-extrabold text-slate-900">
                  Order History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Recent orders placed by this customer.
                </p>

              </div>

              <Link
                to="/admin/orders"
                className="text-sm font-bold text-blue-600 transition hover:text-blue-700"
              >
                View All Orders
              </Link>

            </div>

            {/* =================================================
                NO ORDERS
            ================================================= */}

            {customer.orders.length === 0 ? (
              <div className="px-6 py-16 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                  <i className="fa-solid fa-box-open text-xl" />
                </div>

                <h3 className="mt-4 text-lg font-extrabold text-slate-800">
                  No orders yet
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  This customer has not placed any orders.
                </p>

              </div>
            ) : (
              <>
                {/* =================================================
                    DESKTOP
                ================================================= */}

                <div className="hidden overflow-x-auto lg:block">

                  <table className="w-full min-w-[760px]">

                    <thead className="border-b border-slate-100 bg-slate-50">

                      <tr>

                        <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                          Order
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                          Date
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
                          View
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {customer.orders.map(
                        (order) => (
                          <tr
                            key={order.id}
                            className="transition hover:bg-slate-50"
                          >

                            <td className="px-6 py-4">

                              <Link
                                to={`/admin/orders/${order.id}`}
                                className="font-bold text-blue-600 hover:text-blue-700"
                              >
                                #
                                {order.id}
                              </Link>

                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              {formatDate(
                                order.date
                              )}
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              {order.items}
                            </td>

                            <td className="px-6 py-4 font-bold text-slate-900">
                              {formatMoney(
                                order.amount
                              )}
                            </td>

                            <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                              {order.payment}
                            </td>

                            <td className="px-6 py-4">

                              <span
                                className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClass(
                                  order.status
                                )}`}
                              >
                                {order.status}
                              </span>

                            </td>

                            <td className="px-6 py-4 text-right">

                              <Link
                                to={`/admin/orders/${order.id}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                                title="View Order"
                              >
                                <i className="fa-solid fa-eye text-xs" />
                              </Link>

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

                {/* =================================================
                    MOBILE
                ================================================= */}

                <div className="divide-y divide-slate-100 lg:hidden">

                  {customer.orders.map(
                    (order) => (
                      <div
                        key={order.id}
                        className="p-4"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <Link
                              to={`/admin/orders/${order.id}`}
                              className="font-bold text-blue-600"
                            >
                              #{order.id}
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
                            {order.status}
                          </span>

                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">

                          <div>

                            <p className="text-xs text-slate-400">
                              Amount
                            </p>

                            <p className="mt-1 font-extrabold text-slate-900">
                              {formatMoney(
                                order.amount
                              )}
                            </p>

                          </div>

                          <div>

                            <p className="text-xs text-slate-400">
                              Items
                            </p>

                            <p className="mt-1 font-bold text-slate-700">
                              {order.items}
                            </p>

                          </div>

                          <div>

                            <p className="text-xs text-slate-400">
                              Payment
                            </p>

                            <p className="mt-1 font-bold text-slate-700">
                              {order.payment}
                            </p>

                          </div>

                          <div className="flex justify-end">

                            <Link
                              to={`/admin/orders/${order.id}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700"
                              title="View Order"
                            >
                              <i className="fa-solid fa-arrow-right text-xs" />
                            </Link>

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>
              </>
            )}

          </section>

        </div>

      </div>

    </div>
  );
}

export default CustomerDetails;