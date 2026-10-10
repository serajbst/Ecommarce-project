import { useState } from "react";
import { Link } from "react-router-dom";

function Coupons() {
  const [coupons, setCoupons] = useState([
    {
      id: 1,
      code: "WELCOME10",
      type: "Percentage",
      value: 10,
      minOrder: 499,
      maxDiscount: 100,
      expiry: "2026-12-31",
      usage: 42,
      usageLimit: 100,
      status: true,
    },
    {
      id: 2,
      code: "SAVE50",
      type: "Fixed",
      value: 50,
      minOrder: 999,
      maxDiscount: 50,
      expiry: "2026-11-30",
      usage: 18,
      usageLimit: 50,
      status: true,
    },
    {
      id: 3,
      code: "FESTIVE20",
      type: "Percentage",
      value: 20,
      minOrder: 1499,
      maxDiscount: 300,
      expiry: "2026-10-20",
      usage: 87,
      usageLimit: 100,
      status: false,
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const toggleStatus = (id) => {
    setCoupons((items) =>
      items.map((coupon) =>
        coupon.id === id
          ? { ...coupon, status: !coupon.status }
          : coupon
      )
    );
  };

  const deleteCoupon = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this coupon?"
    );

    if (!confirmDelete) return;

    setCoupons((items) => items.filter((coupon) => coupon.id !== id));
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch = coupon.code
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && coupon.status) ||
      (statusFilter === "Inactive" && !coupon.status);

    return matchesSearch && matchesStatus;
  });

  const activeCoupons = coupons.filter((coupon) => coupon.status).length;

  return (
    <div className="mx-auto max-w-7xl">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Coupons
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create and manage discount coupons for customers.
          </p>
        </div>

        <Link
          to="/admin/coupons/add"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          <i className="fa-solid fa-plus"></i>
          Add Coupon
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <i className="fa-solid fa-ticket"></i>
          </div>

          <p className="text-sm font-medium text-slate-500">
            Total Coupons
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {coupons.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <i className="fa-solid fa-circle-check"></i>
          </div>

          <p className="text-sm font-medium text-slate-500">
            Active Coupons
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {activeCoupons}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <i className="fa-solid fa-chart-line"></i>
          </div>

          <p className="text-sm font-medium text-slate-500">
            Total Uses
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {coupons.reduce((sum, coupon) => sum + coupon.usage, 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <i className="fa-solid fa-percent"></i>
          </div>

          <p className="text-sm font-medium text-slate-500">
            Discount Types
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            2
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">

          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>

            <input
              type="text"
              placeholder="Search coupon code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Coupon
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Discount
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Min. Order
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Expiry
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Usage
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50">

                  <td className="px-5 py-4">
                    <div>
                      <p className="font-bold text-slate-900">
                        {coupon.code}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Max discount ₹{coupon.maxDiscount}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-bold text-blue-600">
                      {coupon.type === "Percentage"
                        ? `${coupon.value}%`
                        : `₹${coupon.value}`}
                    </span>

                    <p className="mt-1 text-xs text-slate-500">
                      {coupon.type}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                    ₹{coupon.minOrder}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {coupon.expiry}
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-slate-800">
                      {coupon.usage} / {coupon.usageLimit}
                    </p>

                    <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width: `${Math.min(
                            (coupon.usage / coupon.usageLimit) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => toggleStatus(coupon.id)}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        coupon.status
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {coupon.status ? "Active" : "Inactive"}
                    </button>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/coupons/edit/${coupon.id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </Link>

                      <button
                        type="button"
                        onClick={() => deleteCoupon(coupon.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 lg:hidden">
        {filteredCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">

              <div>
                <p className="font-heading text-lg font-extrabold text-slate-900">
                  {coupon.code}
                </p>

                <p className="mt-1 text-sm font-bold text-blue-600">
                  {coupon.type === "Percentage"
                    ? `${coupon.value}% OFF`
                    : `₹${coupon.value} OFF`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleStatus(coupon.id)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  coupon.status
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {coupon.status ? "Active" : "Inactive"}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <div>
                <p className="text-xs text-slate-500">Min. Order</p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  ₹{coupon.minOrder}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Max Discount</p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  ₹{coupon.maxDiscount}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Expiry</p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {coupon.expiry}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Usage</p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {coupon.usage} / {coupon.usageLimit}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
              <Link
                to={`/admin/coupons/edit/${coupon.id}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700"
              >
                <i className="fa-solid fa-pen-to-square"></i>
                Edit
              </Link>

              <button
                type="button"
                onClick={() => deleteCoupon(coupon.id)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50"
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        ))}

        {filteredCoupons.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <i className="fa-solid fa-ticket mb-3 text-3xl text-slate-300"></i>

            <p className="font-bold text-slate-700">
              No coupons found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try another search or create a new coupon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Coupons;