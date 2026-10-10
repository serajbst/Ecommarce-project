import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const API_URL =
  "http://localhost/ashrafbazar/backend/api/orders/index.php";

function getCustomerToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("user_token") ||
    ""
  );
}

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
      data?.message || "Unable to load order details."
    );
  }

  return data;
}

function getStatusLabel(status) {
  if (!status) return "Pending";

  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusInfo(status) {
  const normalized = String(status || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .trim();

  if (normalized === "delivered") {
    return {
      label: "Delivered",
      icon: "fa-house",
      color: "green",
    };
  }

  if (
    normalized === "out for delivery" ||
    normalized === "shipped"
  ) {
    return {
      label: getStatusLabel(status),
      icon: "fa-truck-fast",
      color: "blue",
    };
  }

  if (
    normalized === "processing" ||
    normalized === "confirmed"
  ) {
    return {
      label: getStatusLabel(status),
      icon: "fa-box",
      color: "orange",
    };
  }

  if (normalized === "cancelled") {
    return {
      label: "Cancelled",
      icon: "fa-circle-xmark",
      color: "red",
    };
  }

  if (normalized === "returned") {
    return {
      label: "Returned",
      icon: "fa-rotate-left",
      color: "purple",
    };
  }

  return {
    label: getStatusLabel(status),
    icon: "fa-clock",
    color: "amber",
  };
}

function TrackOrder() {
  const location = useLocation();
  const navigate = useNavigate();

  const orderId = location.state?.orderId || "";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError("Order information is missing.");
      return;
    }

    const loadOrder = async () => {
      const token = getCustomerToken();

      if (!token) {
        setLoading(false);
        setError("Please login to track your order.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}?page=1&limit=100`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await parseResponse(response);

        const orders = Array.isArray(result?.data?.orders)
          ? result.data.orders
          : Array.isArray(result?.data)
          ? result.data
          : [];

        const foundOrder = orders.find(
          (item) =>
            String(item?.order_number || item?.id) ===
            String(orderId)
        );

        if (!foundOrder) {
          setError("Order not found.");
          setOrder(null);
          return;
        }

        setOrder(foundOrder);
      } catch (err) {
        console.error("Track Order API error:", err);
        setError(
          err?.message || "Unable to load order details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const status = getStatusInfo(order?.order_status);

  return (
    <main className="min-h-screen bg-slate-50">

      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link
              to="/"
              className="hover:text-blue-600"
            >
              Home
            </Link>

            <i className="fa-solid fa-chevron-right text-[9px]" />

            <Link
              to="/orders"
              className="hover:text-blue-600"
            >
              My Orders
            </Link>

            <i className="fa-solid fa-chevron-right text-[9px]" />

            <span className="font-medium text-slate-700">
              Track Order
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
            Track Your Order
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Check the latest status of your AshrafChak order.
          </p>

        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

            <div className="animate-pulse">

              <div className="h-5 w-32 rounded bg-slate-200" />

              <div className="mt-3 h-8 w-48 rounded bg-slate-200" />

              <div className="mt-8 space-y-6">

                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-200" />
                  <div className="flex-1">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="mt-2 h-3 w-56 rounded bg-slate-200" />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-200" />
                  <div className="flex-1">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="mt-2 h-3 w-56 rounded bg-slate-200" />
                  </div>
                </div>

              </div>

            </div>

          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
              <i className="fa-solid fa-triangle-exclamation text-xl" />
            </div>

            <h2 className="mt-5 text-lg font-extrabold text-slate-900">
              Unable to Track Order
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <i className="fa-solid fa-arrow-left" />
              Back to My Orders
            </button>

          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            {/* Order Header */}
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Order Number
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                  #{order?.order_number || order?.id}
                </h2>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  status.color === "green"
                    ? "bg-emerald-100 text-emerald-700"
                    : status.color === "blue"
                    ? "bg-blue-100 text-blue-700"
                    : status.color === "orange"
                    ? "bg-orange-100 text-orange-700"
                    : status.color === "red"
                    ? "bg-red-100 text-red-700"
                    : status.color === "purple"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {status.label}
              </span>

            </div>

            {/* Timeline */}
            <div className="mt-8">

              {/* Received */}
              <div className="flex gap-4">

                <div className="flex flex-col items-center">

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <i className="fa-solid fa-check text-sm" />
                  </div>

                  <div className="h-12 w-px bg-green-200" />

                </div>

                <div className="pb-7">
                  <h3 className="text-sm font-bold text-slate-900">
                    Order Received
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your order has been received successfully.
                  </p>
                </div>

              </div>

              {/* Processing */}
              <div className="flex gap-4">

                <div className="flex flex-col items-center">

                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      ["processing", "confirmed", "shipped", "out for delivery", "delivered"].includes(
                        String(order?.order_status || "")
                          .toLowerCase()
                          .replaceAll("_", " ")
                      )
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <i className="fa-solid fa-box text-sm" />
                  </div>

                  <div className="h-12 w-px bg-slate-200" />

                </div>

                <div className="pb-7">
                  <h3 className="text-sm font-bold text-slate-900">
                    Processing
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your order is being prepared.
                  </p>
                </div>

              </div>

              {/* Out for Delivery */}
              <div className="flex gap-4">

                <div className="flex flex-col items-center">

                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      ["out for delivery", "delivered"].includes(
                        String(order?.order_status || "")
                          .toLowerCase()
                          .replaceAll("_", " ")
                      )
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <i className="fa-solid fa-truck text-sm" />
                  </div>

                  <div className="h-12 w-px bg-slate-200" />

                </div>

                <div className="pb-7">
                  <h3 className="text-sm font-bold text-slate-900">
                    Out for Delivery
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Your order will be dispatched soon.
                  </p>
                </div>

              </div>

              {/* Delivered */}
              <div className="flex gap-4">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <i className="fa-solid fa-house text-sm" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-500">
                    Delivered
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Your order will be marked delivered after successful delivery.
                  </p>
                </div>

              </div>

            </div>

            {/* Back */}
            <Link
              to="/orders"
              className="mt-8 flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <i className="fa-solid fa-arrow-left" />
              Back to My Orders
            </Link>

          </div>
        )}

      </section>
    </main>
  );
}

export default TrackOrder;