import { useState } from "react";
import { Link, useParams } from "react-router-dom";

function RepairBookingDetails() {
  const { id } = useParams();

  const [status, setStatus] = useState("Checking");

  const [form, setForm] = useState({
    repairCharge: "350",
    adminNote: "",
    customerNote:
      "Please check the motor and let me know the repair cost before starting.",
  });

  const booking = {
    id: id || "RB1002",
    customer: "Amit Kumar",
    mobile: "9123456780",
    device: "LED TV",
    problem: "Display problem",
    date: "2026-09-25",
    address: "Main Road, Simri Bakhtiyarpur, Saharsa, Bihar",
    pinCode: "852127",
  };

  const statusSteps = [
    "Received",
    "Checking",
    "Repairing",
    "Ready",
    "Delivered",
  ];

  const statusClasses = {
    Received: "bg-blue-50 text-blue-700",
    Checking: "bg-amber-50 text-amber-700",
    Repairing: "bg-purple-50 text-purple-700",
    Ready: "bg-emerald-50 text-emerald-700",
    Delivered: "bg-slate-100 text-slate-700",
  };

  const currentStep = statusSteps.indexOf(status);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    console.log("Updated Repair Booking:", {
      id,
      status,
      ...form,
    });

    alert("Repair booking updated successfully.");
  };

  return (
    <div className="mx-auto max-w-7xl">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Link
              to="/admin/repairs"
              className="hover:text-blue-600"
            >
              Repair Bookings
            </Link>

            <i className="fa-solid fa-chevron-right text-[10px]"></i>

            <span>#{booking.id}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-extrabold text-slate-900">
              Repair Booking #{booking.id}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                statusClasses[status] ||
                "bg-slate-100 text-slate-600"
              }`}
            >
              {status}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Manage customer repair details and service progress.
          </p>
        </div>

        <Link
          to="/admin/repairs"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <i className="fa-solid fa-arrow-left"></i>
          Back
        </Link>
      </div>

      {/* Status Timeline */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Repair Progress
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Update the current repair status.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[650px] items-center">
            {statusSteps.map((step, index) => {
              const completed = index <= currentStep;

              return (
                <div
                  key={step}
                  className="flex flex-1 items-center"
                >
                  <button
                    type="button"
                    onClick={() => setStatus(step)}
                    className="group flex flex-col items-center"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                        completed
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {index < currentStep ? (
                        <i className="fa-solid fa-check"></i>
                      ) : (
                        index + 1
                      )}
                    </div>

                    <span
                      className={`mt-2 whitespace-nowrap text-xs font-bold ${
                        completed
                          ? "text-blue-600"
                          : "text-slate-400"
                      }`}
                    >
                      {step}
                    </span>
                  </button>

                  {index < statusSteps.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 ${
                        index < currentStep
                          ? "bg-blue-600"
                          : "bg-slate-200"
                      }`}
                    ></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left */}
        <div className="space-y-6 lg:col-span-2">

          {/* Customer */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="font-heading text-lg font-bold text-slate-900">
                Customer Information
              </h2>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Customer Name
                </p>

                <p className="mt-1 font-bold text-slate-800">
                  {booking.customer}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Mobile Number
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <p className="font-bold text-slate-800">
                    {booking.mobile}
                  </p>

                  <a
                    href={`tel:${booking.mobile}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"
                  >
                    <i className="fa-solid fa-phone text-xs"></i>
                  </a>
                </div>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Address
                </p>

                <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                  {booking.address}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  PIN: {booking.pinCode}
                </p>
              </div>
            </div>
          </div>

          {/* Device Details */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="font-heading text-lg font-bold text-slate-900">
                Device & Problem
              </h2>
            </div>

            <div className="space-y-5 p-5 sm:p-6">

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Device
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {booking.device}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Booking Date
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {booking.date}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Reported Problem
                </p>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">
                    {booking.problem}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Customer Note
                </p>

                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm leading-6 text-amber-800">
                    {form.customerNote}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charges */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="font-heading text-lg font-bold text-slate-900">
                Repair Charges
              </h2>
            </div>

            <div className="p-5 sm:p-6">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Estimated / Final Repair Charge
              </label>

              <div className="relative max-w-sm">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                  ₹
                </span>

                <input
                  type="number"
                  name="repairCharge"
                  value={form.repairCharge}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </div>

          {/* Admin Note */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="font-heading text-lg font-bold text-slate-900">
                Admin Note
              </h2>
            </div>

            <div className="p-5 sm:p-6">
              <textarea
                name="adminNote"
                value={form.adminNote}
                onChange={handleChange}
                rows="5"
                placeholder="Add internal notes about this repair..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">

          {/* Status */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-heading text-lg font-bold text-slate-900">
                Update Status
              </h2>
            </div>

            <div className="space-y-3 p-5">
              {statusSteps.map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setStatus(step)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${
                    status === step
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                      status === step
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <i
                      className={
                        step === "Received"
                          ? "fa-solid fa-inbox"
                          : step === "Checking"
                          ? "fa-solid fa-magnifying-glass"
                          : step === "Repairing"
                          ? "fa-solid fa-screwdriver-wrench"
                          : step === "Ready"
                          ? "fa-solid fa-circle-check"
                          : "fa-solid fa-truck"
                      }
                    ></i>
                  </span>

                  {step}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setStatus("Cancelled")}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold ${
                  status === "Cancelled"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <i className="fa-solid fa-xmark"></i>
                </span>

                Cancelled
              </button>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-heading text-lg font-bold text-slate-900">
                Booking Summary
              </h2>
            </div>

            <div className="space-y-4 p-5">

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Booking ID
                </span>

                <span className="text-sm font-bold text-slate-800">
                  #{booking.id}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Device
                </span>

                <span className="text-right text-sm font-bold text-slate-800">
                  {booking.device}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Booking Date
                </span>

                <span className="text-sm font-bold text-slate-800">
                  {booking.date}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-slate-500">
                    Repair Charge
                  </span>

                  <span className="text-lg font-extrabold text-slate-900">
                    ₹{form.repairCharge || "0"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            Save Changes
          </button>

          {/* Contact */}
          <a
            href={`tel:${booking.mobile}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <i className="fa-solid fa-phone text-emerald-600"></i>
            Call Customer
          </a>
        </div>
      </div>
    </div>
  );
}

export default RepairBookingDetails;