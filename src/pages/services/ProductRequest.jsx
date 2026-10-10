import { useState } from "react";
import { Link } from "react-router-dom";

function ProductRequest() {
  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    quantity: "1",
    description: "",
    name: "",
    mobile: "",
    address: "",
    city: "Simri Bakhtiyarpur",
    pincode: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState("");

  const categories = [
    { name: "Electrical", icon: "fa-lightbulb" },
    { name: "Home & Kitchen", icon: "fa-house" },
    { name: "Electronics", icon: "fa-mobile-screen" },
    { name: "Daily Needs", icon: "fa-basket-shopping" },
    { name: "Tools", icon: "fa-screwdriver-wrench" },
    { name: "Other", icon: "fa-box" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const id = `PR${Date.now().toString().slice(-6)}`;

    setRequestId(id);
    setSubmitted(true);

    // Later:
    // API call karke product request database me save hogi.
  };

  const resetForm = () => {
    setFormData({
      productName: "",
      category: "",
      quantity: "1",
      description: "",
      name: "",
      mobile: "",
      address: "",
      city: "Simri Bakhtiyarpur",
      pincode: "",
    });

    setSubmitted(false);
    setRequestId("");
  };

  /* ================= SUCCESS ================= */

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              >
                <i className="fa-solid fa-arrow-left"></i>
              </Link>

              <div>
                <h1 className="font-heading text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Product Request
                </h1>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Request submitted successfully
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center px-4 py-10">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <i className="fa-solid fa-check text-3xl"></i>
            </div>

            <h2 className="mt-6 font-heading text-2xl font-extrabold text-slate-900">
              Request Submitted!
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              We have received your product request. Our team will check
              availability and contact you shortly.
            </p>

            <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-semibold text-slate-500">
                Request ID
              </p>

              <p className="mt-1 font-heading text-xl font-extrabold tracking-wide text-blue-600">
                {requestId}
              </p>
            </div>

            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <i className="fa-solid fa-box"></i>
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-500">
                    Requested Product
                  </p>

                  <p className="truncate text-sm font-bold text-slate-800">
                    {formData.productName}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Quantity: {formData.quantity}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="h-11 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:text-sm"
              >
                <i className="fa-solid fa-plus mr-2"></i>
                New Request
              </button>

              <Link
                to="/account"
                className="flex h-11 items-center justify-center rounded-xl bg-blue-600 px-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 sm:text-sm"
              >
                My Account
              </Link>
            </div>

            <Link
              to="/shop"
              className="mt-5 inline-block text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              Continue Shopping
              <i className="fa-solid fa-arrow-right ml-2 text-xs"></i>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ================= FORM ================= */

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </Link>

            <div>
              <h1 className="font-heading text-xl font-extrabold text-slate-900 sm:text-2xl">
                Product Request
              </h1>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Can't find a product? Tell us what you need.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT INFO */}
          <div className="space-y-5 lg:col-span-1">
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-5 text-white shadow-lg sm:p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <i className="fa-solid fa-box-open text-xl"></i>
              </div>

              <h2 className="mt-5 font-heading text-lg font-extrabold">
                Can't Find Your Product?
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Don't worry. Send us the product details and we'll check if we
                can arrange it for you.
              </p>

              <div className="mt-5 space-y-3 border-t border-white/15 pt-5">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-magnifying-glass w-4 text-center text-blue-200"></i>
                  <span className="text-xs font-semibold">
                    We check product availability
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-phone w-4 text-center text-blue-200"></i>
                  <span className="text-xs font-semibold">
                    Our team contacts you
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-truck-fast w-4 text-center text-blue-200"></i>
                  <span className="text-xs font-semibold">
                    Local delivery when available
                  </span>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="font-heading text-base font-extrabold text-slate-900">
                How It Works
              </h3>

              <div className="mt-5 space-y-5">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-extrabold text-blue-600">
                    1
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Tell Us What You Need
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Enter the product name and details.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-extrabold text-blue-600">
                    2
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      We Check Availability
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Our team checks suppliers and availability.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-extrabold text-blue-600">
                    3
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      We Contact You
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      We'll share availability and pricing with you.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <div className="flex gap-3">
                <i className="fa-solid fa-circle-info mt-0.5 text-amber-600"></i>

                <p className="text-xs leading-5 text-slate-600">
                  Product availability, price and delivery time depend on
                  supplier availability.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <h2 className="font-heading text-lg font-extrabold text-slate-900">
                  Request a Product
                </h2>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Give us as much information as possible
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-5 sm:p-6">
                {/* Product Details */}
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-extrabold text-blue-600">
                      1
                    </span>

                    <h3 className="text-sm font-extrabold text-slate-900">
                      Product Details
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Product Name */}
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        Product Name
                      </label>

                      <div className="relative">
                        <i className="fa-solid fa-box absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>

                        <input
                          type="text"
                          name="productName"
                          value={formData.productName}
                          onChange={handleChange}
                          placeholder="e.g. 20W LED Flood Light"
                          required
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        Category
                      </label>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {categories.map((category) => {
                          const active =
                            formData.category === category.name;

                          return (
                            <button
                              type="button"
                              key={category.name}
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  category: category.name,
                                }))
                              }
                              className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left transition ${
                                active
                                  ? "border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-500/10"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                              }`}
                            >
                              <i
                                className={`fa-solid ${category.icon} text-sm`}
                              ></i>

                              <span className="text-xs font-bold">
                                {category.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        Required Quantity
                      </label>

                      <div className="relative">
                        <i className="fa-solid fa-hashtag absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>

                        <input
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleChange}
                          min="1"
                          max="999"
                          required
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        Brand / Model
                      </label>

                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Optional"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>

                    {/* Additional Details */}
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        Additional Details
                      </label>

                      <textarea
                        rows="4"
                        placeholder="Tell us about the product, preferred brand, specifications, size, color, etc."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="mt-7 border-t border-slate-100 pt-6">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-extrabold text-blue-600">
                      2
                    </span>

                    <h3 className="text-sm font-extrabold text-slate-900">
                      Customer Details
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        Full Name
                      </label>

                      <div className="relative">
                        <i className="fa-regular fa-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>

                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your name"
                          required
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        Mobile Number
                      </label>

                      <div className="relative">
                        <i className="fa-solid fa-phone absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>

                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          placeholder="10 digit mobile number"
                          pattern="[0-9]{10}"
                          maxLength="10"
                          required
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="mt-7 border-t border-slate-100 pt-6">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-extrabold text-blue-600">
                      3
                    </span>

                    <h3 className="text-sm font-extrabold text-slate-900">
                      Delivery Address
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        Full Address
                      </label>

                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="3"
                        placeholder="House no., village, landmark..."
                        required
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      ></textarea>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        City
                      </label>

                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        Pincode
                      </label>

                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="6 digit pincode"
                        pattern="[0-9]{6}"
                        maxLength="6"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="mt-7 border-t border-slate-100 pt-6">
                  <div className="mb-4 flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                    <i className="fa-solid fa-circle-info mt-0.5 text-blue-600"></i>

                    <p className="text-[11px] leading-5 text-slate-500 sm:text-xs">
                      We will check the product availability and contact you
                      with the available options and pricing.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!formData.category}
                    className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-md transition ${
                      formData.category
                        ? "bg-blue-600 shadow-blue-600/20 hover:bg-blue-700"
                        : "cursor-not-allowed bg-slate-300 shadow-none"
                    }`}
                  >
                    <i className="fa-solid fa-paper-plane"></i>
                    Submit Product Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <i className="fa-solid fa-headset"></i>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Need Help?
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Contact AshrafBazar support for assistance.
                </p>
              </div>
            </div>

            <Link
              to="/contact"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              Contact Support
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ProductRequest;