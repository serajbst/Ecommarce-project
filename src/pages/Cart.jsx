import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const BACKEND_BASE = "http://localhost/ashrafbazar/backend";

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

function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0.00";
  }

  return number.toFixed(2);
}

function Cart() {
  const {
    cartItems,
    cartSubtotal,
    deliveryCharge = 0,
    cartTotal,
    updateQuantity,
    removeFromCart,
  } = useCart();

  /*
  |--------------------------------------------------------------------------
  | Empty Cart
  |--------------------------------------------------------------------------
  */

  if (!cartItems || cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-xl">

          {/* Breadcrumb 
          <div className="mb-6 flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
            <Link
              to="/"
              className="transition hover:text-blue-600"
            >
              Home
            </Link>

            <i className="fa-solid fa-chevron-right text-[8px]" />

            <span className="font-semibold text-slate-700">
              Cart
            </span>
          </div>
*/}
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <i className="fa-solid fa-cart-shopping text-3xl" />
            </div>

            <h1 className="mt-6 font-heading text-2xl font-extrabold text-slate-900">
              Your Cart is Empty
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Looks like you haven't added anything to your cart yet.
              Explore our products and find something you need.
            </p>

            <Link
              to="/shop"
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <i className="fa-solid fa-bag-shopping" />
              Continue Shopping
            </Link>

          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Cart
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-slate-50">

      {/* Page Header */}
      <section className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-7">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm">

            <Link
              to="/"
              className="transition hover:text-blue-600"
            >
              Home
            </Link>

            <i className="fa-solid fa-chevron-right text-[8px]" />

            <span className="font-semibold text-slate-700">
              Cart
            </span>

          </div>

          <div className="mt-3 flex items-end justify-between gap-3">

            <div>
              <h1 className="font-heading text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Shopping Cart
              </h1>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {cartItems.length}{" "}
                {cartItems.length === 1 ? "item" : "items"} in your cart
              </p>
            </div>

            <Link
              to="/shop"
              className="hidden items-center gap-2 text-sm font-bold text-blue-600 transition hover:text-blue-700 sm:flex"
            >
              <i className="fa-solid fa-arrow-left text-xs" />
              Continue Shopping
            </Link>

          </div>

        </div>

      </section>

      {/* Cart Content */}
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-8">

        <div className="grid gap-5 lg:grid-cols-[1fr_380px] lg:gap-7">

          {/* Products */}
          <div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              {/* Cart Header */}
              <div className="hidden border-b border-slate-200 px-5 py-4 sm:flex sm:items-center sm:justify-between">

                <h2 className="text-base font-bold text-slate-900">
                  Cart Items
                </h2>

                <span className="text-xs font-medium text-slate-500">
                  {cartItems.length}{" "}
                  {cartItems.length === 1 ? "Product" : "Products"}
                </span>

              </div>

              <div className="divide-y divide-slate-100">

                {cartItems.map((item) => {

                  const price = Number(item.price) || 0;
                  const quantity = Number(item.quantity) || 1;

                  const itemTotal =
                    price * quantity;

                  const imageUrl =
                    getImageUrl(item.image);

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5"
                    >

                      <div className="flex gap-3 sm:gap-5">

                        {/* Product Image */}
                        <Link
                          to={`/product/${item.id}`}
                          className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-28"
                        >

                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.name || "Product"}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                              <i className="fa-solid fa-image text-xl" />
                            </div>
                          )}

                        </Link>

                        {/* Product Info */}
                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                {item.category || "Product"}
                              </p>

                              <Link
                                to={`/product/${item.id}`}
                                className="mt-1 block line-clamp-2 text-sm font-bold leading-5 text-slate-900 transition hover:text-blue-600 sm:text-base"
                              >
                                {item.name}
                              </Link>

                            </div>

                            {/* Remove */}
                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(item.id)
                              }
                              aria-label={`Remove ${item.name}`}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                            >
                              <i className="fa-solid fa-trash-can text-xs" />
                            </button>

                          </div>

                          {/* Price */}
                          <div className="mt-2 flex items-center gap-2">

                            <span className="text-base font-extrabold text-slate-900">
                              ₹{formatPrice(price)}
                            </span>

                            {item.oldPrice &&
                              Number(item.oldPrice) > price && (
                                <span className="text-xs text-slate-400 line-through">
                                  ₹
                                  {formatPrice(
                                    item.oldPrice
                                  )}
                                </span>
                              )}

                          </div>

                          {/* Quantity + Total */}
                          <div className="mt-3 flex items-center justify-between gap-3">

                            {/* Quantity */}
                            <div className="flex h-9 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    Math.max(
                                      1,
                                      quantity - 1
                                    )
                                  )
                                }
                                disabled={quantity <= 1}
                                className="flex h-full w-9 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Decrease quantity"
                              >
                                <i className="fa-solid fa-minus text-[9px]" />
                              </button>

                              <span className="flex h-full min-w-9 items-center justify-center border-x border-slate-200 px-2 text-xs font-bold text-slate-900">
                                {quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    quantity + 1
                                  )
                                }
                                className="flex h-full w-9 items-center justify-center text-slate-600 transition hover:bg-slate-100"
                                aria-label="Increase quantity"
                              >
                                <i className="fa-solid fa-plus text-[9px]" />
                              </button>

                            </div>

                            {/* Item Total */}
                            <div className="text-right">

                              <p className="text-[10px] text-slate-400">
                                Item Total
                              </p>

                              <p className="text-sm font-extrabold text-slate-900">
                                ₹{formatPrice(itemTotal)}
                              </p>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>

            </div>

            {/* Delivery Info */}
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">

              <div className="flex gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <i className="fa-solid fa-truck" />
                </div>

                <div>

                  <h3 className="text-sm font-bold text-slate-900">
                    Local Delivery Available
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    We currently deliver across Simri Bakhtiyarpur.
                    Delivery availability and charges will be confirmed
                    during checkout.
                  </p>

                </div>

              </div>

            </div>

            {/* Mobile Continue Shopping */}
            <Link
              to="/shop"
              className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 sm:hidden"
            >
              <i className="fa-solid fa-arrow-left text-xs" />
              Continue Shopping
            </Link>

          </div>

          {/* Order Summary */}
          <aside className="h-fit lg:sticky lg:top-28">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex items-center justify-between">

                <h2 className="text-lg font-extrabold text-slate-900">
                  Order Summary
                </h2>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <i className="fa-solid fa-receipt text-sm" />
                </div>

              </div>

              {/* Summary */}
              <div className="mt-5 space-y-3 text-sm">

                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal</span>

                  <span className="font-semibold text-slate-900">
                    ₹{formatPrice(cartSubtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Delivery</span>

                  <span className="font-semibold text-green-600">
                    {Number(deliveryCharge) > 0
                      ? `₹${formatPrice(deliveryCharge)}`
                      : "Free"}
                  </span>
                </div>

              </div>

              {/* Free Delivery Message */}
              {Number(deliveryCharge) === 0 && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-green-50 px-3 py-3">

                  <i className="fa-solid fa-circle-check mt-0.5 text-xs text-green-600" />

                  <p className="text-xs leading-5 text-green-700">
                    Free local delivery is available for this order.
                  </p>

                </div>
              )}

              <div className="my-5 border-t border-dashed border-slate-200" />

              {/* Total */}
              <div className="flex items-end justify-between">

                <div>
                  <p className="text-xs text-slate-500">
                    Total Amount
                  </p>

                  <p className="mt-1 text-base font-bold text-slate-900">
                    Payable
                  </p>
                </div>

                <span className="text-2xl font-extrabold text-slate-900">
                  ₹
                  {formatPrice(
                    cartTotal ??
                      (
                        Number(cartSubtotal || 0) +
                        Number(deliveryCharge || 0)
                      )
                  )}
                </span>

              </div>

              {/* Checkout */}
              <Link
                to="/checkout"
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Proceed to Checkout
                <i className="fa-solid fa-arrow-right text-xs" />
              </Link>

              {/* Secure */}
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">

                <i className="fa-solid fa-shield-halved text-green-600" />

                <span>
                  Secure checkout • COD available
                </span>

              </div>

            </div>

            {/* Payment Features */}
            <div className="mt-4 grid grid-cols-3 gap-2">

              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">

                <i className="fa-solid fa-truck text-sm text-blue-600" />

                <p className="mt-1 text-[9px] font-bold text-slate-700">
                  Local Delivery
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">

                <i className="fa-solid fa-money-bill-wave text-sm text-green-600" />

                <p className="mt-1 text-[9px] font-bold text-slate-700">
                  COD
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">

                <i className="fa-solid fa-headset text-sm text-orange-500" />

                <p className="mt-1 text-[9px] font-bold text-slate-700">
                  Support
                </p>

              </div>

            </div>

          </aside>

        </div>

      </section>

    </main>
  );
}

export default Cart;