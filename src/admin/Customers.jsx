import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost/ashrafbazar/backend/api";
const CUSTOMERS_API = `${API_BASE}/customers/index.php`;

function Customers() {
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 1,
  });

  // =====================================================
  // AUTH
  // =====================================================

  const getAdminToken = () => {
    return localStorage.getItem("admin_token") || "";
  };

  // =====================================================
  // API RESPONSE HELPER
  // =====================================================

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

  // =====================================================
  // NUMBER HELPERS
  // =====================================================

  const toNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
  };

  // =====================================================
  // DATE FORMATTER
  // =====================================================

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // CUSTOMER NORMALIZER
  // =====================================================

  const normalizeCustomer = (customer) => {
    const statusValue = String(
      customer?.status || "active"
    ).toLowerCase();

    let status = "Active";

    if (
      statusValue === "inactive" ||
      statusValue === "blocked"
    ) {
      status =
        statusValue === "blocked"
          ? "Blocked"
          : "Inactive";
    }

    const orders =
      customer?.orders_count ??
      customer?.total_orders ??
      customer?.orders ??
      0;

    const spent =
      customer?.total_spent ??
      customer?.spent ??
      customer?.total_revenue ??
      0;

    const lastOrder =
      customer?.last_order_at ??
      customer?.last_order_date ??
      customer?.last_order ??
      null;

    return {
      ...customer,

      id: customer?.id,

      name:
        customer?.name ||
        "Unknown Customer",

      mobile:
        customer?.mobile ||
        "—",

      email:
        customer?.email ||
        "—",

      orders: toNumber(orders),

      spent: toNumber(spent),

      status,

      joined:
        customer?.created_at ||
        customer?.joined_at ||
        null,

      lastOrder,

      rawStatus: statusValue,
    };
  };

  // =====================================================
  // LOAD CUSTOMERS
  // =====================================================

  const loadCustomers = useCallback(
    async (showLoader = true) => {
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

        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("limit", String(limit));

        const response = await fetch(
          `${CUSTOMERS_API}?${params.toString()}`,
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

        // =================================================
        // RESPONSE DATA
        // =================================================

        const data = result?.data || {};

        const customerList = Array.isArray(
          data?.customers
        )
          ? data.customers
          : Array.isArray(data)
          ? data
          : [];

        const normalizedCustomers =
          customerList.map(normalizeCustomer);

        setCustomers(normalizedCustomers);

        // =================================================
        // PAGINATION
        // =================================================

        const apiPagination =
          data?.pagination || {};

        const total = toNumber(
          apiPagination?.total ??
            data?.total ??
            normalizedCustomers.length
        );

        const currentPage = toNumber(
          apiPagination?.page ??
            page
        );

        const currentLimit = toNumber(
          apiPagination?.limit ??
            limit
        );

        const totalPages =
          toNumber(
            apiPagination?.total_pages ??
              apiPagination?.pages
          ) ||
          Math.max(
            1,
            Math.ceil(
              total / Math.max(1, currentLimit)
            )
          );

        setPagination({
          page: currentPage,
          limit: currentLimit,
          total,
          total_pages: totalPages,
        });
      } catch (requestError) {
        console.error(
          "Customers API error:",
          requestError
        );

        setCustomers([]);

        setError(
          requestError?.message ||
            "Unable to load customers."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit]
  );

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadCustomers(true);
  }, [loadCustomers]);

  // =====================================================
  // FILTERED CUSTOMERS
  // =====================================================

  const filteredCustomers = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !searchText ||
        String(customer.name)
          .toLowerCase()
          .includes(searchText) ||
        String(customer.mobile)
          .toLowerCase()
          .includes(searchText) ||
        String(customer.email)
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        customer.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    customers,
    search,
    statusFilter,
  ]);

  // =====================================================
  // CURRENT PAGE STATS
  // =====================================================

  const totalCustomers =
    pagination.total ||
    customers.length;

  const activeCustomers =
    customers.filter(
      (customer) =>
        customer.rawStatus === "active"
    ).length;

  const inactiveCustomers =
    customers.filter(
      (customer) =>
        customer.rawStatus === "inactive"
    ).length;

  const blockedCustomers =
    customers.filter(
      (customer) =>
        customer.rawStatus === "blocked"
    ).length;

  const totalOrders =
    customers.reduce(
      (total, customer) =>
        total + customer.orders,
      0
    );

  const totalRevenue =
    customers.reduce(
      (total, customer) =>
        total + customer.spent,
      0
    );

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {
    loadCustomers(false);
  };

  // =====================================================
  // PAGE CHANGE
  // =====================================================

  const goToPage = (newPage) => {
    if (
      newPage < 1 ||
      newPage > pagination.total_pages
    ) {
      return;
    }

    setPage(newPage);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">

        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            )
          )}
        </div>

        <div className="mt-6 h-96 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="mx-auto max-w-7xl">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Customers
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage registered customers and view
            their purchase activity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i
            className={`fa-solid fa-rotate-right ${
              refreshing ? "animate-spin" : ""
            }`}
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">

          <div className="flex items-start gap-3">

            <div className="mt-0.5 text-red-600">
              <i className="fa-solid fa-circle-exclamation" />
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-sm font-bold text-red-800">
                Unable to load customers
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                loadCustomers(true)
              }
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
            >
              Retry
            </button>

          </div>
        </div>
      )}

      {/* =================================================
          STATS
      ================================================= */}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

        {/* TOTAL */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

          <div className="flex items-center justify-between">

            <p className="text-xs font-bold text-slate-500">
              Total Customers
            </p>

            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <i className="fa-solid fa-users" />
            </span>

          </div>

          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            {totalCustomers}
          </p>

        </div>

        {/* ACTIVE */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

          <div className="flex items-center justify-between">

            <p className="text-xs font-bold text-slate-500">
              Active Customers
            </p>

            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <i className="fa-solid fa-user-check" />
            </span>

          </div>

          <p className="mt-3 text-2xl font-extrabold text-emerald-600">
            {activeCustomers}
          </p>

        </div>

        {/* ORDERS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

          <div className="flex items-center justify-between">

            <p className="text-xs font-bold text-slate-500">
              Orders
            </p>

            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <i className="fa-solid fa-box" />
            </span>

          </div>

          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            {totalOrders}
          </p>

        </div>

        {/* REVENUE */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

          <div className="flex items-center justify-between">

            <p className="text-xs font-bold text-slate-500">
              Customer Revenue
            </p>

            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <i className="fa-solid fa-indian-rupee-sign" />
            </span>

          </div>

          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>

        </div>

      </div>

      {/* =================================================
          SECONDARY STATUS SUMMARY
      ================================================= */}

      <div className="mb-6 flex flex-wrap gap-2">

        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          Active: {activeCustomers}
        </span>

        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
          Inactive: {inactiveCustomers}
        </span>

        <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
          Blocked: {blockedCustomers}
        </span>

      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="grid gap-3 md:grid-cols-[1fr_190px]">

          {/* SEARCH */}

          <div className="relative">

            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search name, mobile or email..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="All">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Inactive">
              Inactive
            </option>

            <option value="Blocked">
              Blocked
            </option>
          </select>

        </div>

      </div>

      {/* =================================================
          DESKTOP TABLE
      ================================================= */}

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1050px]">

            <thead className="border-b border-slate-200 bg-slate-50">

              <tr>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Orders
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Total Spent
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Joined
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Last Order
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

              {filteredCustomers.map(
                (customer) => (
                  <tr
                    key={customer.id}
                    className="transition hover:bg-slate-50"
                  >

                    {/* CUSTOMER */}

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                          {customer.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-bold text-slate-900">
                            {customer.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {customer.mobile}
                          </p>

                          <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                            {customer.email}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* ORDERS */}

                    <td className="px-6 py-4">

                      <span className="font-bold text-slate-800">
                        {customer.orders}
                      </span>

                    </td>

                    {/* SPENT */}

                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹
                      {customer.spent.toLocaleString(
                        "en-IN"
                      )}
                    </td>

                    {/* JOINED */}

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(
                        customer.joined
                      )}
                    </td>

                    {/* LAST ORDER */}

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(
                        customer.lastOrder
                      )}
                    </td>

                    {/* STATUS */}

                    <td className="px-6 py-4">

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          customer.status ===
                          "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : customer.status ===
                              "Blocked"
                            ? "bg-red-50 text-red-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {customer.status}
                      </span>

                    </td>

                    {/* ACTION */}

                    <td className="px-6 py-4">

                      <div className="flex justify-end">

                        <Link
                          to={`/admin/customers/${customer.id}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          title="View Customer"
                        >
                          <i className="fa-solid fa-eye text-xs" />
                        </Link>

                      </div>

                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          MOBILE CARDS
      ================================================= */}

      <div className="grid gap-4 lg:hidden">

        {filteredCustomers.map(
          (customer) => (
            <div
              key={customer.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >

              {/* TOP */}

              <div className="flex items-start gap-3">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                  {customer.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex items-start justify-between gap-2">

                    <div className="min-w-0">

                      <h3 className="truncate font-bold text-slate-900">
                        {customer.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {customer.mobile}
                      </p>

                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        customer.status ===
                        "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : customer.status ===
                            "Blocked"
                          ? "bg-red-50 text-red-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {customer.status}
                    </span>

                  </div>

                  <p className="mt-1 truncate text-xs text-slate-400">
                    {customer.email}
                  </p>

                </div>

              </div>

              {/* DETAILS */}

              <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-4">

                <div>

                  <p className="text-[10px] font-semibold text-slate-400">
                    Orders
                  </p>

                  <p className="mt-1 text-sm font-extrabold text-slate-800">
                    {customer.orders}
                  </p>

                </div>

                <div>

                  <p className="text-[10px] font-semibold text-slate-400">
                    Total Spent
                  </p>

                  <p className="mt-1 text-sm font-extrabold text-slate-800">
                    ₹
                    {customer.spent.toLocaleString(
                      "en-IN"
                    )}
                  </p>

                </div>

                <div>

                  <p className="text-[10px] font-semibold text-slate-400">
                    Joined
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-700">
                    {formatDate(
                      customer.joined
                    )}
                  </p>

                </div>

                <div>

                  <p className="text-[10px] font-semibold text-slate-400">
                    Last Order
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-700">
                    {formatDate(
                      customer.lastOrder
                    )}
                  </p>

                </div>

              </div>

              {/* ACTION */}

              <Link
                to={`/admin/customers/${customer.id}`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
              >
                View Customer

                <i className="fa-solid fa-arrow-right" />
              </Link>

            </div>
          )
        )}

      </div>

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {!error &&
        filteredCustomers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

            <i className="fa-solid fa-users-slash text-4xl text-slate-300" />

            <h3 className="mt-4 text-lg font-extrabold text-slate-800">
              No customers found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try another search or status
              filter.
            </p>

          </div>
        )}

      {/* =================================================
          PAGINATION
      ================================================= */}

      {pagination.total_pages > 1 && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-slate-500">
            Page{" "}
            <span className="font-bold text-slate-800">
              {pagination.page}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-800">
              {pagination.total_pages}
            </span>
          </p>

          <div className="flex items-center gap-2">

            <button
              type="button"
              disabled={
                pagination.page <= 1
              }
              onClick={() =>
                goToPage(
                  pagination.page - 1
                )
              }
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <i className="fa-solid fa-chevron-left mr-2 text-xs" />
              Previous
            </button>

            <button
              type="button"
              disabled={
                pagination.page >=
                pagination.total_pages
              }
              onClick={() =>
                goToPage(
                  pagination.page + 1
                )
              }
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <i className="fa-solid fa-chevron-right ml-2 text-xs" />
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default Customers;