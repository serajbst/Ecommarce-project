import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const initialAreas = [
  {
    id: 1,
    name: "Simri Bakhtiyarpur",
    district: "Saharsa",
    state: "Bihar",
    pincode: "852127",
    deliveryCharge: 40,
    minOrder: 199,
    estimatedTime: "1–2 Days",
    status: "Active",
  },
  {
    id: 2,
    name: "Saharsa",
    district: "Saharsa",
    state: "Bihar",
    pincode: "852201",
    deliveryCharge: 60,
    minOrder: 299,
    estimatedTime: "2–3 Days",
    status: "Inactive",
  },
];

function DeliveryAreas() {
  const [areas, setAreas] = useState(initialAreas);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        area.name.toLowerCase().includes(searchText) ||
        area.district.toLowerCase().includes(searchText) ||
        area.pincode.includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        area.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [areas, search, statusFilter]);

  const activeAreas = areas.filter(
    (area) => area.status === "Active"
  ).length;

  const toggleStatus = (id) => {
    setAreas((items) =>
      items.map((area) =>
        area.id === id
          ? {
              ...area,
              status:
                area.status === "Active"
                  ? "Inactive"
                  : "Active",
            }
          : area
      )
    );
  };

  const deleteArea = (id) => {
    const area = areas.find((item) => item.id === id);

    if (!area) return;

    const confirmed = window.confirm(
      `Delete "${area.name}" delivery area?`
    );

    if (!confirmed) return;

    setAreas((items) =>
      items.filter((item) => item.id !== id)
    );
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Delivery Areas
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage locations where AshrafBazar provides delivery.
          </p>
        </div>

        <Link
          to="/admin/delivery-areas/add"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          <i className="fa-solid fa-plus"></i>
          Add Delivery Area
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500">
            Total Areas
          </p>

          <p className="mt-2 font-heading text-2xl font-extrabold text-slate-900">
            {areas.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500">
            Active Areas
          </p>

          <p className="mt-2 font-heading text-2xl font-extrabold text-emerald-600">
            {activeAreas}
          </p>
        </div>

        <div className="col-span-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm sm:col-span-1">
          <p className="text-xs font-bold text-blue-700">
            Primary Delivery Area
          </p>

          <p className="mt-2 font-heading text-lg font-extrabold text-blue-900">
            Simri Bakhtiyarpur
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_190px]">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search area, district or PIN..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Area
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  PIN Code
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Delivery Charge
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Minimum Order
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Delivery Time
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredAreas.map((area) => (
                <tr
                  key={area.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <i className="fa-solid fa-location-dot"></i>
                      </div>

                      <div>
                        <p className="font-bold text-slate-900">
                          {area.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {area.district}, {area.state}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-bold text-slate-700">
                      {area.pincode}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-bold text-slate-900">
                    ₹{area.deliveryCharge}
                  </td>

                  <td className="px-6 py-4 font-bold text-slate-900">
                    ₹{area.minOrder}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {area.estimatedTime}
                  </td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        toggleStatus(area.id)
                      }
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        area.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {area.status}
                    </button>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/delivery-areas/edit/${area.id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                        title="Edit"
                      >
                        <i className="fa-solid fa-pen text-xs"></i>
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          deleteArea(area.id)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
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
      <div className="grid gap-4 lg:hidden">
        {filteredAreas.map((area) => (
          <div
            key={area.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <i className="fa-solid fa-location-dot"></i>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    {area.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {area.district}, {area.state}
                  </p>

                  <p className="mt-1 font-mono text-xs text-slate-400">
                    PIN: {area.pincode}
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  area.status === "Active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {area.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 border-y border-slate-100 py-4">
              <div>
                <p className="text-[10px] font-semibold text-slate-400">
                  Delivery
                </p>

                <p className="mt-1 text-sm font-extrabold text-slate-800">
                  ₹{area.deliveryCharge}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400">
                  Min Order
                </p>

                <p className="mt-1 text-sm font-extrabold text-slate-800">
                  ₹{area.minOrder}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400">
                  Delivery
                </p>

                <p className="mt-1 text-xs font-bold text-slate-700">
                  {area.estimatedTime}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Link
                to={`/admin/delivery-areas/edit/${area.id}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
              >
                <i className="fa-solid fa-pen text-xs"></i>
              </Link>

              <button
                type="button"
                onClick={() => deleteArea(area.id)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                <i className="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAreas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <i className="fa-solid fa-location-dot text-4xl text-slate-300"></i>

          <h3 className="mt-4 font-heading text-lg font-extrabold text-slate-800">
            No delivery areas found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Try another location or status filter.
          </p>
        </div>
      )}
    </div>
  );
}

export default DeliveryAreas;