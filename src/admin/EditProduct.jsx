import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaImage,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaBoxOpen,
} from "react-icons/fa";

const API_BASE =
  "http://localhost/ashrafbazar/backend/api";

const BACKEND_BASE =
  "http://localhost/ashrafbazar/backend";

function getImageUrl(image, cacheBust = false) {
  if (!image) {
    return "";
  }

  const value = String(image).trim();

  if (!value) {
    return "";
  }

  let url = "";

  /*
  |--------------------------------------------------------------------------
  | Already Full URL / Blob URL
  |--------------------------------------------------------------------------
  */

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:")
  ) {
    url = value;
  } else if (value.startsWith("/")) {
    /*
    |--------------------------------------------------------------------------
    | Example:
    | /uploads/products/example.jpg
    | ->
    | http://localhost/ashrafbazar/backend/uploads/products/example.jpg
    |--------------------------------------------------------------------------
    */
    url = `${BACKEND_BASE}${value}`;
  } else {
    /*
    |--------------------------------------------------------------------------
    | Example:
    | uploads/products/example.jpg
    |--------------------------------------------------------------------------
    */
    url = `${BACKEND_BASE}/${value}`;
  }

  /*
  |--------------------------------------------------------------------------
  | Cache Busting
  |--------------------------------------------------------------------------
  | Prevents browser from showing an old cached image after replacement.
  |--------------------------------------------------------------------------
  */

  if (
    cacheBust &&
    !url.startsWith("blob:")
  ) {
    const separator = url.includes("?")
      ? "&"
      : "?";

    url =
      `${url}${separator}v=${Date.now()}`;
  }

  return url;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);

  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
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

  return data;
}

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    price: "",
    old_price: "",
    sku: "",
    stock: "",
    description: "",
    short_description: "",
    status: "active",
    featured: false,
  });

  const [existingImage, setExistingImage] =
    useState("");

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [previewImage, setPreviewImage] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Product + Categories
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [productResponse, categoryResponse] =
          await Promise.all([
            fetchJson(
              `${API_BASE}/products/show.php?id=${encodeURIComponent(
                id
              )}`
            ),

            fetchJson(
              `${API_BASE}/categories/index.php`
            ),
          ]);

        if (!mounted) {
          return;
        }

        if (
          !productResponse?.success ||
          !productResponse?.data
        ) {
          throw new Error(
            productResponse?.message ||
              "Product could not be loaded."
          );
        }

        const product =
          productResponse.data.product ||
          productResponse.data;

        /*
        |--------------------------------------------------------------------------
        | Categories
        |--------------------------------------------------------------------------
        */

        if (categoryResponse?.success) {
          const categoryData =
            categoryResponse.data;

          const categoryList =
            Array.isArray(categoryData)
              ? categoryData
              : Array.isArray(
                    categoryData?.categories
                  )
                ? categoryData.categories
                : [];

          setCategories(categoryList);
        }

        /*
        |--------------------------------------------------------------------------
        | Product Form
        |--------------------------------------------------------------------------
        */

        setForm({
          name: product.name || "",

          category_id:
            product.category_id
              ? String(product.category_id)
              : "",

          price:
            product.price !== null &&
            product.price !== undefined
              ? String(product.price)
              : "",

          old_price:
            product.old_price !== null &&
            product.old_price !== undefined
              ? String(product.old_price)
              : "",

          sku: product.sku || "",

          stock:
            product.stock !== null &&
            product.stock !== undefined
              ? String(product.stock)
              : "0",

          description:
            product.description || "",

          short_description:
            product.short_description || "",

          status:
            product.status || "active",

          featured:
            Number(product.featured) === 1,
        });

        /*
        |--------------------------------------------------------------------------
        | Existing Image
        |--------------------------------------------------------------------------
        */

        const imageUrl =
          getImageUrl(product.image, false);

        setExistingImage(
          product.image || ""
        );

        setPreviewImage(imageUrl);

      } catch (err) {
        if (!mounted) {
          return;
        }

        console.error(
          "Edit Product Load Error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load product."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Form Change
  |--------------------------------------------------------------------------
  */

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | Image Change
  |--------------------------------------------------------------------------
  */

  function handleImageChange(event) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | MIME Validation
    |--------------------------------------------------------------------------
    */

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setError(
        "Only JPG, PNG and WEBP images are allowed."
      );

      event.target.value = "";

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Size Validation
    |--------------------------------------------------------------------------
    */

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Image size must not exceed 5MB."
      );

      event.target.value = "";

      return;
    }

    setError("");
    setSelectedImage(file);

    /*
    |--------------------------------------------------------------------------
    | Preview
    |--------------------------------------------------------------------------
    */

    const objectUrl =
      URL.createObjectURL(file);

    setPreviewImage(objectUrl);
  }

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    if (!form.name.trim()) {
      setError(
        "Product name is required."
      );

      return;
    }

    if (!form.category_id) {
      setError(
        "Please select a category."
      );

      return;
    }

    if (
      form.price === "" ||
      Number(form.price) < 0
    ) {
      setError(
        "Please enter a valid price."
      );

      return;
    }

    if (
      form.stock === "" ||
      Number(form.stock) < 0 ||
      !Number.isInteger(
        Number(form.stock)
      )
    ) {
      setError(
        "Please enter a valid stock quantity."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Token
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
      "id",
      String(id)
    );

    formData.append(
      "name",
      form.name.trim()
    );

    formData.append(
      "category_id",
      String(form.category_id)
    );

    formData.append(
      "price",
      String(form.price)
    );

    formData.append(
      "old_price",
      String(form.old_price || "")
    );

    formData.append(
      "sku",
      form.sku.trim()
    );

    formData.append(
      "stock",
      String(form.stock)
    );

    formData.append(
      "description",
      form.description
    );

    formData.append(
      "short_description",
      form.short_description
    );

    formData.append(
      "status",
      form.status
    );

    formData.append(
      "featured",
      form.featured ? "1" : "0"
    );

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT:
    | Image is appended ONLY if a NEW image was selected.
    |--------------------------------------------------------------------------
    */

    if (selectedImage) {
      formData.append(
        "image",
        selectedImage
      );
    }

    try {
      setSaving(true);

      const response =
        await fetchJson(
          `${API_BASE}/products/update.php`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: formData,
          }
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Product update failed."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Updated Image
      |--------------------------------------------------------------------------
      */

      const updatedProduct =
        response?.data?.product;

      if (
        updatedProduct?.image
      ) {
        const newImageUrl =
          getImageUrl(
            updatedProduct.image
          );

        setExistingImage(
          updatedProduct.image
        );

        setPreviewImage(
          newImageUrl
        );
      }

      setSelectedImage(null);

      setSuccess(
        "Product updated successfully."
      );

      /*
      |--------------------------------------------------------------------------
      | Redirect
      |--------------------------------------------------------------------------
      */

      setTimeout(() => {
        navigate(
          "/admin/products"
        );
      }, 900);

    } catch (err) {
      console.error(
        "Update Product Error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update product."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <FaSpinner className="animate-spin" />
          <span>
            Loading product...
          </span>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Product
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update product information
          </p>
        </div>

        <Link
          to="/admin/products"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <FaArrowLeft />
          Back to Products
        </Link>

      </div>

      {/* Error */}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FaExclamationCircle className="mt-0.5 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      {/* Success */}

      {success && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <FaCheckCircle className="mt-0.5 shrink-0" />

          <span>{success}</span>
        </div>
      )}

      {/* Form */}

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 bg-white shadow-sm"
      >

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">

          {/* Left */}

          <div className="space-y-5 lg:col-span-2">

            {/* Name */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Product Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={150}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter product name"
              />
            </div>

            {/* Category */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Category
              </label>

              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Select Category
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Prices */}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Selling Price
                </label>

                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Old Price
                </label>

                <input
                  type="number"
                  name="old_price"
                  value={form.old_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="0.00"
                />
              </div>

            </div>

            {/* SKU + Stock */}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  SKU
                </label>

                <input
                  type="text"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  maxLength={100}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="SKU-001"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Stock
                </label>

                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="0"
                />
              </div>

            </div>

            {/* Short Description */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Short Description
              </label>

              <textarea
                name="short_description"
                value={form.short_description}
                onChange={handleChange}
                rows="3"
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Short product description"
              />
            </div>

            {/* Description */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="6"
                className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Product description"
              />
            </div>

            {/* Status */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

                <option value="out_of_stock">
                  Out of Stock
                </option>
              </select>
            </div>

            {/* Featured */}

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4">
              <input
                type="checkbox"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300"
              />

              <div>
                <div className="text-sm font-medium text-gray-800">
                  Featured Product
                </div>

                <div className="text-xs text-gray-500">
                  Show this product in featured sections.
                </div>
              </div>
            </label>

          </div>

          {/* Right */}

          <div className="space-y-5">

            {/* Image */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Product Image
              </label>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">

                {previewImage ? (
                  <img
                    src={previewImage}
                    alt={form.name || "Product"}
                    className="h-64 w-full object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";

                      if (!selectedImage && existingImage) {
                        const fallbackUrl =
                          getImageUrl(
                            existingImage,
                            false
                          );

                        if (
                          fallbackUrl &&
                          event.currentTarget.src !== fallbackUrl
                        ) {
                          event.currentTarget.src =
                            fallbackUrl;
                          event.currentTarget.style.display =
                            "block";
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                    <FaImage className="mb-3 text-4xl" />

                    <span className="text-sm">
                      No image
                    </span>
                  </div>
                )}

              </div>

              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">

                <FaImage />

                {selectedImage
                  ? "Change Selected Image"
                  : "Choose New Image"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleImageChange
                  }
                  className="hidden"
                />
              </label>

              <p className="mt-2 text-xs text-gray-500">
                JPG, PNG or WEBP. Maximum 5MB.
              </p>

              {selectedImage && (
                <p className="mt-2 break-all text-xs text-blue-600">
                  New image:{" "}
                  {selectedImage.name}
                </p>
              )}

            </div>

            {/* Product ID */}

            <div className="rounded-lg bg-gray-50 p-4">

              <div className="mb-2 flex items-center gap-2 text-gray-700">
                <FaBoxOpen />

                <span className="text-sm font-medium">
                  Product ID
                </span>
              </div>

              <div className="font-mono text-sm text-gray-500">
                #{id}
              </div>

            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 p-6 sm:flex-row sm:justify-end">

          <Link
            to="/admin/products"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {saving ? (
              <>
                <FaSpinner className="animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <FaSave />
                Update Product
              </>
            )}

          </button>

        </div>

      </form>
    </div>
  );
}