import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost/ashrafbazar/backend/api";

function AddProduct() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        category: "",
        price: "",
        oldPrice: "",
        sku: "",
        stock: "",
        description: "",
        features: "",
        status: "Active",
        featured: false,
    });

    const [categories, setCategories] = useState([]);
    const [images, setImages] = useState([]);

    const [loadingCategories, setLoadingCategories] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    /*
    |--------------------------------------------------------------------------
    | Fetch Categories
    |--------------------------------------------------------------------------
    */

   useEffect(() => {
    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            setError("");

            const token = localStorage.getItem("admin_token");

            if (!token) {
                setError("Admin session expired. Please login again.");
                navigate("/admin/login", { replace: true });
                return;
            }

            const response = await fetch(
                `${API_URL}/categories/index.php`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to load categories."
                );
            }

            setCategories(
                result.data?.categories || []
            );
        } catch (error) {
            console.error(
                "Categories API Error:",
                error
            );

            setError(
                error.message ||
                "Unable to load categories."
            );
        } finally {
            setLoadingCategories(false);
        }
    };

    fetchCategories();
}, [navigate]);

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
    | Image Change
    |--------------------------------------------------------------------------
    */

    const handleImageChange = (e) => {
        const selectedFiles = Array.from(
            e.target.files || []
        );

        if (!selectedFiles.length) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        const maxSize = 5 * 1024 * 1024;

        if (selectedFiles.length > 5) {
            setError("You can upload maximum 5 images.");
            e.target.value = "";
            return;
        }

        for (const file of selectedFiles) {
            if (!allowedTypes.includes(file.type)) {
                setError(
                    "Only JPG, PNG or WEBP images are allowed."
                );
                e.target.value = "";
                return;
            }

            if (file.size > maxSize) {
                setError(
                    `Image "${file.name}" must not exceed 5 MB.`
                );
                e.target.value = "";
                return;
            }
        }

        setImages(selectedFiles);
        setError("");
        setSuccess("");
    };

    const removeImage = (index) => {
        setImages((prev) =>
            prev.filter((_, imageIndex) => imageIndex !== index)
        );
        setError("");
        setSuccess("");
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
        | Basic Validation
        |--------------------------------------------------------------------------
        */

        if (!form.name.trim()) {
            setError("Product name is required.");
            return;
        }

        if (!form.category) {
            setError("Please select a category.");
            return;
        }

        if (
            form.price === "" ||
            Number(form.price) < 0
        ) {
            setError("Please enter a valid selling price.");
            return;
        }

        if (!form.sku.trim()) {
            setError("SKU is required.");
            return;
        }

        if (
            form.stock === "" ||
            Number(form.stock) < 0
        ) {
            setError("Please enter a valid stock quantity.");
            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Find Category ID
        |--------------------------------------------------------------------------
        */

        const selectedCategory =
            categories.find(
                (category) =>
                    String(category.id) ===
                    String(form.category)
            );

        if (!selectedCategory) {
            setError("Selected category is invalid.");
            return;
        }


        /*
        |--------------------------------------------------------------------------
        | FormData
        |--------------------------------------------------------------------------
        |
        | Image upload requires multipart/form-data.
        | Do NOT manually set Content-Type.
        |--------------------------------------------------------------------------
        */

        const formData = new FormData();

        formData.append(
            "name",
            form.name.trim()
        );

        formData.append(
            "category_id",
            String(selectedCategory.id)
        );

        formData.append(
            "price",
            String(form.price)
        );

        if (form.oldPrice !== "") {
            formData.append(
                "old_price",
                String(form.oldPrice)
            );
        }

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
            form.description.trim()
        );

        /*
        |--------------------------------------------------------------------------
        | Features
        |--------------------------------------------------------------------------
        |
        | Current DB schema does not have a features column.
        | Keep it in frontend for now but don't send it to API.
        |--------------------------------------------------------------------------
        */

        formData.append(
            "short_description",
            ""
        );

        formData.append(
            "status",
            form.status
        );

        formData.append(
            "featured",
            form.featured ? "1" : "0"
        );

        images.forEach((file) => {
            formData.append("images[]", file);
        });


        /*
        |--------------------------------------------------------------------------
        | Debug
        |--------------------------------------------------------------------------
        */

        console.log(
            "Creating product:",
            {
                name: form.name,
                category_id: selectedCategory.id,
                category_name: selectedCategory.name,
                price: form.price,
                old_price: form.oldPrice,
                sku: form.sku,
                stock: form.stock,
                status: form.status,
                featured: form.featured,
                images: images.map((file) => file.name),
            }
        );


        /*
        |--------------------------------------------------------------------------
        | API Request
        |--------------------------------------------------------------------------
        */

        try {

            setSaving(true);

            const token =
                localStorage.getItem(
                    "admin_token"
                );

            if (!token) {
                setError(
                    "Admin session expired. Please login again."
                );

                navigate(
                    "/admin/login",
                    { replace: true }
                );

                return;
            }


            const response = await fetch(
                `${API_URL}/products/create.php`,
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: formData,
                }
            );


            /*
            |--------------------------------------------------------------------------
            | Read Response
            |--------------------------------------------------------------------------
            */

            const result =
                await response.json();


            console.log(
                "Create Product API:",
                result
            );


            /*
            |--------------------------------------------------------------------------
            | API Error
            |--------------------------------------------------------------------------
            */

            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Unable to create product."
                );
            }


            /*
            |--------------------------------------------------------------------------
            | Success
            |--------------------------------------------------------------------------
            */

            setSuccess(
                "Product created successfully."
            );


            /*
            |--------------------------------------------------------------------------
            | Redirect
            |--------------------------------------------------------------------------
            */

            setTimeout(() => {

                navigate(
                    "/admin/products",
                    { replace: true }
                );

            }, 700);


        } catch (error) {

            console.error(
                "Create Product Error:",
                error
            );

            setError(
                error.message ||
                "Unable to create product."
            );

        } finally {

            setSaving(false);
        }
    };


    return (
        <div>

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>

                    <div className="flex items-center gap-2 text-sm text-slate-500">

                        <Link
                            to="/admin"
                            className="hover:text-blue-600"
                        >
                            Dashboard
                        </Link>

                        <i className="fa-solid fa-chevron-right text-[9px]" />

                        <Link
                            to="/admin/products"
                            className="hover:text-blue-600"
                        >
                            Products
                        </Link>

                        <i className="fa-solid fa-chevron-right text-[9px]" />

                        <span className="font-medium text-slate-700">
                            Add Product
                        </span>

                    </div>

                    <h1 className="font-heading mt-3 text-2xl font-extrabold text-slate-900">
                        Add Product
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Add a new product to your AshrafBazar store.
                    </p>

                </div>


                <Link
                    to="/admin/products"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                    <i className="fa-solid fa-arrow-left text-xs" />
                    Back to Products
                </Link>

            </div>


            {/* =====================================================
                ERROR
            ===================================================== */}

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                </div>
            )}


            {/* =====================================================
                SUCCESS
            ===================================================== */}

            {success && (
                <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {success}
                </div>
            )}


            {/* =====================================================
                FORM
            ===================================================== */}

            <form onSubmit={handleSubmit}>

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

                    {/* =================================================
                        MAIN
                    ================================================= */}

                    <div className="space-y-6">


                        {/* =================================================
                            BASIC INFORMATION
                        ================================================= */}

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                            <h2 className="text-lg font-bold text-slate-900">
                                Basic Information
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Enter the main information about your product.
                            </p>


                            <div className="mt-6 space-y-5">

                                {/* Product Name */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Product Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        maxLength={255}
                                        placeholder="e.g. 9W LED Bulb"
                                        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />

                                </div>


                                {/* Category + SKU */}

                                <div className="grid gap-5 sm:grid-cols-2">

                                    <div>

                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Category
                                        </label>

                                        <select
                                            name="category"
                                            value={form.category}
                                            onChange={handleChange}
                                            required
                                            disabled={loadingCategories}
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                                        >

                                            <option value="">
                                                {loadingCategories
                                                    ? "Loading categories..."
                                                    : "Select Category"}
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


                                    <div>

                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            SKU
                                        </label>

                                        <input
                                            type="text"
                                            name="sku"
                                            value={form.sku}
                                            onChange={handleChange}
                                            required
                                            maxLength={100}
                                            placeholder="e.g. AB-LED-009"
                                            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        />

                                    </div>

                                </div>


                                {/* Description */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Description
                                    </label>

                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        rows="5"
                                        placeholder="Write a clear description of the product..."
                                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />

                                </div>


                                {/* Features */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Key Features
                                    </label>

                                    <textarea
                                        name="features"
                                        value={form.features}
                                        onChange={handleChange}
                                        rows="4"
                                        placeholder={
                                            "Enter one feature per line\n9 Watt power\nEnergy efficient\nLong-lasting"
                                        }
                                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />

                                    <p className="mt-2 text-xs text-slate-400">
                                        Enter one feature per line.
                                    </p>

                                </div>

                            </div>

                        </section>


                        {/* =================================================
                            PRICING & INVENTORY
                        ================================================= */}

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                            <h2 className="text-lg font-bold text-slate-900">
                                Pricing & Inventory
                            </h2>


                            <div className="mt-6 grid gap-5 sm:grid-cols-3">

                                {/* Price */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Selling Price
                                    </label>

                                    <div className="relative">

                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                                            ₹
                                        </span>

                                        <input
                                            type="number"
                                            name="price"
                                            value={form.price}
                                            onChange={handleChange}
                                            required
                                            min="0"
                                            step="0.01"
                                            placeholder="80"
                                            className="h-12 w-full rounded-xl border border-slate-200 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        />

                                    </div>

                                </div>


                                {/* Old Price */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        MRP / Old Price
                                    </label>

                                    <div className="relative">

                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                                            ₹
                                        </span>

                                        <input
                                            type="number"
                                            name="oldPrice"
                                            value={form.oldPrice}
                                            onChange={handleChange}
                                            min="0"
                                            step="0.01"
                                            placeholder="100"
                                            className="h-12 w-full rounded-xl border border-slate-200 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        />

                                    </div>

                                </div>


                                {/* Stock */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Stock Quantity
                                    </label>

                                    <input
                                        type="number"
                                        name="stock"
                                        value={form.stock}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        placeholder="25"
                                        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />

                                </div>

                            </div>

                        </section>

                    </div>


                    {/* =================================================
                        RIGHT COLUMN
                    ================================================= */}

                    <div className="space-y-6">


                        {/* =================================================
                            PRODUCT IMAGE
                        ================================================= */}

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                            <h2 className="text-lg font-bold text-slate-900">
                                Product Images
                            </h2>


                            <div className="mt-5">

                                <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 text-center transition hover:border-blue-300 hover:bg-blue-50">

                                    {images.length > 0 ? (
                                        <div className="w-full">
                                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                {images.map((file, index) => (
                                                    <div
                                                        key={`${file.name}-${file.lastModified}-${index}`}
                                                        className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white"
                                                    >
                                                        <img
                                                            src={URL.createObjectURL(file)}
                                                            alt={`Product preview ${index + 1}`}
                                                            className="h-32 w-full object-cover"
                                                        />

                                                        {index === 0 && (
                                                            <span className="absolute left-2 top-2 rounded-md bg-blue-600 px-2 py-1 text-[10px] font-bold text-white">
                                                                Main Image
                                                            </span>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                event.stopPropagation();
                                                                removeImage(index);
                                                            }}
                                                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                                                            aria-label={`Remove image ${index + 1}`}
                                                        >
                                                            <i className="fa-solid fa-xmark text-xs" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <p className="mt-3 text-xs font-semibold text-blue-600">
                                                {images.length}/5 images selected — click to change
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                                <i className="fa-solid fa-cloud-arrow-up text-xl" />
                                            </div>

                                            <p className="mt-4 text-sm font-bold text-slate-700">
                                                Upload Product Images
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                Select up to 5 JPG, PNG or WEBP images
                                            </p>
                                        </>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        multiple
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />

                                </label>

                            </div>

                        </section>


                        {/* =================================================
                            PRODUCT SETTINGS
                        ================================================= */}

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                            <h2 className="text-lg font-bold text-slate-900">
                                Product Settings
                            </h2>


                            <div className="mt-5 space-y-4">

                                {/* Status */}

                                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4">

                                    <div>

                                        <p className="text-sm font-bold text-slate-800">
                                            Product Status
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Make this product visible in the store.
                                        </p>

                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={
                                            form.status === "Active"
                                        }
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                status:
                                                    e.target.checked
                                                        ? "Active"
                                                        : "Inactive",
                                            }))
                                        }
                                        className="h-5 w-5 accent-blue-600"
                                    />

                                </label>


                                {/* Featured */}

                                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4">

                                    <div>

                                        <p className="text-sm font-bold text-slate-800">
                                            Featured Product
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Show this product in featured sections.
                                        </p>

                                    </div>

                                    <input
                                        type="checkbox"
                                        name="featured"
                                        checked={form.featured}
                                        onChange={handleChange}
                                        className="h-5 w-5 accent-blue-600"
                                    />

                                </label>

                            </div>

                        </section>


                        {/* =================================================
                            ACTIONS
                        ================================================= */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                            <button
                                type="submit"
                                disabled={
                                    saving ||
                                    loadingCategories
                                }
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >

                                <i
                                    className={
                                        saving
                                            ? "fa-solid fa-spinner fa-spin"
                                            : "fa-solid fa-check"
                                    }
                                />

                                {saving
                                    ? "Saving Product..."
                                    : "Save Product"}

                            </button>


                            <Link
                                to="/admin/products"
                                className="mt-3 flex h-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                                Cancel
                            </Link>

                        </div>

                    </div>

                </div>

            </form>

        </div>
    );
}

export default AddProduct;