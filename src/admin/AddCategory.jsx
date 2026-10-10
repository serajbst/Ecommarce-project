import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE =
  "http://localhost/ashrafbazar/backend/api";

function AddCategory() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    status: "active",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Form Change
  |--------------------------------------------------------------------------
  */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Category Name + Slug
  |--------------------------------------------------------------------------
  */

  const handleNameChange = (e) => {
    const name = e.target.value;

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setForm((prev) => ({
      ...prev,
      name,
      slug,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Image
  |--------------------------------------------------------------------------
  */

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, PNG and WebP images are allowed."
      );

      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image size must not exceed 5MB."
      );

      e.target.value = "";
      return;
    }

    setError("");
    setImage(file);

    setPreview(
      URL.createObjectURL(file)
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    const name = form.name.trim();
    const slug = form.slug.trim();

    if (!name) {
      setError(
        "Category name is required."
      );
      return;
    }

    if (!slug) {
      setError(
        "Category slug is required."
      );
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Admin Token
    |--------------------------------------------------------------------------
    */

    const token =
      localStorage.getItem(
        "admin_token"
      );

    if (!token) {
      setError(
        "Admin session expired. Please login again."
      );
      return;
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
      "slug",
      slug
    );

    formData.append(
      "description",
      form.description.trim()
    );

    formData.append(
      "status",
      form.status
    );

    if (image) {
      formData.append(
        "image",
        image
      );
    }

    /*
    |--------------------------------------------------------------------------
    | API
    |--------------------------------------------------------------------------
    */

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE}/categories/create.php`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: formData,
        }
      );

      const text =
        await response.text();

      let data = null;

      try {
        data = text
          ? JSON.parse(text)
          : null;
      } catch {
        throw new Error(
          `Server returned invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Request failed with status ${response.status}.`
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Category could not be created."
        );
      }

      setSuccess(
        "Category created successfully."
      );

      /*
      |--------------------------------------------------------------------------
      | Redirect
      |--------------------------------------------------------------------------
      */

      setTimeout(() => {
        navigate(
          "/admin/categories"
        );
      }, 800);

    } catch (err) {
      console.error(
        "Add Category Error:",
        err
      );

      setError(
        err?.message ||
          "Unable to create category."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">

      {/* Header */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">

            <Link
              to="/admin/categories"
              className="hover:text-blue-600"
            >
              Categories
            </Link>

            <i className="fa-solid fa-chevron-right text-[10px]"></i>

            <span>
              Add Category
            </span>

          </div>

          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Add Category
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create a new product category for your store.
          </p>

        </div>

        <Link
          to="/admin/categories"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <i className="fa-solid fa-arrow-left"></i>
          Back to Categories
        </Link>

      </div>

      {/* Error */}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <i className="fa-solid fa-circle-exclamation mr-2"></i>
          {error}
        </div>
      )}

      {/* Success */}

      {success && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <i className="fa-solid fa-circle-check mr-2"></i>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

          {/* Main */}

          <div className="space-y-6">

            {/* Basic Information */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="mb-5">

                <h2 className="font-heading text-lg font-extrabold text-slate-900">
                  Category Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the basic information for this category.
                </p>

              </div>

              <div className="space-y-5">

                {/* Name */}

                <div>

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Category Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Electrical"
                    maxLength={100}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                </div>

                {/* Slug */}

                <div>

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Slug
                  </label>

                  <div className="flex overflow-hidden rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">

                    <span className="flex items-center bg-slate-50 px-4 text-sm text-slate-400">
                      /
                    </span>

                    <input
                      type="text"
                      name="slug"
                      value={form.slug}
                      onChange={handleChange}
                      maxLength={100}
                      required
                      className="min-w-0 flex-1 border-0 px-3 py-3 text-sm outline-none"
                    />

                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    URL-friendly name used for the category page.
                  </p>

                </div>

                {/* Description */}

                <div>

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="6"
                    placeholder="Write a short description about this category..."
                    maxLength={1000}
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                </div>

              </div>

            </section>

            {/* Settings */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <h2 className="font-heading text-lg font-extrabold text-slate-900">
                Category Settings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Control where and how this category appears.
              </p>

              <div className="mt-5">

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">

                  <input
                    type="checkbox"
                    checked={form.status === "active"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        status:
                          e.target.checked
                            ? "active"
                            : "inactive",
                      }))
                    }
                    className="mt-1 h-4 w-4 accent-blue-600"
                  />

                  <span>

                    <span className="block text-sm font-bold text-slate-800">
                      Active Category
                    </span>

                    <span className="mt-1 block text-xs text-slate-500">
                      Customers can see this category in the store.
                    </span>

                  </span>

                </label>

              </div>

            </section>

          </div>

          {/* Right */}

          <div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <h2 className="font-heading text-lg font-extrabold text-slate-900">
                Category Image
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Recommended: square image.
              </p>

              <div className="mt-5 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">

                {preview ? (
                  <img
                    src={preview}
                    alt="Category preview"
                    className="h-64 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center px-5 text-center">

                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <i className="fa-regular fa-image text-2xl text-slate-300"></i>
                    </div>

                    <p className="mt-4 text-sm font-bold text-slate-600">
                      Upload category image
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      JPG, PNG or WebP — Max 5MB
                    </p>

                  </div>
                )}

              </div>

              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">

                <i className="fa-solid fa-cloud-arrow-up"></i>

                {preview
                  ? "Change Image"
                  : "Upload Image"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />

              </label>

              {image && (
                <p className="mt-2 break-all text-xs text-blue-600">
                  {image.name}
                </p>
              )}

            </section>

          </div>

        </div>

        {/* Actions */}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

          <Link
            to="/admin/categories"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Creating...
              </>
            ) : (
              <>
                <i className="fa-solid fa-plus"></i>
                Create Category
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  );
}

export default AddCategory;