import { useEffect, useRef, useState } from "react";

const API_BASE = "http://localhost/ashrafbazar/backend/api";
const BACKEND_BASE = "http://localhost/ashrafbazar/backend";

function getImageUrl(image) {
  if (!image) return "";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  if (image.startsWith("/")) {
    return `${BACKEND_BASE}${image}`;
  }

  return `${BACKEND_BASE}/uploads/banners/${image}`;
}

function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const token = localStorage.getItem("admin_token");

  /*
  |--------------------------------------------------------------------------
  | Fetch Banners
  |--------------------------------------------------------------------------
  */

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/banners/index.php`
      );

      const json = await response.json();

      if (!response.ok || json.success === false) {
        throw new Error(
          json.message || "Unable to fetch banners."
        );
      }

      const bannerList =
        Array.isArray(json.data?.banners)
          ? json.data.banners
          : [];

      setBanners(bannerList);

    } catch (err) {
      setError(
        err.message || "Unable to load banners."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | File Select
  |--------------------------------------------------------------------------
  */

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setMessage("");
    setError("");

    if (!file) {
      setSelectedFile(null);
      setPreview("");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, PNG and WEBP images are allowed."
      );

      event.target.value = "";
      setSelectedFile(null);
      setPreview("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Banner image must not exceed 5 MB."
      );

      event.target.value = "";
      setSelectedFile(null);
      setPreview("");
      return;
    }

    setSelectedFile(file);

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  };

  /*
  |--------------------------------------------------------------------------
  | Add Banner
  |--------------------------------------------------------------------------
  */

  const handleAddBanner = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!selectedFile) {
      setError("Please select a banner image.");
      return;
    }

    if (!token) {
      setError(
        "Admin session expired. Please login again."
      );
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("image", selectedFile);

      const response = await fetch(
        `${API_BASE}/banners/create.php`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const json = await response.json();

      if (!response.ok || json.success === false) {
        throw new Error(
          json.message || "Unable to add banner."
        );
      }

      setMessage(
        json.message || "Banner added successfully."
      );

      setSelectedFile(null);
      setPreview("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await fetchBanners();

    } catch (err) {
      setError(
        err.message || "Unable to add banner."
      );
    } finally {
      setUploading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Banner
  |--------------------------------------------------------------------------
  */

  const handleDeleteBanner = async (id) => {
    if (!token) {
      setError(
        "Admin session expired. Please login again."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this banner?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setMessage("");
      setError("");

      const response = await fetch(
        `${API_BASE}/banners/delete.php?id=${encodeURIComponent(
          id
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await response.json();

      if (!response.ok || json.success === false) {
        throw new Error(
          json.message || "Unable to delete banner."
        );
      }

      setMessage(
        json.message || "Banner deleted successfully."
      );

      setBanners((prev) =>
        prev.filter(
          (banner) => Number(banner.id) !== Number(id)
        )
      );

    } catch (err) {
      setError(
        err.message || "Unable to delete banner."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Banners
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage homepage banner images.
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <i className="fa-solid fa-circle-check mt-0.5" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <i className="fa-solid fa-circle-exclamation mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Banner */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Add Banner
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Upload your ready-made homepage banner image.
          </p>
        </div>

        <form onSubmit={handleAddBanner}>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-blue-400 hover:bg-blue-50/30 sm:p-6"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {preview ? (
              <div className="relative overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={preview}
                  alt="Banner preview"
                  className="max-h-[320px] w-full object-contain"
                />

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/80 px-4 py-2 text-xs font-semibold text-white">
                  Click to change image
                </div>
              </div>
            ) : (
              <div className="flex min-h-[180px] flex-col items-center justify-center text-center">

                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <i className="fa-solid fa-cloud-arrow-up text-xl" />
                </div>

                <p className="text-sm font-semibold text-slate-800">
                  Click to upload banner
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG or WEBP · Maximum 5 MB
                </p>

              </div>
            )}
          </div>

          {/* Selected file */}
          {selectedFile && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <i className="fa-solid fa-image" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {selectedFile.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview("");

                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="shrink-0 text-slate-400 transition hover:text-red-500"
                aria-label="Remove selected image"
              >
                <i className="fa-solid fa-xmark" />
              </button>

            </div>
          )}

          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {uploading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                Uploading...
              </>
            ) : (
              <>
                <i className="fa-solid fa-plus" />
                Add Banner
              </>
            )}
          </button>

        </form>
      </div>

      {/* Existing Banners */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Existing Banners
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {banners.length} banner
              {banners.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchBanners}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            aria-label="Refresh banners"
          >
            <i
              className={`fa-solid fa-rotate-right ${
                loading ? "fa-spin" : ""
              }`}
            />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <i className="fa-solid fa-spinner fa-spin text-2xl text-blue-600" />
          </div>
        ) : banners.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center">

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              <i className="fa-solid fa-images text-xl" />
            </div>

            <p className="font-semibold text-slate-700">
              No banners found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Add your first homepage banner above.
            </p>

          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            {banners.map((banner) => (
              <div
                key={banner.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >

                <div className="aspect-[16/7] overflow-hidden bg-slate-100">
                  <img
                    src={getImageUrl(
                      banner.image_url || banner.image
                    )}
                    alt={`Banner ${banner.id}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 p-4">

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      Banner #{banner.id}
                    </p>

                    {banner.created_at && (
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(
                          banner.created_at
                        ).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteBanner(banner.id)
                    }
                    disabled={
                      deletingId === Number(banner.id)
                    }
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === Number(banner.id) ? (
                      <i className="fa-solid fa-spinner fa-spin" />
                    ) : (
                      <i className="fa-solid fa-trash" />
                    )}

                    <span className="hidden sm:inline">
                      Delete
                    </span>
                  </button>

                </div>
              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}

export default Banners;