import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL =
  "http://localhost/ashrafbazar/backend/api/orders/index.php";

const BACKEND_BASE =
  "http://localhost/ashrafbazar/backend";

/* =========================================================
   IMAGE URL
========================================================= */

function getImageUrl(image) {
  if (!image) return "";

  const value = String(image).trim();

  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${BACKEND_BASE}${value}`;
  }

  return `${BACKEND_BASE}/${value}`;
}

/* =========================================================
   TOKEN
========================================================= */

function getCustomerToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("user_token") ||
    ""
  );
}

/* =========================================================
   API RESPONSE PARSER
========================================================= */

async function parseResponse(response) {
  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Server returned an invalid response.");
  }

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message || "Unable to load your orders."
    );
  }

  return data;
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =========================================================
   CURRENCY
========================================================= */

function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "₹0";
  }

  return `₹${number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

/* =========================================================
   STATUS STYLE
========================================================= */

function getStatusStyle(status) {
  const normalized = String(status || "")
    .toLowerCase()
    .replaceAll("_", " ");

  switch (normalized) {
    case "delivered":
      return {
        wrapper: "bg-emerald-50 text-emerald-700",
        icon: "fa-circle-check",
      };

    case "out for delivery":
      return {
        wrapper: "bg-blue-50 text-blue-700",
        icon: "fa-truck-fast",
      };

    case "shipped":
      return {
        wrapper: "bg-indigo-50 text-indigo-700",
        icon: "fa-truck",
      };

    case "processing":
      return {
        wrapper: "bg-orange-50 text-orange-700",
        icon: "fa-box",
      };

    case "confirmed":
      return {
        wrapper: "bg-cyan-50 text-cyan-700",
        icon: "fa-circle-check",
      };

    case "pending":
      return {
        wrapper: "bg-amber-50 text-amber-700",
        icon: "fa-clock",
      };

    case "cancelled":
      return {
        wrapper: "bg-red-50 text-red-700",
        icon: "fa-circle-xmark",
      };

    case "returned":
      return {
        wrapper: "bg-purple-50 text-purple-700",
        icon: "fa-rotate-left",
      };

    default:
      return {
        wrapper: "bg-slate-100 text-slate-600",
        icon: "fa-clock",
      };
  }
}

/* =========================================================
   STATUS LABEL
========================================================= */

function getStatusLabel(status) {
  if (!status) return "Pending";

  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/* =========================================================
   ORDER ITEM IMAGE
========================================================= */

function getItemImage(item) {
  return getImageUrl(
    item?.image ||
      item?.product_image ||
      item?.product?.image ||
      ""
  );
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

  const items = rawItems.map((item, index) => ({
    ...item,

    id:
      item?.id ||
      item?.product_id ||
      `item-${index}`,

    name:
      item?.name ||
      item?.product_name ||
      item?.product?.name ||
      "Product",

    image: getItemImage(item),

    quantity: Number(item?.quantity ?? 1),

    price: Number(
      item?.price ??
        item?.unit_price ??
        item?.product_price ??
        0
    ),
  }));

  return {
    ...order,

    id:
      order?.id ||
      order?.order_number,

    order_number:
      order?.order_number ||
      order?.id ||
      "—",

    created_at:
      order?.created_at ||
      order?.date ||
      "",

    order_status:
      order?.order_status ||
      order?.status ||
      "pending",

    payment_method:
      order?.payment_method ||
      "cod",

    payment_status:
      order?.payment_status ||
      "pending",

    total: Number(
      order?.total ??
        order?.grand_total ??
        0
    ),

    subtotal: Number(order?.subtotal ?? 0),

    delivery_charge: Number(
      order?.delivery_charge ?? 0
    ),

    discount: Number(order?.discount ?? 0),

    items,
  };
}

/* =========================================================
   TRACK BUTTON CHECK
========================================================= */

function canTrackOrder(status) {
  const normalized = String(status || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .trim();

  return ![
    "delivered",
    "cancelled",
    "returned",
  ].includes(normalized);
}

/* =========================================================
   CLOSED ORDER MESSAGE
========================================================= */

function getClosedOrderInfo(status) {
  const normalized = String(status || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .trim();

  if (normalized === "delivered") {
    return {
      text: "Order Delivered",
      icon: "fa-circle-check",
      iconClass: "text-emerald-500",
    };
  }

  if (normalized === "cancelled") {
    return {
      text: "Order Cancelled",
      icon: "fa-circle-xmark",
      iconClass: "text-red-500",
    };
  }

  if (normalized === "returned") {
    return {
      text: "Order Returned",
      icon: "fa-rotate-left",
      iconClass: "text-purple-500",
    };
  }

  return null;
}

/* =========================================================
   ORDERS
========================================================= */

function Orders() {
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  const loadOrders = useCallback(
    async (isRefresh = false) => {
      const token = getCustomerToken();

      if (!token) {
        setLoading(false);
        setOrders([]);
        setError("Please login to view your orders.");
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await parseResponse(response);

        const rawOrders = Array.isArray(
          result?.data?.orders
        )
          ? result.data.orders
          : Array.isArray(result?.data)
          ? result.data
          : [];

        const normalizedOrders =
          rawOrders.map(normalizeOrder);

        setOrders(normalizedOrders);
      } catch (err) {
        console.error("Orders API error:", err);

        setError(
          err?.message ||
            "Unable to load your orders."
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
     LOGIN CHECK
  ======================================================= */

  useEffect(() => {
    const handleAuthChange = () => {
      loadOrders();
    };

    window.addEventListener(
      "ashrafbazar-auth-change",
      handleAuthChange
    );

    return () => {
      window.removeEventListener(
        "ashrafbazar-auth-change",
        handleAuthChange
      );
    };
  }, [loadOrders]);

  /* =======================================================
     NOT LOGGED IN
  ======================================================= */

  if (
    !loading &&
    error === "Please login to view your orders."
  ) {
    return (
      <main className="min-h-screen bg-[#f7f8fc]">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                to="/account"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              >
                <i className="fa-solid fa-arrow-left text-sm" />
              </Link>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                  AshrafChak
                </p>

                <h1 className="text-xl font-extrabold text-slate-950 sm:text-2xl">
                  My Orders
                </h1>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto flex min-h-[65vh] max-w-md items-center px-4 py-10">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <i className="fa-solid fa-lock text-2xl" />
            </div>

            <h2 className="mt-5 text-xl font-extrabold text-slate-950">
              Login Required
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Please login to your AshrafChak
              account to view your orders.
            </p>

            <Link
              to="/login"
              className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <i className="fa-solid fa-right-to-bracket" />
              Login
            </Link>

            <Link
              to="/"
              className="mt-3 flex h-10 items-center justify-center text-sm font-semibold text-slate-500 transition hover:text-blue-600"
            >
              Continue Shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f7f8fc]">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">

          {/* Breadcrumb */}

          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <Link
              to="/"
              className="transition hover:text-blue-600"
            >
              Home
            </Link>

            <i className="fa-solid fa-chevron-right text-[8px]" />

            <Link
              to="/account"
              className="transition hover:text-blue-600"
            >
              Account
            </Link>

            <i className="fa-solid fa-chevron-right text-[8px]" />

            <span className="font-semibold text-slate-700">
              My Orders
            </span>
          </div>

          {/* Heading */}

          <div className="mt-1 flex items-center justify-between gap-3 sm:mt-4">

            <div className="flex items-center gap-3">
              <Link
                to="/account"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 sm:hidden"
              >
                <i className="fa-solid fa-arrow-left text-xs" />
              </Link>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600 sm:hidden">
                  AshrafChak
                </p>

                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                  My Orders
                </h1>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  View and track all your orders.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() => loadOrders(true)}
                disabled={refreshing}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-4"
                title="Refresh orders"
              >
                <i
                  className={`fa-solid fa-rotate-right text-xs ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />

                <span className="ml-2 hidden text-xs font-bold sm:inline">
                  Refresh
                </span>
              </button>

              <Link
                to="/shop"
                className="hidden h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 sm:flex"
              >
                <i className="fa-solid fa-bag-shopping text-[10px]" />
                Continue Shopping
              </Link>

            </div>
          </div>

        </div>
      </section>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (
          <div className="space-y-4">

            {Array.from({ length: 3 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="animate-pulse p-5">

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        <div className="h-10 w-10 rounded-xl bg-slate-200" />

                        <div>
                          <div className="h-2.5 w-16 rounded bg-slate-200" />

                          <div className="mt-2 h-4 w-28 rounded bg-slate-200" />
                        </div>

                      </div>

                      <div className="h-7 w-24 rounded-full bg-slate-200" />

                    </div>

                    <div className="mt-5 flex gap-3">

                      <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-200" />

                      <div className="flex-1">

                        <div className="h-4 w-2/3 rounded bg-slate-200" />

                        <div className="mt-2 h-3 w-20 rounded bg-slate-200" />

                        <div className="mt-3 h-4 w-16 rounded bg-slate-200" />

                      </div>

                    </div>

                  </div>
                </div>
              )
            )}

          </div>
        ) : error ? (

          /* =================================================
             ERROR
          ================================================= */

          <div className="rounded-2xl border border-red-100 bg-white px-5 py-12 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
              <i className="fa-solid fa-triangle-exclamation text-xl" />
            </div>

            <h2 className="mt-5 text-lg font-extrabold text-slate-900">
              Unable to Load Orders
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => loadOrders()}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <i className="fa-solid fa-rotate-right" />
              Try Again
            </button>

          </div>

        ) : orders.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================= */

          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm sm:px-10">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <i className="fa-solid fa-box-open text-3xl" />
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
              Your Orders
            </p>

            <h2 className="mt-2 text-xl font-extrabold text-slate-950 sm:text-2xl">
              No Orders Yet
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              You haven't placed any orders yet.
              Start shopping and your orders will
              appear here.
            </p>

            <Link
              to="/shop"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700"
            >
              <i className="fa-solid fa-bag-shopping" />
              Start Shopping
            </Link>

          </div>

        ) : (

          /* =================================================
             ORDERS
          ================================================= */

          <div className="space-y-4">

            {orders.map((order) => {

              const statusStyle =
                getStatusStyle(
                  order.order_status
                );

              const statusLabel =
                getStatusLabel(
                  order.order_status
                );

              const firstItem =
                order.items?.[0];

              const remainingItems =
                Math.max(
                  0,
                  (order.items?.length || 0) - 1
                );

              const paymentLabel =
                String(
                  order.payment_method || "cod"
                ).toUpperCase() === "COD"
                  ? "Cash on Delivery"
                  : String(
                      order.payment_method || ""
                    )
                      .replaceAll("_", " ")
                      .replace(
                        /\b\w/g,
                        (char) =>
                          char.toUpperCase()
                      );

              const trackable =
                canTrackOrder(
                  order.order_status
                );

              const closedInfo =
                getClosedOrderInfo(
                  order.order_status
                );

              return (
                <article
                  key={
                    order.id ||
                    order.order_number
                  }
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:border-blue-100 hover:shadow-md"
                >

                  {/* =================================================
                      ORDER HEADER
                  ================================================= */}

                  <div className="border-b border-slate-100 px-4 py-4 sm:px-5">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      {/* ORDER NUMBER */}

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <i className="fa-solid fa-box text-sm" />
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Order Number
                          </p>

                          <p className="mt-0.5 text-sm font-extrabold text-slate-900">
                            #{order.order_number}
                          </p>
                        </div>

                      </div>

                      {/* STATUS */}

                      <span
                        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${statusStyle.wrapper}`}
                      >
                        <i
                          className={`fa-solid ${statusStyle.icon} text-[9px]`}
                        />

                        {statusLabel}
                      </span>

                    </div>

                    {/* META */}

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">

                      <span className="flex items-center gap-1.5">
                        <i className="fa-regular fa-calendar text-slate-400" />

                        {formatDate(
                          order.created_at
                        )}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <i className="fa-solid fa-wallet text-slate-400" />

                        {paymentLabel}
                      </span>

                      <span className="flex items-center gap-1.5">

                        <i
                          className={`fa-solid ${
                            order.payment_status ===
                            "paid"
                              ? "fa-circle-check text-emerald-500"
                              : "fa-clock text-slate-400"
                          }`}
                        />

                        Payment:{" "}
                        {getStatusLabel(
                          order.payment_status
                        )}

                      </span>

                    </div>

                  </div>

                  {/* =================================================
                      PRODUCT
                  ================================================= */}

                  <div className="px-4 py-4 sm:px-5">

                    {firstItem ? (

                      <div className="flex gap-3">

                        {/* IMAGE */}

                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-24">

                          {firstItem.image ? (
                            <img
                              src={
                                firstItem.image
                              }
                              alt={
                                firstItem.name
                              }
                              className="h-full w-full object-cover"
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                              <i className="fa-solid fa-image text-xl" />
                            </div>
                          )}

                        </div>

                        {/* INFO */}

                        <div className="min-w-0 flex-1">

                          <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900 sm:text-base">
                            {firstItem.name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            Qty:{" "}
                            {firstItem.quantity}
                          </p>

                          <p className="mt-2 text-sm font-extrabold text-slate-900">
                            {formatPrice(
                              firstItem.price *
                                firstItem.quantity
                            )}
                          </p>

                          {remainingItems > 0 && (
                            <p className="mt-1 text-[10px] font-semibold text-blue-600">
                              +{" "}
                              {remainingItems} more{" "}
                              {remainingItems === 1
                                ? "item"
                                : "items"}
                            </p>
                          )}

                        </div>

                        {/* DESKTOP TOTAL */}

                        <div className="hidden text-right sm:block">

                          <p className="text-[10px] text-slate-400">
                            Order Total
                          </p>

                          <p className="mt-1 text-lg font-extrabold text-slate-900">
                            {formatPrice(
                              order.total
                            )}
                          </p>

                        </div>

                      </div>

                    ) : (

                      <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-400">
                          <i className="fa-solid fa-box-open" />
                        </div>

                        <p className="text-xs font-medium text-slate-500">
                          Product details are
                          unavailable for this
                          order.
                        </p>

                      </div>

                    )}

                    {/* MOBILE TOTAL */}

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 sm:hidden">

                      <span className="text-xs font-medium text-slate-500">
                        Order Total
                      </span>

                      <span className="text-base font-extrabold text-slate-900">
                        {formatPrice(
                          order.total
                        )}
                      </span>

                    </div>

                  </div>

                  {/* =================================================
                      ACTIONS
                  ================================================= */}

                  <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">

                    <div className="grid grid-cols-2 gap-2">

                      {trackable ? (

                        <Link
                          to="/track-order"
                          state={{
                            orderId:
                              order.order_number,
                          }}
                          className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white transition hover:bg-blue-700"
                        >
                          <i className="fa-solid fa-truck-fast text-[10px]" />

                          <span>
                            Track Order
                          </span>
                        </Link>

                      ) : (

                        <div className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-500">

                          {closedInfo && (
                            <i
                              className={`fa-solid ${closedInfo.icon} ${closedInfo.iconClass}`}
                            />
                          )}

                          <span>
                            {closedInfo?.text ||
                              statusLabel}
                          </span>

                        </div>

                      )}

                      <Link
                        to={`/orders/${order.id}/invoice`}
                        className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-white text-xs font-bold text-blue-600 transition hover:bg-blue-50"
                      >
                        <i className="fa-solid fa-file-invoice text-[10px]" />

                        <span>
                          View Bill
                        </span>
                      </Link>

                    </div>

                  </div>

                </article>
              );
            })}

          </div>
        )}

        {/* ===================================================
            MOBILE CONTINUE SHOPPING
        =================================================== */}

        {!loading &&
          !error &&
          orders.length > 0 && (
            <Link
              to="/shop"
              className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 sm:hidden"
            >
              <i className="fa-solid fa-bag-shopping text-xs" />
              Continue Shopping
            </Link>
          )}

      </section>

    </main>
  );
}

export default Orders;