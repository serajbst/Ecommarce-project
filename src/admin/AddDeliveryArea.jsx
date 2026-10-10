import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AddDeliveryArea() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    areaName: "",
    district: "",
    state: "Bihar",
    pinCode: "",
    deliveryCharge: "",
    minOrder: "",
    estimatedTime: "",
    codAvailable: true,
    active: true,
    note: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !form.areaName ||
      !form.district ||
      !form.pinCode ||
      !form.deliveryCharge ||
      !form.minOrder ||
      !form.estimatedTime
    ) {
      alert("Please fill all required fields.");
      return;
    }

    if (!/^\d{6}$/.test(form.pinCode)) {
      alert("Please enter a valid 6-digit PIN code.");
      return;
    }

    console.log("Delivery Area:", form);

    // Backend API later
    navigate("/admin/delivery-areas");
  };

  return (
    <div className="mx-auto max-w-5xl">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Link
              to="/admin/delivery-areas"
              className="hover:text-blue-600"
            >
              Delivery Areas
            </Link>

            <i className="fa-solid fa-chevron-right text-[10px]"></i>

            <span>Add Delivery Area</span>
          </div>

          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Add Delivery Area
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Add a new location where AshrafBazar provides delivery.
          </p>
        </div>

        <Link
          to="/admin/delivery-areas"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <i className="fa-solid fa-arrow-left"></i>
          Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Location Information */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Location Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the basic delivery location details.
            </p>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">

            {/* Area */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Area / City Name <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="areaName"
                value={form.areaName}
                onChange={handleChange}
                placeholder="e.g. Simri Bakhtiyarpur"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* District */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                District <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="district"
                value={form.district}
                onChange={handleChange}
                placeholder="e.g. Saharsa"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* State */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                State <span className="text-red-500">*</span>
              </label>

              <select
                name="state"
                value={form.state}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="Bihar">Bihar</option>
                <option value="Jharkhand">Jharkhand</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
              </select>
            </div>

            {/* PIN */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                PIN Code <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="pinCode"
                value={form.pinCode}
                onChange={handleChange}
                maxLength={6}
                inputMode="numeric"
                placeholder="e.g. 852127"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Delivery Settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure delivery charges and order requirements.
            </p>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">

            {/* Delivery Charge */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Delivery Charge <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                  ₹
                </span>

                <input
                  type="number"
                  name="deliveryCharge"
                  value={form.deliveryCharge}
                  onChange={handleChange}
                  min="0"
                  placeholder="40"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Minimum Order */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Minimum Order Amount <span className="text-red-500">*</span>
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
                  placeholder="199"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Estimated Time */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Estimated Delivery Time <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="estimatedTime"
                value={form.estimatedTime}
                onChange={handleChange}
                placeholder="e.g. 1–2 Days"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* COD */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                id="codAvailable"
                name="codAvailable"
                checked={form.codAvailable}
                onChange={handleChange}
                className="h-4 w-4 accent-blue-600"
              />

              <label
                htmlFor="codAvailable"
                className="ml-3 cursor-pointer"
              >
                <span className="block text-sm font-bold text-slate-800">
                  Cash on Delivery
                </span>

                <span className="text-xs text-slate-500">
                  Allow customers to place COD orders.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Additional Settings
            </h2>
          </div>

          <div className="space-y-5 p-5 sm:p-6">

            {/* Active */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Delivery Area Status
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Active areas will be available during checkout.
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                  className="peer sr-only"
                />

                <div className="h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>

            {/* Note */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Admin Note
              </label>

              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                rows="4"
                placeholder="Internal note about this delivery area..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/admin/delivery-areas"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <i className="fa-solid fa-location-dot"></i>
            Save Delivery Area
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddDeliveryArea;