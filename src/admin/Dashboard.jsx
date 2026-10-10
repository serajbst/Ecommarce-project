import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/* =========================================================
   API
========================================================= */

const API_BASE =
  "http://localhost/ashrafbazar/backend/api";

const STATS_API =
  `${API_BASE}/dashboard/stats.php`;

const ORDERS_API =
  `${API_BASE}/orders/index.php`;

/* =========================================================
   TOKEN
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
   API RESPONSE
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
        `Request failed with status ${response.status}.`
    );
  }

  return data;
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
   STATUS
========================================================= */

function normalizeStatus(status) {
  return String(status || "")
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_")
    .trim();
}

function getStatusStyle(status) {
  const normalized = normalizeStatus(status);

  const styles = {
    pending: {
      wrapper: "bg-amber-100 text-amber-700",
      icon: "fa-clock",
    },

    confirmed: {
      wrapper: "bg-cyan-100 text-cyan-700",
      icon: "fa-circle-check",
    },

    processing: {
      wrapper: "bg-orange-100 text-orange-700",
      icon: "fa-box",
    },

    shipped: {
      wrapper: "bg-indigo-100 text-indigo-700",
      icon: "fa-truck",
    },

    out_for_delivery: {
      wrapper: "bg-blue-100 text-blue-700",
      icon: "fa-truck-fast",
    },

    delivered: {
      wrapper: "bg-green-100 text-green-700",
      icon: "fa-circle-check",
    },

    cancelled: {
      wrapper: "bg-red-100 text-red-700",
      icon: "fa-circle-xmark",
    },

    returned: {
      wrapper: "bg-purple-100 text-purple-700",
      icon: "fa-rotate-left",
    },
  };

  return (
    styles[normalized] || {
      wrapper: "bg-slate-100 text-slate-700",
      icon: "fa-circle-info",
    }
  );
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

  return labels[normalized] || "Unknown";
}

/* =========================================================
   NORMALIZE ORDERS
========================================================= */

function normalizeOrder(order) {
  return {
    id: order?.id ?? null,

    orderNumber:
      order?.order_number ||
      order?.orderNumber ||
      (order?.id
        ? `#AB${order.id}`
        : "—"),

    customer:
      order?.customer_name ||
      order?.name ||
      order?.customer ||
      "Customer",

    amount:
      order?.total ??
      order?.grand_total ??
      order?.amount ??
      0,

    status:
      order?.order_status ||
      order?.status ||
      "pending",

    createdAt:
      order?.created_at ||
      order?.createdAt ||
      null,
  };
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    orders: 0,
    customers: 0,
    products: 0,
  });

  const [recentOrders, setRecentOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = async (
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const token = getAdminToken();

      if (!token) {
        throw new Error(
          "Admin authentication token not found. Please login again."
        );
      }

      /* ---------------------------------------------------
         Stats
      --------------------------------------------------- */

      const statsResponse =
        await fetch(STATS_API, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

      const statsResult =
        await parseResponse(
          statsResponse
        );

      /* ---------------------------------------------------
         Orders
      --------------------------------------------------- */

      const ordersResponse =
        await fetch(
          `${ORDERS_API}?page=1&limit=5`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

      const ordersResult =
        await parseResponse(
          ordersResponse
        );

      /* ---------------------------------------------------
         Stats Normalization
      --------------------------------------------------- */

      const rawStats =
        statsResult?.data?.stats ||
        statsResult?.data ||
        {};

      setStats({
        totalSales:
          rawStats?.total_sales ??
          rawStats?.sales ??
          rawStats?.totalSales ??
          0,

        orders:
          rawStats?.orders ??
          rawStats?.total_orders ??
          rawStats?.totalOrders ??
          0,

        customers:
          rawStats?.customers ??
          rawStats?.total_customers ??
          rawStats?.totalCustomers ??
          0,

        products:
          rawStats?.products ??
          rawStats?.total_products ??
          rawStats?.totalProducts ??
          0,
      });

      /* ---------------------------------------------------
         Orders Normalization
      --------------------------------------------------- */

      const rawOrders =
        Array.isArray(
          ordersResult?.data?.orders
        )
          ? ordersResult.data.orders
          : Array.isArray(
                ordersResult?.data
              )
            ? ordersResult.data
            : [];

      const normalizedOrders =
        rawOrders
          .map(normalizeOrder)
          .slice(0, 5);

      setRecentOrders(
        normalizedOrders
      );
    } catch (err) {
      console.error(
        "Dashboard API Error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadDashboard(true);
  }, []);

  /* =======================================================
     STATS CARDS
  ======================================================= */

  const statCards = [
    {
      title: "Total Sales",
      value: formatPrice(
        stats.totalSales
      ),
      icon: "fa-indian-rupee-sign",
      note: "This month",
    },

    {
      title: "Orders",
      value: Number(
        stats.orders || 0
      ).toLocaleString("en-IN"),
      icon: "fa-cart-shopping",
      note: "This month",
    },

    {
      title: "Customers",
      value: Number(
        stats.customers || 0
      ).toLocaleString("en-IN"),
      icon: "fa-users",
      note: "Registered",
    },

    {
      title: "Products",
      value: Number(
        stats.products || 0
      ).toLocaleString("en-IN"),
      icon: "fa-box",
      note: "In catalog",
    },
  ];

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div>
        <div className="mb-7">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="animate-pulse">
                <div className="h-4 w-24 rounded bg-slate-200" />

                <div className="mt-4 h-8 w-28 rounded bg-slate-200" />

                <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="animate-pulse">
            <div className="h-5 w-36 rounded bg-slate-200" />

            <div className="mt-2 h-3 w-52 rounded bg-slate-100" />

            <div className="mt-6 h-10 rounded bg-slate-100" />

            <div className="mt-3 h-14 rounded bg-slate-100" />

            <div className="mt-3 h-14 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <div>

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Overview of your AshrafBazar store.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadDashboard(false)
          }
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i
            className={`fa-solid ${
              refreshing
                ? "fa-spinner fa-spin"
                : "fa-rotate"
            }`}
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-3">
            <i className="fa-solid fa-circle-exclamation mt-0.5" />

            <div>
              <p className="text-sm font-bold">
                Dashboard data could not be loaded
              </p>

              <p className="mt-1 text-xs text-red-600">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              loadDashboard(true)
            }
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
          >
            Try Again
          </button>

        </div>
      )}

      {/* ===================================================
          STATS
      =================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  {stat.title}
                </p>

                <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                  {stat.value}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {stat.note}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <i
                  className={`fa-solid ${stat.icon}`}
                />
              </div>

            </div>

          </div>
        ))}

      </div>

      {/* ===================================================
          RECENT ORDERS
      =================================================== */}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="font-bold text-slate-900">
              Recent Orders
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Latest customer orders
            </p>
          </div>

          <Link
            to="/admin/orders"
            className="self-start text-sm font-bold text-blue-600 transition hover:text-blue-700"
          >
            View All
          </Link>

        </div>

        <div className="overflow-x-auto">

          {recentOrders.length === 0 ? (
            <div className="px-5 py-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <i className="fa-solid fa-cart-shopping text-xl" />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-900">
                No orders yet
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                New customer orders will appear here.
              </p>

            </div>
          ) : (
            <table className="w-full min-w-[700px] text-left text-sm">

              <thead className="bg-slate-50 text-xs uppercase text-slate-500">

                <tr>

                  <th className="px-5 py-3 font-semibold">
                    Order
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Customer
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Amount
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Status
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Date
                  </th>

                  <th className="px-5 py-3 font-semibold text-right">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {recentOrders.map(
                  (order) => {
                    const statusStyle =
                      getStatusStyle(
                        order.status
                      );

                    return (
                      <tr
                        key={
                          order.id ||
                          order.orderNumber
                        }
                        className="transition hover:bg-slate-50"
                      >

                        <td className="px-5 py-4">

                          <Link
                            to={`/admin/orders/${
                              order.id
                            }`}
                            className="font-bold text-slate-900 hover:text-blue-600"
                          >
                            {order.orderNumber}
                          </Link>

                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {order.customer}
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {formatPrice(
                            order.amount
                          )}
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusStyle.wrapper}`}
                          >

                            <i
                              className={`fa-solid ${statusStyle.icon}`}
                            />

                            {getStatusLabel(
                              order.status
                            )}

                          </span>

                        </td>

                        <td className="px-5 py-4 text-xs text-slate-500">
                          {formatDate(
                            order.createdAt
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">

                          <Link
                            to={`/admin/orders/${
                              order.id
                            }`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                            title="View Order"
                          >
                            <i className="fa-solid fa-eye" />
                          </Link>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>
          )}

        </div>

      </div>

    </div>
  );
}

export default Dashboard;