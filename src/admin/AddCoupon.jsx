import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AddCoupon() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    code: "",
    discountType: "Percentage",
    discountValue: "",
    minOrder: "",
    maxDiscount: "",
    startDate: "",
    expiryDate: "",
    usageLimit: "",
    perCustomerLimit: "1",
    active: true,
    firstOrderOnly: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCodeChange = (e) => {
    setForm((prev) => ({
      ...prev,
      code: e.target.value.toUpperCase().replace(/\s/g, ""),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !form.code ||
      !form.discountValue ||
      !form.minOrder ||
      !form.startDate ||
      !form.expiryDate ||
      !form.usageLimit
    ) {
      alert("Please fill all required fields.");
      return;
    }

    if (Number(form.discountValue) <= 0) {
      alert("Discount value must be greater than 0.");
      return;
    }

    if (form.discountType === "Percentage" && Number(form.discountValue) > 100) {
      alert("Percentage discount cannot be greater than 100%.");
      return;
    }

    if (new Date(form.expiryDate) < new Date(form.startDate)) {
      alert("Expiry date cannot be before start date.");
      return;
    }

    console.log("New Coupon:", form);

    // Backend API will be connected later.
    navigate("/admin/coupons");
  };

  return (
    <div className="mx-auto max-w-5xl">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Link
              to="/admin/coupons"
              className="hover:text-blue-600"
            >
              Coupons
            </Link>

            <i className="fa-solid fa-chevron-right text-[10px]"></i>

            <span>Add Coupon</span>
          </div>

          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Add Coupon
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create a discount coupon for AshrafBazar customers.
          </p>
        </div>

        <Link
          to="/admin/coupons"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <i className="fa-solid fa-arrow-left"></i>
          Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic Coupon Information */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Coupon Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Set the basic coupon details.
            </p>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">

            {/* Coupon Code */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Coupon Code <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleCodeChange}
                placeholder="e.g. WELCOME10"
                maxLength={30}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold uppercase tracking-wide outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <p className="mt-2 text-xs text-slate-500">
                Customers will enter this code at checkout.
              </p>
            </div>

            {/* Discount Type */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Discount Type <span className="text-red-500">*</span>
              </label>

              <select
                name="discountType"
                value={form.discountType}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            {/* Discount Value */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Discount Value <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                  {form.discountType === "Percentage" ? "%" : "₹"}
                </span>

                <input
                  type="number"
                  name="discountValue"
                  value={form.discountValue}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder={
                    form.discountType === "Percentage" ? "10" : "50"
                  }
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Conditions */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Order Conditions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Define when this coupon can be used.
            </p>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">

            {/* Minimum Order */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Minimum Order Amount{" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                  ₹
                </span>

                <input
                  type="number"
                  name="minOrder"
                  value={form.minOrder}
                  onChange={handleChange}
                  min="0"
                  placeholder="499"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Maximum Discount */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Maximum Discount
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                  ₹
                </span>

                <input
                  type="number"
                  name="maxDiscount"
                  value={form.maxDiscount}
                  onChange={handleChange}
                  min="0"
                  placeholder="100"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Mainly useful for percentage coupons.
              </p>
            </div>

            {/* Usage Limit */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Total Usage Limit{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                name="usageLimit"
                value={form.usageLimit}
                onChange={handleChange}
                min="1"
                placeholder="100"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Customer Limit */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Usage Limit Per Customer
              </label>

              <input
                type="number"
                name="perCustomerLimit"
                value={form.perCustomerLimit}
                onChange={handleChange}
                min="1"
                placeholder="1"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
        </div>

        {/* Date Settings */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Validity
            </h2>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">

            {/* Start Date */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Start Date <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <i className="fa-regular fa-calendar absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>

                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Expiry */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Expiry Date <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <i className="fa-regular fa-calendar absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>

                <input
                  type="date"
                  name="expiryDate"
                  value={form.expiryDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Rules */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Additional Rules
            </h2>
          </div>

          <div className="space-y-4 p-5 sm:p-6">

            {/* Active */}
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Active Coupon
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Customers can use this coupon when active.
                </p>
              </div>

              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
                className="h-5 w-5 accent-blue-600"
              />
            </label>

            {/* First Order */}
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  First Order Only
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Allow this coupon only for a customer's first order.
                </p>
              </div>

              <input
                type="checkbox"
                name="firstOrderOnly"
                checked={form.firstOrderOnly}
                onChange={handleChange}
                className="h-5 w-5 accent-blue-600"
              />
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <i className="fa-solid fa-ticket"></i>
            </div>

            <div>
              <p className="text-sm font-bold text-blue-900">
                Coupon Preview
              </p>

              <p className="mt-1 text-sm text-blue-700">
                {form.code || "YOURCODE"}{" "}
                {form.discountValue
                  ? form.discountType === "Percentage"
                    ? `— ${form.discountValue}% OFF`
                    : `— ₹${form.discountValue} OFF`
                  : "— Discount"}
              </p>

              <p className="mt-1 text-xs text-blue-600">
                Minimum order: ₹{form.minOrder || "0"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/admin/coupons"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <i className="fa-solid fa-ticket"></i>
            Create Coupon
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddCoupon;