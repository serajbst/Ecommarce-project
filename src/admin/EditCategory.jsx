import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const API_BASE =
    "http://localhost/ashrafbazar/backend/api/categories";

const CATEGORY_API =
    `${API_BASE}/index.php`;

const UPDATE_API =
    `${API_BASE}/update.php`;

const BACKEND_BASE =
    "http://localhost/ashrafbazar/backend";

/*
|--------------------------------------------------------------------------
| Admin Token
|--------------------------------------------------------------------------
*/

const getAdminToken = () => {
    return localStorage.getItem("admin_token");
};


/*
|--------------------------------------------------------------------------
| Image URL
|--------------------------------------------------------------------------
*/

const getImageUrl = (image) => {

    if (!image) {
        return "";
    }

    const value = String(image).trim();

    if (!value) {
        return "";
    }

    /*
    | Already full URL
    */
    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("blob:")
    ) {
        return value;
    }

    /*
    | Backend uploads path
    | Example:
    | uploads/categories/abc.jpg
    */
    if (value.startsWith("uploads/")) {
        return `${BACKEND_BASE}/${value}`;
    }

    /*
    | /uploads/categories/abc.jpg
    */
    if (value.startsWith("/uploads/")) {
        return `${BACKEND_BASE}${value}`;
    }

    /*
    | Old/plain filename
    */
    return `${BACKEND_BASE}/uploads/categories/${value}`;
};


/*
|--------------------------------------------------------------------------
| API Response
|--------------------------------------------------------------------------
*/

const parseApiResponse = async (response) => {

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error(
            `Invalid server response (${response.status}).`
        );
    }

    if (!response.ok || result?.success === false) {

        throw new Error(
            result?.message ||
            `Request failed with status ${response.status}.`
        );
    }

    return result;
};


/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

