import { useState } from "react";
import { Link } from "react-router-dom";

function ProductRequests() {
  const [requests, setRequests] = useState([
    {
      id: "PR1001",
      customer: "Rahul Kumar",
      mobile: "9876543210",
      product: "Havells 1200mm Ceiling Fan",
      category: "Electrical",
      quantity: 1,
      budget: "₹2,500",
      date: "2026-09-26",
      status: "New",
      note: "Need white colour if available.",
    },
    {
      id: "PR1002",
      customer: "Amit Kumar",
      mobile: "9123456780",
      product: "12V 100Ah Battery",
      category: "Electrical",
      quantity: 1,
      budget: "₹9,000",
      date: "2026-09-25",
      status: "Checking",
      note: "Please share available brands and price.",
    },
    {
      id: "PR1003",
      customer: "Pankaj Kumar",
      mobile: "9012345678",
      product: "Kitchen Chimney",
      category: "Home & Kitchen",
      quantity: 1,
      budget: "₹12,000",
      date: "2026-09-24",
      status: "Quoted",
      note: "Looking for a 60cm model.",
    },
    {
      id: "PR1004",
      customer: "Mohammad Arif",
      mobile: "9988776655",
      product: "Mobile Charger Type-C",
      category: "Electronics",
      quantity: 2,
      budget: "₹1,000",
      date: "2026-09-22",
      status: "Ordered",
      note: "Need fast charging support.",
    },
    {
      id: "PR1005",
      customer: "Ravi Kumar",
      mobile: "9090909090",
      product: "LED Strip Light 5 Meter",
      category: "Electrical",
      quantity: 3,
      budget: "₹1,500",
      date: "2026-09-20",
      status: "Unavailable",
      note: "Any warm white option is acceptable.",
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const statuses = [
    "New",
    "Checking",
    "Quoted",
    "Ordered",
    "Unavailable",
    "Cancelled",
  ];

  const statusClasses = {
    New: "bg-blue-50 text-blue-700",
    Checking: "bg-amber-50 text-amber-700",
    Quoted: "bg-purple-50 text-purple-700",
    Ordered: "bg-emerald-50 text-emerald-700",
    Unavailable: "bg-red-50 text-red-700",
    Cancelled: "bg-slate-100 text-slate-600",
  };

  const updateStatus = (id, status) => {
    setRequests((items) =>
      items.map((request) =>
        request.id === id
          ? { ...request, status }
          : request
      )
    );
  };

  const deleteRequest = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product request?"
    );

    if (!confirmDelete) return;

    setRequests((items) =>
      items.filter((request) => request.id !== id)
    );
  };

  const filteredRequests = requests.filter((request) => {
    const query = search.toLowerCase();

    const matchesSearch =
      request.id.toLowerCase().includes(query) ||
      request.customer.toLowerCase().includes(query) ||
      request.mobile.includes(query) ||
      request.product.toLowerCase().includes(query) ||
      request.category.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" ||
      request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const newCount = requests.filter(
    (item) => item.status === "New"
  ).length;

  const checkingCount = requests.filter(
    (item) => item.status === "Checking"
  ).length;

  const quotedCount = requests.filter(
    (item) => item.status === "Quoted"
  ).length;

  const orderedCount = requests.filter(
    (item) => item.status === "Ordered"
  ).length;

  return (
    <div className="mx-auto max-w-7xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-extrabold text-slate-900">
          Product Requests
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage products requested by customers that are not currently listed.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <i className="fa-solid fa-list"></i>
          </div>

          <p className="text-sm text-slate-500">
            New Requests
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {newCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <i className="fa-solid fa-magnifying-glass"></i>
          </div>

          <p className="text-sm text-slate-500">
            Checking
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {checkingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <i className="fa-solid fa-tag"></i>
          </div>

          <p className="text-sm text-slate-500">
            Quoted
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {quotedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <i className="fa-solid fa-cart-shopping"></i>
          </div>

          <p className="text-sm text-slate-500">
            Ordered
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {orderedCount}
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
              placeholder="Search request, customer, mobile or product..."
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

      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left">

            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Request
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Product
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Qty / Budget
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Date
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

              {filteredRequests.map((request) => (
                <tr
                  key={request.id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900">
                      #{request.id}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {request.category}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">
                      {request.customer}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {request.mobile}
                    </p>
                  </td>

                  <td className="max-w-[300px] px-5 py-4">
                    <p className="font-semibold text-slate-800">
                      {request.product}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {request.note}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-slate-800">
                      {request.quantity} item
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Budget: {request.budget}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {request.date}
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={request.status}
                      onChange={(e) =>
                        updateStatus(
                          request.id,
                          e.target.value
                        )
                      }
                      className={`rounded-full border-0 px-3 py-1.5 text-xs font-bold outline-none ${
                        statusClasses[request.status]
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

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">

                      <Link
                        to={`/admin/product-requests/${request.id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          deleteRequest(request.id)
                        }
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

      {/* Mobile */}
      <div className="space-y-4 lg:hidden">

        {filteredRequests.map((request) => (
          <div
            key={request.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >

            <div className="flex items-start justify-between gap-3">

              <div>
                <p className="font-heading text-lg font-extrabold text-slate-900">
                  #{request.id}
                </p>

                <p className="mt-1 text-sm font-bold text-slate-700">
                  {request.product}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  statusClasses[request.status]
                }`}
              >
                {request.status}
              </span>

            </div>

            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">

              <div>
                <p className="text-xs text-slate-500">
                  Customer
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  {request.customer}
                </p>

                <p className="text-xs text-slate-500">
                  {request.mobile}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Category
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {request.category}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Customer Note
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {request.note}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <p className="text-xs text-slate-500">
                    Quantity
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {request.quantity}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Budget
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {request.budget}
                  </p>
                </div>

              </div>
            </div>

            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">

              <select
                value={request.status}
                onChange={(e) =>
                  updateStatus(
                    request.id,
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
                to={`/admin/product-requests/${request.id}`}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
              >
                <i className="fa-solid fa-eye"></i>
              </Link>

              <button
                type="button"
                onClick={() =>
                  deleteRequest(request.id)
                }
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50"
              >
                <i className="fa-solid fa-trash"></i>
              </button>

            </div>
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <i className="fa-solid fa-box-open mb-3 text-3xl text-slate-300"></i>

            <p className="font-bold text-slate-700">
              No product requests found
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

export default ProductRequests;