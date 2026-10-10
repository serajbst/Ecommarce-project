import { useEffect, useMemo, useState } from "react";

const API_BASE =
  "http://localhost/ashrafbazar/backend/api/services";

const emptyForm = {
  name: "",
  description: "",
  phone: "",
  whatsapp: "",
  image: null,
  active: true,
};

/*
|--------------------------------------------------------------------------
| Admin Token
|--------------------------------------------------------------------------
*/

function getAdminToken() {
  const keys = [
    "admin_token",
    "token",
    "auth_token",
    "user_token",
  ];

  for (const key of keys) {
    const value = localStorage.getItem(key);

    if (value && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| Image URL
|--------------------------------------------------------------------------
*/

function getImageUrl(image) {
  if (!image) {
    return "";
  }

  const value = String(image).trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  if (value.startsWith("/")) {
    return `http://localhost/ashrafbazar/backend${value}`;
  }

  if (value.startsWith("uploads/")) {
    return `http://localhost/ashrafbazar/backend/${value}`;
  }

  return `http://localhost/ashrafbazar/backend/${value}`;
}

/*
|--------------------------------------------------------------------------
| Safe API Response
|--------------------------------------------------------------------------
*/

async function parseApiResponse(response) {
  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Raw server response:", text);

    throw new Error(
      `Server returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message ||
        `Request failed with status ${response.status}.`
    );
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| Authentication Error
|--------------------------------------------------------------------------
*/

function isAuthenticationError(message = "") {
  const value = String(message).toLowerCase();

  return (
    value.includes("authentication token") ||
    value.includes("token is required") ||
    value.includes("token is missing") ||
    value.includes("unauthorized") ||
    value.includes("authentication required")
  );
}

/*
|--------------------------------------------------------------------------
| Service Requests / Service Management
|--------------------------------------------------------------------------
*/

function ServiceRequests() {
  const [services, setServices] = useState([]);

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [form, setForm] = useState(emptyForm);

  const [imagePreview, setImagePreview] =
    useState("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [actionId, setActionId] =
    useState(null);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Services
  |--------------------------------------------------------------------------
  */

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAdminToken();

      if (!token) {
        throw new Error(
          "Authentication token is missing. Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE}/index.php`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result =
        await parseApiResponse(response);

      let serviceList = [];

      if (Array.isArray(result.data)) {
        serviceList = result.data;
      } else if (
        Array.isArray(result.data?.services)
      ) {
        serviceList = result.data.services;
      }

      setServices(serviceList);
    } catch (err) {
      console.error(
        "Load services error:",
        err
      );

      setServices([]);

      const message =
        err?.message ||
        "Unable to load services.";

      setError(message);

      /*
      |--------------------------------------------------------------------------
      | Authentication failed
      |--------------------------------------------------------------------------
      */

      if (isAuthenticationError(message)) {
        console.warn(
          "Authentication failed. Please login again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchServices();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const activeCount = services.filter(
    (service) =>
      Number(service.is_active) === 1
  ).length;

  const inactiveCount =
    services.length - activeCount;

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const filteredServices = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return services;
    }

    return services.filter((service) => {
      return (
        String(service.name || "")
          .toLowerCase()
          .includes(query) ||
        String(service.description || "")
          .toLowerCase()
          .includes(query) ||
        String(service.phone || "")
          .includes(query) ||
        String(service.whatsapp || "")
          .includes(query)
      );
    });
  }, [services, search]);

  /*
  |--------------------------------------------------------------------------
  | Input Change
  |--------------------------------------------------------------------------
  */

  const handleInputChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Image Select
  |--------------------------------------------------------------------------
  */

  const handleImageChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      setForm((previous) => ({
        ...previous,
        image: null,
      }));

      setImagePreview("");

      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Only JPG, PNG and WEBP images are allowed."
      );

      event.target.value = "";

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(
        "Image size cannot exceed 5 MB."
      );

      event.target.value = "";

      return;
    }

    setForm((previous) => ({
      ...previous,
      image: file,
    }));

    const preview =
      URL.createObjectURL(file);

    setImagePreview(preview);
  };

  /*
  |--------------------------------------------------------------------------
  | Add Service
  |--------------------------------------------------------------------------
  */

  const handleAddService = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const name =
      form.name.trim();

    const description =
      form.description.trim();

    const phone =
      form.phone.replace(/\D/g, "");

    const whatsapp =
      form.whatsapp.replace(/\D/g, "");

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    if (!name) {
      alert(
        "Service name is required."
      );

      return;
    }

    if (name.length > 150) {
      alert(
        "Service name cannot exceed 150 characters."
      );

      return;
    }

    if (!description) {
      alert(
        "Service description is required."
      );

      return;
    }

    if (description.length > 5000) {
      alert(
        "Service description is too long."
      );

      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      alert(
        "Please enter a valid 10 digit contact number."
      );

      return;
    }

    if (!/^[0-9]{10}$/.test(whatsapp)) {
      alert(
        "Please enter a valid 10 digit WhatsApp number."
      );

      return;
    }

    if (!form.image) {
      alert(
        "Please select a service image."
      );

      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const token = getAdminToken();

      if (!token) {
        throw new Error(
          "Authentication token is missing. Please login again."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | FormData
      |--------------------------------------------------------------------------
      */

      const formData =
        new FormData();

      formData.append(
        "name",
        name
      );

      formData.append(
        "description",
        description
      );

      formData.append(
        "phone",
        phone
      );

      formData.append(
        "whatsapp",
        whatsapp
      );

      formData.append(
        "is_active",
        form.active ? "1" : "0"
      );

      formData.append(
        "image",
        form.image
      );

      /*
      |--------------------------------------------------------------------------
      | API
      |--------------------------------------------------------------------------
      */

      const response =
        await fetch(
          `${API_BASE}/create.php`,
          {
            method: "POST",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            /*
            IMPORTANT:
            Content-Type manually set nahi karna.
            Browser multipart boundary khud set karega.
            */

            body: formData,
          }
        );

      const result =
        await parseApiResponse(
          response
        );

      /*
      |--------------------------------------------------------------------------
      | Add New Service
      |--------------------------------------------------------------------------
      */

      if (result.data) {
        setServices(
          (previous) => [
            result.data,
            ...previous,
          ]
        );
      } else {
        await fetchServices();
      }

      /*
      |--------------------------------------------------------------------------
      | Reset
      |--------------------------------------------------------------------------
      */

      setForm({
        ...emptyForm,
      });

      setImagePreview("");

      setShowAddModal(false);
    } catch (err) {
      console.error(
        "Add service error:",
        err
      );

      alert(
        err?.message ||
          "Unable to add service."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Service
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (id) => {
    const service =
      services.find(
        (item) =>
          Number(item.id) ===
          Number(id)
      );

    if (!service) {
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${service.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(id);
      setError("");

      const token =
        getAdminToken();

      if (!token) {
        throw new Error(
          "Authentication token is missing. Please login again."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |--------------------------------------------------------------------------
      | Backend delete.php expects:
      |
      | DELETE /delete.php?id=123
      |
      | Therefore ID query string me bhejna hai.
      |--------------------------------------------------------------------------
      */

      const response =
        await fetch(
          `${API_BASE}/delete.php?id=${encodeURIComponent(
            Number(id)
          )}`,
          {
            method: "DELETE",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      await parseApiResponse(
        response
      );

      /*
      |--------------------------------------------------------------------------
      | Remove From UI
      |--------------------------------------------------------------------------
      */

      setServices(
        (previous) =>
          previous.filter(
            (item) =>
              Number(item.id) !==
              Number(id)
          )
      );
    } catch (err) {
      console.error(
        "Delete service error:",
        err
      );

      alert(
        err?.message ||
          "Unable to delete service."
      );
    } finally {
      setActionId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Toggle Status
  |--------------------------------------------------------------------------
  */

  const toggleStatus = async (id) => {
    const service =
      services.find(
        (item) =>
          Number(item.id) ===
          Number(id)
      );

    if (!service) {
      return;
    }

    if (actionId !== null) {
      return;
    }

    const currentStatus =
      Number(service.is_active) ===
      1;

    const newStatus =
      !currentStatus;

    try {
      setActionId(id);
      setError("");

      const token =
        getAdminToken();

      if (!token) {
        throw new Error(
          "Authentication token is missing. Please login again."
        );
      }

      const response =
        await fetch(
          `${API_BASE}/toggle-status.php`,
          {
            method: "PATCH",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              id: Number(id),

              is_active:
                newStatus,
            }),
          }
        );

      const result =
        await parseApiResponse(
          response
        );

      /*
      |--------------------------------------------------------------------------
      | Update UI
      |--------------------------------------------------------------------------
      */

      setServices(
        (previous) =>
          previous.map(
            (item) => {
              if (
                Number(item.id) !==
                Number(id)
              ) {
                return item;
              }

              if (result.data) {
                return result.data;
              }

              return {
                ...item,

                is_active:
                  newStatus ? 1 : 0,
              };
            }
          )
      );
    } catch (err) {
      console.error(
        "Toggle service error:",
        err
      );

      alert(
        err?.message ||
          "Unable to update service status."
      );
    } finally {
      setActionId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Close Modal
  |--------------------------------------------------------------------------
  */

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setShowAddModal(false);

    setForm({
      ...emptyForm,
    });

    setImagePreview("");
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto max-w-7xl">

      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Services
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage the services displayed on your website.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowAddModal(true)
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          <i className="fa-solid fa-plus" />

          Add Service
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

          <i className="fa-solid fa-circle-exclamation mt-0.5" />

          <div className="flex-1">

            <p className="font-bold">
              Unable to load services
            </p>

            <p className="mt-1">
              {error}
            </p>

          </div>

          <button
            type="button"
            onClick={fetchServices}
            className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200"
          >
            Retry
          </button>

        </div>
      )}

      {/* STATS */}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <i className="fa-solid fa-screwdriver-wrench" />
            </div>

            <div>

              <p className="text-xs font-semibold text-slate-500">
                Total Services
              </p>

              <p className="text-xl font-extrabold text-slate-900">
                {services.length}
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <i className="fa-solid fa-circle-check" />
            </div>

            <div>

              <p className="text-xs font-semibold text-slate-500">
                Active
              </p>

              <p className="text-xl font-extrabold text-slate-900">
                {activeCount}
              </p>

            </div>

          </div>

        </div>

        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <i className="fa-solid fa-circle-pause" />
            </div>

            <div>

              <p className="text-xs font-semibold text-slate-500">
                Inactive
              </p>

              <p className="text-xl font-extrabold text-slate-900">
                {inactiveCount}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* SEARCH */}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="relative">

          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search service..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
          />

        </div>

      </div>

      {/* LOADING */}

      {loading ? (

        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

          <i className="fa-solid fa-spinner fa-spin text-2xl text-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Loading services...
          </p>

        </div>

      ) : filteredServices.length > 0 ? (

        /* SERVICE CARDS */

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

          {filteredServices.map(
            (service) => {

              const isActive =
                Number(
                  service.is_active
                ) === 1;

              const isProcessing =
                Number(actionId) ===
                Number(service.id);

              const imageUrl =
                getImageUrl(
                  service.image
                );

              return (
                <div
                  key={service.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >

                  {/* IMAGE */}

                  <div className="relative h-48 bg-slate-100">

                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={service.name}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <i className="fa-solid fa-image text-3xl" />
                      </div>
                    )}

                    <span
                      className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
                        isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isActive
                        ? "Active"
                        : "Inactive"}
                    </span>

                  </div>

                  {/* CONTENT */}

                  <div className="p-5">

                    <h2 className="mb-2 text-lg font-extrabold text-slate-900">
                      {service.name}
                    </h2>

                    <p className="min-h-[48px] text-sm leading-6 text-slate-500">
                      {service.description}
                    </p>

                    {/* CONTACT */}

                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">

                      <div className="flex items-center gap-3 text-sm">

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <i className="fa-solid fa-phone" />
                        </div>

                        <span className="font-semibold text-slate-700">
                          {service.phone}
                        </span>

                      </div>

                      <div className="flex items-center gap-3 text-sm">

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
                          <i className="fa-brands fa-whatsapp" />
                        </div>

                        <span className="font-semibold text-slate-700">
                          {service.whatsapp}
                        </span>

                      </div>

                    </div>

                    {/* ACTIONS */}

                    <div className="mt-5 grid grid-cols-2 gap-2">

                      <button
                        type="button"
                        disabled={
                          isProcessing
                        }
                        onClick={() =>
                          toggleStatus(
                            service.id
                          )
                        }
                        className={`rounded-xl px-3 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          isActive
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >

                        {isProcessing ? (
                          <i className="fa-solid fa-spinner fa-spin mr-2" />
                        ) : (
                          <i
                            className={`fa-solid ${
                              isActive
                                ? "fa-circle-pause"
                                : "fa-circle-play"
                            } mr-2`}
                          />
                        )}

                        {isActive
                          ? "Disable"
                          : "Activate"}

                      </button>

                      <button
                        type="button"
                        disabled={
                          isProcessing
                        }
                        onClick={() =>
                          handleDelete(
                            service.id
                          )
                        }
                        className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >

                        {isProcessing ? (
                          <i className="fa-solid fa-spinner fa-spin mr-2" />
                        ) : (
                          <i className="fa-solid fa-trash mr-2" />
                        )}

                        Delete

                      </button>

                    </div>

                  </div>

                </div>
              );
            }
          )}

        </div>

      ) : (

        /* EMPTY */

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

            <i className="fa-solid fa-screwdriver-wrench text-xl" />

          </div>

          <h3 className="mt-4 font-bold text-slate-800">
            No services found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Add a service or try another search.
          </p>

        </div>

      )}

      {/* ADD SERVICE MODAL */}

      {showAddModal && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">

              <div>

                <h2 className="text-lg font-extrabold text-slate-900">
                  Add Service
                </h2>

                <p className="text-xs text-slate-500">
                  Add a new service to your website.
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <i className="fa-solid fa-xmark" />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleAddService
              }
              className="space-y-5 p-5"
            >

              {/* NAME */}

              <div>

                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Service Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={
                    handleInputChange
                  }
                  maxLength={150}
                  required
                  placeholder="e.g. Fan Installation"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleInputChange
                  }
                  maxLength={5000}
                  rows={4}
                  required
                  placeholder="Short description about this service..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

              </div>

              {/* IMAGE */}

              <div>

                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Service Image
                </label>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleImageChange
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-blue-600"
                />

                <p className="mt-1 text-xs text-slate-400">
                  JPG, PNG or WEBP • Maximum 5 MB
                </p>

                {/* PREVIEW */}

                {imagePreview && (

                  <div className="relative mt-3 overflow-hidden rounded-xl border border-slate-200">

                    <img
                      src={imagePreview}
                      alt="Service preview"
                      className="h-48 w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview("");

                        setForm(
                          (previous) => ({
                            ...previous,
                            image: null,
                          })
                        );
                      }}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>

                  </div>

                )}

              </div>

              {/* PHONE */}

              <div>

                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Contact Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={
                    handleInputChange
                  }
                  inputMode="numeric"
                  maxLength={10}
                  required
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

              </div>

              {/* WHATSAPP */}

              <div>

                <label className="mb-2 block text-sm font-bold text-slate-700">
                  WhatsApp Number
                </label>

                <input
                  type="tel"
                  name="whatsapp"
                  value={
                    form.whatsapp
                  }
                  onChange={
                    handleInputChange
                  }
                  inputMode="numeric"
                  maxLength={10}
                  required
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

              </div>

              {/* ACTIVE */}

              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-4">

                <input
                  type="checkbox"
                  checked={
                    form.active
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        active:
                          event.target
                            .checked,
                      })
                    )
                  }
                  className="h-4 w-4 accent-blue-600"
                />

                <div>

                  <p className="text-sm font-bold text-slate-800">
                    Active Service
                  </p>

                  <p className="text-xs text-slate-500">
                    Active services will be shown to customers.
                  </p>

                </div>

              </label>

              {/* BUTTONS */}

              <div className="flex gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    submitting
                  }
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {submitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-plus mr-2" />
                      Add Service
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default ServiceRequests;