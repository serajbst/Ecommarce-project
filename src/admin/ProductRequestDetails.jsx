import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function ProductRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState({
    id: id || "PR1002",
    customer: "Amit Kumar",
    mobile: "9123456780",
    product: "12V 100Ah Battery",
    category: "Electrical",
    quantity: 1,
    budget: "₹9,000",
    date: "2026-09-25",
    status: "Checking",
    note: "Please share available brands and price.",
    supplier: "Exide",
    supplierPrice: "8200",
    quotedPrice: "8999",
    availability: "Available",
    adminNote: "Exide battery currently available with supplier.",
  });

  const [saving, setSaving] = useState(false);

  const statuses = [
    "New",
    "Checking",
    "Quoted",
    "Ordered",
    "Unavailable",
    "Cancelled",
  ];

  const availabilityOptions = [
    "Available",
    "Limited Stock",
    "On Order",
    "Unavailable",
  ];

  const handleChange = (field, value) => {
    setRequest((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    setSaving(true);

    setTimeout(() => {
      setSaving(false);
      alert("Product request updated successfully.");
    }, 500);
  };

  const markAsQuoted = () => {
    setRequest((prev) => ({
      ...prev,
      status: "Quoted",
    }));
  };

  const markAsOrdered = () => {
    setRequest((prev) => ({
      ...prev,
      status: "Ordered",
    }));
  };

  return (
    <div className="mx-auto max-w-6xl">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <Link
            to="/admin/product-requests"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
          >
            <i className="fa-solid fa-arrow-left"></i>
            Back to Product Requests
          </Link>

          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Product Request #{request.id}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review customer request and manage product availability.
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${
            request.status === "New"
              ? "bg-blue-50 text-blue-700"
              : request.status === "Checking"
              ? "bg-amber-50 text-amber-700"
              : request.status === "Quoted"
              ? "bg-purple-50 text-purple-700"
              : request.status === "Ordered"
              ? "bg-emerald-50 text-emerald-700"
              : request.status === "Unavailable"
              ? "bg-red-50 text-red-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {request.status}
        </span>

      </div>

      <form onSubmit={handleSave}>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Main */}
          <div className="space-y-6 lg:col-span-2">

            {/* Product Request */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <i className="fa-solid fa-box"></i>
                </div>

                <div>
                  <h2 className="font-heading font-extrabold text-slate-900">
                    Requested Product
                  </h2>

                  <p className="text-xs text-slate-500">
                    Product information submitted by customer
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Product Name
                  </label>

                  <input
                    type="text"
                    value={request.product}
                    onChange={(e) =>
                      handleChange("product", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category
                  </label>

                  <input
                    type="text"
                    value={request.category}
                    onChange={(e) =>
                      handleChange("category", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={request.quantity}
                    onChange={(e) =>
                      handleChange(
                        "quantity",
                        Number(e.target.value)
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Customer Budget
                  </label>

                  <input
                    type="text"
                    value={request.budget}
                    onChange={(e) =>
                      handleChange("budget", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Request Date
                  </label>

                  <input
                    type="text"
                    value={request.date}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                  />
                </div>

              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Customer Note
                </label>

                <textarea
                  rows="4"
                  value={request.note}
                  onChange={(e) =>
                    handleChange("note", e.target.value)
                  }
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

            </div>

            {/* Supplier / Quote */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <i className="fa-solid fa-truck-field"></i>
                </div>

                <div>
                  <h2 className="font-heading font-extrabold text-slate-900">
                    Supplier & Quote
                  </h2>

                  <p className="text-xs text-slate-500">
                    Supplier and customer pricing information
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Supplier
                  </label>

                  <input
                    type="text"
                    value={request.supplier}
                    onChange={(e) =>
                      handleChange("supplier", e.target.value)
                    }
                    placeholder="Supplier name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Supplier Price
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      ₹
                    </span>

                    <input
                      type="number"
                      value={request.supplierPrice}
                      onChange={(e) =>
                        handleChange(
                          "supplierPrice",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Customer Quote
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      ₹
                    </span>

                    <input
                      type="number"
                      value={request.quotedPrice}
                      onChange={(e) =>
                        handleChange(
                          "quotedPrice",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm font-semibold outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Availability
                  </label>

                  <select
                    value={request.availability}
                    onChange={(e) =>
                      handleChange(
                        "availability",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    {availabilityOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

            </div>

            {/* Admin Note */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Admin Note
              </label>

              <textarea
                rows="4"
                value={request.adminNote}
                onChange={(e) =>
                  handleChange("adminNote", e.target.value)
                }
                placeholder="Add internal note..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Customer */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <h2 className="mb-4 font-heading font-extrabold text-slate-900">
                Customer
              </h2>

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                  {request.customer.charAt(0)}
                </div>

                <div>
                  <p className="font-bold text-slate-900">
                    {request.customer}
                  </p>

                  <p className="text-sm text-slate-500">
                    {request.mobile}
                  </p>
                </div>

              </div>

              <a
                href={`tel:${request.mobile}`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <i className="fa-solid fa-phone"></i>
                Call Customer
              </a>

            </div>

            {/* Status */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <h2 className="mb-4 font-heading font-extrabold text-slate-900">
                Request Status
              </h2>

              <select
                value={request.status}
                onChange={(e) =>
                  handleChange("status", e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <div className="mt-4 space-y-3">

                <button
                  type="button"
                  onClick={markAsQuoted}
                  className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white hover:bg-purple-700"
                >
                  <i className="fa-solid fa-tag mr-2"></i>
                  Mark as Quoted
                </button>

                <button
                  type="button"
                  onClick={markAsOrdered}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <i className="fa-solid fa-check mr-2"></i>
                  Mark as Ordered
                </button>

              </div>

            </div>

            {/* Summary */}
            <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm">

              <h2 className="font-heading font-extrabold">
                Request Summary
              </h2>

              <div className="mt-5 space-y-4">

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-400">
                    Quantity
                  </span>

                  <span className="font-bold">
                    {request.quantity}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-400">
                    Customer Budget
                  </span>

                  <span className="font-bold">
                    {request.budget}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-400">
                    Supplier Price
                  </span>

                  <span className="font-bold">
                    ₹{request.supplierPrice}
                  </span>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">
                      Customer Quote
                    </span>

                    <span className="text-lg font-extrabold">
                      ₹{request.quotedPrice}
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Bottom actions */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={() =>
              navigate("/admin/product-requests")
            }
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <i className="fa-solid fa-spinner mr-2 animate-spin"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk mr-2"></i>
                Save Changes
              </>
            )}
          </button>

        </div>

      </form>
    </div>
  );
}

export default ProductRequestDetails;   