function EditCategory() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        slug: "",
        description: "",
        status: "active",
        featured: false,
    });

    const [image, setImage] = useState(null);

    const [preview, setPreview] = useState("");

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");


    /*
    |--------------------------------------------------------------------------
    | Load Category
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        let mounted = true;

        const loadCategory = async () => {

            const token = getAdminToken();

            if (!token) {

                if (mounted) {
                    setError(
                        "Admin session expired. Please login again."
                    );

                    setLoading(false);
                }

                return;
            }

            if (!id || Number(id) <= 0) {

                if (mounted) {
                    setError("Invalid category ID.");
                    setLoading(false);
                }

                return;
            }

            try {

                setLoading(true);
                setError("");

                const response = await fetch(
                    CATEGORY_API,
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

                const categories =
                    result?.data?.categories || [];

                const category =
                    categories.find(
                        (item) =>
                            Number(item.id) === Number(id)
                    );

                if (!category) {
                    throw new Error(
                        "Category not found."
                    );
                }

                if (!mounted) {
                    return;
                }

                setForm({
                    name: category.name || "",
                    slug: category.slug || "",
                    description:
                        category.description || "",
                    status:
                        String(category.status).toLowerCase() ===
                        "inactive"
                            ? "inactive"
                            : "active",
                    featured:
                        Boolean(category.featured),
                });

                setPreview(
                    getImageUrl(category.image)
                );

            } catch (err) {

                console.error(
                    "Load Category Error:",
                    err
                );

                if (mounted) {
                    setError(
                        err.message ||
                        "Unable to load category."
                    );
                }

            } finally {

                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadCategory();

        return () => {
            mounted = false;
        };

    }, [id]);


    /*
    |--------------------------------------------------------------------------
    | Handle Input
    |--------------------------------------------------------------------------
    */

    const handleChange = (e) => {

        const {
            name,
            value,
            type,
            checked,
        } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));

        setError("");
        setSuccess("");
    };


    /*
    |--------------------------------------------------------------------------
    | Name + Slug
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

        setError("");
        setSuccess("");
    };


    /*
    |--------------------------------------------------------------------------
    | Image Change
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

        const maxSize =
            2 * 1024 * 1024;

        if (file.size > maxSize) {

            setError(
                "Image size must be 2MB or less."
            );

            e.target.value = "";

            return;
        }

        setError("");

        setSuccess("");

        setImage(file);

        const objectUrl =
            URL.createObjectURL(file);

        setPreview(objectUrl);
    };


    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (saving) {
            return;
        }

        const token = getAdminToken();

        if (!token) {

            setError(
                "Admin session expired. Please login again."
            );

            return;
        }

        const name =
            form.name.trim();

        if (!name) {

            setError(
                "Category name is required."
            );

            return;
        }

        try {

            setSaving(true);

            setError("");

            setSuccess("");

            /*
            |--------------------------------------------------------------------------
            | FormData
            |--------------------------------------------------------------------------
            */

            const formData =
                new FormData();

            formData.append(
                "id",
                String(Number(id))
            );

            formData.append(
                "name",
                name
            );

            formData.append(
                "description",
                form.description.trim()
            );

            formData.append(
                "status",
                form.status === "inactive"
                    ? "inactive"
                    : "active"
            );

            /*
            |--------------------------------------------------------------------------
            | New Image
            |--------------------------------------------------------------------------
            */

            if (image) {

                formData.append(
                    "image",
                    image
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Update Request
            |--------------------------------------------------------------------------
            */

            const response = await fetch(
                UPDATE_API,
                {
                    method: "POST",
                    headers: {
                        Accept:
                            "application/json",
                        Authorization:
                            `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const result =
                await parseApiResponse(
                    response
                );

            setSuccess(
                result?.message ||
                "Category updated successfully."
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

            }, 700);

        } catch (err) {

            console.error(
                "Update Category Error:",
                err
            );

            setError(
                err.message ||
                "Unable to update category."
            );

        } finally {

            setSaving(false);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    if (loading) {

        return (
            <div className="flex min-h-[400px] items-center justify-center">

                <div className="text-center">

                    <i className="fa-solid fa-spinner fa-spin text-3xl text-blue-600" />

                    <p className="mt-3 text-sm font-semibold text-slate-500">
                        Loading category...
                    </p>

                </div>

            </div>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | UI
    |--------------------------------------------------------------------------
    */

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

                        <i className="fa-solid fa-chevron-right text-[10px]" />

                        <span>
                            Edit Category
                        </span>

                    </div>

                    <h1 className="font-heading text-2xl font-extrabold text-slate-900">
                        Edit Category
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Update category information and visibility.
                    </p>

                </div>

                <Link
                    to="/admin/categories"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                    <i className="fa-solid fa-arrow-left" />
                    Back to Categories
                </Link>

            </div>


            {/* Error */}

            {error && (

                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">

                    <i className="fa-solid fa-circle-exclamation mr-2" />

                    {error}

                </div>
            )}


            {/* Success */}

            {success && (

                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">

                    <i className="fa-solid fa-circle-check mr-2" />

                    {success}

                </div>
            )}


            <form onSubmit={handleSubmit}>

                <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

                    {/* Main */}

                    <div className="space-y-6">

                        {/* Information */}

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                            <div className="mb-5">

                                <h2 className="font-heading text-lg font-extrabold text-slate-900">
                                    Category Information
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Update the basic information of this category.
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
                                        onChange={
                                            handleNameChange
                                        }
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

                                    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50">

                                        <span className="flex items-center bg-slate-100 px-4 text-sm text-slate-400">
                                            /
                                        </span>

                                        <input
                                            type="text"
                                            value={form.slug}
                                            readOnly
                                            className="min-w-0 flex-1 border-0 bg-slate-50 px-3 py-3 text-sm text-slate-500 outline-none"
                                        />

                                    </div>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Slug is generated automatically from the category name.
                                    </p>

                                </div>


                                {/* Description */}

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
                                            handleChange
                                        }
                                        rows={6}
                                        maxLength={500}
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

                            <div className="mt-5 space-y-3">

                                {/* Active */}

                                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">

                                    <input
                                        type="checkbox"
                                        checked={
                                            form.status ===
                                            "active"
                                        }
                                        onChange={(e) =>
                                            setForm(
                                                (prev) => ({
                                                    ...prev,
                                                    status:
                                                        e.target
                                                            .checked
                                                            ? "active"
                                                            : "inactive",
                                                })
                                            )
                                        }
                                        className="mt-1 h-4 w-4 accent-blue-600"
                                    />

                                    <span>

                                        <span className="block text-sm font-bold text-slate-800">
                                            Active Category
                                        </span>

                                        <span className="mt-1 block text-xs text-slate-500">
                                            Customers can see this category.
                                        </span>

                                    </span>

                                </label>


                                {/* Featured */}

                                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">

                                    <input
                                        type="checkbox"
                                        name="featured"
                                        checked={
                                            form.featured
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className="mt-1 h-4 w-4 accent-blue-600"
                                    />

                                    <span>

                                        <span className="block text-sm font-bold text-slate-800">
                                            Featured Category
                                        </span>

                                        <span className="mt-1 block text-xs text-slate-500">
                                            Show this category in featured sections.
                                        </span>

                                    </span>

                                </label>

                            </div>

                        </section>

                    </div>


                    {/* Image */}

                    <div>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                            <h2 className="font-heading text-lg font-extrabold text-slate-900">
                                Category Image
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Change the category image if required.
                            </p>


                            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

                                {preview ? (

                                    <img
                                        src={preview}
                                        alt={
                                            form.name ||
                                            "Category"
                                        }
                                        className="h-64 w-full object-cover"
                                    />

                                ) : (

                                    <div className="flex h-64 items-center justify-center">

                                        <i className="fa-regular fa-image text-4xl text-slate-300" />

                                    </div>
                                )}

                            </div>


                            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">

                                <i className="fa-solid fa-cloud-arrow-up" />

                                Change Image

                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={
                                        handleImageChange
                                    }
                                    className="hidden"
                                />

                            </label>


                            {image && (

                                <p className="mt-2 text-center text-xs text-green-600">
                                    New image selected.
                                </p>
                            )}

                            <p className="mt-2 text-center text-xs text-slate-400">
                                JPG, PNG or WebP · Maximum 2MB
                            </p>

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
                                <i className="fa-solid fa-spinner fa-spin" />
                                Updating...
                            </>

                        ) : (

                            <>
                                <i className="fa-solid fa-check" />
                                Update Category
                            </>
                        )}

                    </button>

                </div>

            </form>

        </div>
    );
}

export default EditCategory;