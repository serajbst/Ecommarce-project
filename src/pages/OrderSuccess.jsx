import { Link, useLocation } from "react-router-dom";

function OrderSuccess() {
  const location = useLocation();

  // Future API se ye data yahan pass kiya ja sakta hai
  const orderId =
    location.state?.orderId ||
    `AB${Date.now().toString().slice(-6)}`;

  const total =
    location.state?.total ||
    0;

  const paymentMethod =
    location.state?.paymentMethod ||
    "Cash on Delivery";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8 sm:py-12">

      <div className="mx-auto max-w-2xl">

        {/* Success Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* Success Header */}
          <div className="bg-gradient-to-b from-green-50 to-white px-5 pb-7 pt-8 text-center sm:px-8 sm:pt-10">

            {/* Icon */}
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">

              <div className="absolute inset-0 animate-ping rounded-full bg-green-200 opacity-30"></div>

              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/20">
                <i className="fa-solid fa-check text-2xl"></i>
              </div>

            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.15em] text-green-600">
              Order Confirmed
            </p>

            <h1 className="font-heading mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Thank You for Your Order!
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Your order has been placed successfully. We’ll
              prepare your order and deliver it to you soon.
            </p>

          </div>

          {/* Order Information */}
          <div className="px-5 pb-6 sm:px-8">

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">

              <div className="grid grid-cols-2 gap-4">

                {/* Order ID */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Order ID
                  </p>

                  <p className="mt-1 text-sm font-extrabold text-slate-900">
                    #{orderId}
                  </p>
                </div>

                {/* Payment */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Payment
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {paymentMethod}
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Total Amount
                  </p>

                  <p className="mt-1 text-sm font-extrabold text-slate-900">
                    ₹{total}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </p>

                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    Order Placed
                  </span>
                </div>

              </div>

            </div>

            {/* Delivery */}
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">

              <div className="flex gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <i className="fa-solid fa-truck"></i>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Local Delivery
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Your order will be delivered across
                    Simri Bakhtiyarpur. Delivery details will be
                    available in your order tracking section.
                  </p>
                </div>

              </div>

            </div>

            {/* Next Steps */}
            <div className="mt-6">

              <h2 className="text-base font-bold text-slate-900">
                What happens next?
              </h2>

              <div className="mt-4 space-y-4">

                {/* Step 1 */}
                <div className="flex gap-3">

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <i className="fa-solid fa-receipt text-xs"></i>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Order Received
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      We have received your order successfully.
                    </p>
                  </div>

                </div>

                {/* Connector */}
                <div className="ml-4 h-3 border-l border-dashed border-slate-300"></div>

                {/* Step 2 */}
                <div className="flex gap-3">

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <i className="fa-solid fa-box text-xs"></i>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Order Processing
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Our team will prepare your order.
                    </p>
                  </div>

                </div>

                {/* Connector */}
                <div className="ml-4 h-3 border-l border-dashed border-slate-300"></div>

                {/* Step 3 */}
                <div className="flex gap-3">

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <i className="fa-solid fa-truck-fast text-xs"></i>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Delivery
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Your order will be delivered to your address.
                    </p>
                  </div>

                </div>

              </div>

            </div>

            {/* Buttons */}
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">

              <Link
                to="/track-order"
                state={{ orderId }}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                <i className="fa-solid fa-location-crosshairs text-xs"></i>
                Track Order
              </Link>

              <Link
                to="/shop"
                className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              >
                <i className="fa-solid fa-bag-shopping text-xs"></i>
                Continue Shopping
              </Link>

            </div>

            {/* Support */}
            <div className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] text-slate-500">

              <i className="fa-solid fa-headset text-blue-600"></i>

              <span>
                Need help with your order? Contact AshrafChak support.
              </span>

            </div>

          </div>

        </div>

        {/* Bottom Brand */}
        <div className="mt-6 text-center">

          <Link
            to="/"
            className="font-heading text-sm font-extrabold text-slate-900"
          >
            Ashraf<span className="text-blue-600">Chak</span>
          </Link>

          <p className="mt-1 text-[10px] text-slate-400">
            Your Local Online Store
          </p>

        </div>

      </div>

    </main>
  );
}

export default OrderSuccess;