import { useState } from "react";
import { Link } from "react-router-dom";

function RepairBookings() {
  const [bookings, setBookings] = useState([
    {
      id: "RB1001",
      customer: "Rahul Kumar",
      mobile: "9876543210",
      device: "Ceiling Fan",
      problem: "Fan not starting",
      date: "2026-09-26",
      status: "Received",
      address: "Simri Bakhtiyarpur, Saharsa",
    },
    {
      id: "RB1002",
      customer: "Amit Kumar",
      mobile: "9123456780",
      device: "LED TV",
      problem: "Display problem",
      date: "2026-09-25",
      status: "Checking",
      address: "Main Road, Simri Bakhtiyarpur",
    },
    {
      id: "RB1003",
      customer: "Mohammad Arif",
      mobile: "9988776655",
      device: "Cooler",
      problem: "Motor making noise",
      date: "2026-09-24",
      status: "Repairing",
      address: "Station Road, Simri Bakhtiyarpur",
    },
    {
      id: "RB1004",
      customer: "Pankaj Kumar",
      mobile: "9012345678",
      device: "Iron",
      problem: "Not heating",
      date: "2026-09-22",
      status: "Ready",
      address: "Saharsa Road, Simri Bakhtiyarpur",
    },
    {
      id: "RB1005",
      customer: "Ravi Kumar",
      mobile: "9090909090",
      device: "Mixer Grinder",
      problem: "Motor issue",
      date: "2026-09-20",
      status: "Delivered",
      address: "Bazar Area, Simri Bakhtiyarpur",
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const statuses = [
    "Received",
    "Checking",
    "Repairing",
    "Ready",
    "Delivered",
    "Cancelled",
  ];

  const statusClasses = {
    Received: "bg-blue-50 text-blue-700",
    Checking: "bg-amber-50 text-amber-700",
    Repairing: "bg-purple-50 text-purple-700",
    Ready: "bg-emerald-50 text-emerald-700",
    Delivered: "bg-slate-100 text-slate-700",
    Cancelled: "bg-red-50 text-red-700",
  };

  const updateStatus = (id, status) => {
    setBookings((items) =>
      items.map((booking) =>
        booking.id === id
          ? { ...booking, status }
          : booking
      )
    );
  };

  const filteredBookings = bookings.filter((booking) => {
    const query = search.toLowerCase();

    const matchesSearch =
      booking.id.toLowerCase().includes(query) ||
      booking.customer.toLowerCase().includes(query) ||
      booking.mobile.includes(query) ||
      booking.device.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" ||
      booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const receivedCount = bookings.filter(
    (item) => item.status === "Received"
  ).length;

  const repairingCount = bookings.filter(
    (item) => item.status === "Repairing"
  ).length;

  const readyCount = bookings.filter(
    (item) => item.status === "Ready"
  ).length;

  return (
    <div className="mx-auto max-w-7xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-extrabold text-slate-900">
          Repair Bookings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage customer repair requests and service status.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <i className="fa-solid fa-screwdriver-wrench"></i>
          </div>

          <p className="text-sm text-slate-500">
            Total Bookings
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {bookings.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <i className="fa-solid fa-clock"></i>
          </div>

          <p className="text-sm text-slate-500">
            New Requests
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {receivedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <i className="fa-solid fa-gears"></i>
          </div>

          <p className="text-sm text-slate-500">
            Repairing
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {repairingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <i className="fa-solid fa-circle-check"></i>
          </div>

          <p className="text-sm text-slate-500">
            Ready
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {readyCount}
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search booking, customer, mobile or device..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-500"
          >
            <option value="All">All Status</option>

            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Booking
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Device
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Problem
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Date
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900">
                      #{booking.id}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">
                      {booking.customer}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {booking.mobile}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">
                      {booking.device}
                    </p>
                  </td>

                  <td className="max-w-[220px] px-5 py-4">
                    <p className="truncate text-sm text-slate-600">
                      {booking.problem}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {booking.date}
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={booking.status}
                      onChange={(e) =>
                        updateStatus(
                          booking.id,
                          e.target.value
                        )
                      }
                      className={`rounded-full border-0 px-3 py-1.5 text-xs font-bold outline-none ${
                        statusClasses[booking.status]
                      }`}
                    >
                      {statuses.map((status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      to={`/admin/repairs/${booking.id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <i className="fa-solid fa-eye"></i>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 lg:hidden">
        {filteredBookings.map((booking) => (
          <div
            key={booking.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">

              <div>
                <p className="font-heading text-lg font-extrabold text-slate-900">
                  #{booking.id}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {booking.device}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  statusClasses[booking.status]
                }`}
              >
                {booking.status}
              </span>
            </div>

            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">

              <div>
                <p className="text-xs text-slate-500">
                  Customer
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  {booking.customer}
                </p>

                <p className="text-xs text-slate-500">
                  {booking.mobile}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Problem
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {booking.problem}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">
                    Booking Date
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {booking.date}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Location
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                    {booking.address}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">

              <select
                value={booking.status}
                onChange={(e) =>
                  updateStatus(
                    booking.id,
                    e.target.value
                  )
                }
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-blue-500"
              >
                {statuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>

              <Link
                to={`/admin/repairs/${booking.id}`}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
              >
                <i className="fa-solid fa-eye"></i>
              </Link>
            </div>
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <i className="fa-solid fa-screwdriver-wrench mb-3 text-3xl text-slate-300"></i>

            <p className="font-bold text-slate-700">
              No repair bookings found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try another search or status filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RepairBookings;