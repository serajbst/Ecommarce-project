import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| Backend API
|--------------------------------------------------------------------------
*/

const API_BASE =
    "http://localhost/ashrafbazar/backend/api";

const ITEMS_PER_PAGE = 6;

function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] =
        useState(true);

    const [error, setError] = useState("");
    const [categoryError, setCategoryError] =
        useState("");

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] =
        useState("");
    const [statusFilter, setStatusFilter] =
        useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [deletingId, setDeletingId] = useState(null);


    /*
    |--------------------------------------------------------------------------
    | Fetch JSON Safely
    |--------------------------------------------------------------------------
    */

    const fetchJson = async (url, options = {}) => {

        const token =
            localStorage.getItem("admin_token");


        /*
        |--------------------------------------------------------------------------
        | Authentication
        |--------------------------------------------------------------------------
        */

        if (!token) {
            throw new Error(
                "Admin session expired. Please login again."
            );
        }


        /*
        |--------------------------------------------------------------------------
        | API Request
        |--------------------------------------------------------------------------
        */

        const response = await fetch(
            url,
            {
                ...options,

                headers: {
                    Accept: "application/json",

                    Authorization:
                        `Bearer ${token}`,

                    ...(options.headers || {}),
                },
            }
        );


        /*
        |--------------------------------------------------------------------------
        | Response Content Type
        |--------------------------------------------------------------------------
        */

        const contentType =
            response.headers.get("content-type") || "";

        const text =
            await response.text();


        /*
        |--------------------------------------------------------------------------
        | JSON Check
        |--------------------------------------------------------------------------
        */

        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            console.error(
                "Expected JSON but received:",
                text
            );

            throw new Error(
                "Server returned an invalid response. Please check the backend API."
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Parse JSON
        |--------------------------------------------------------------------------
        */

        let result;

        try {

            result =
                JSON.parse(text);

        } catch (error) {

            console.error(
                "JSON Parse Error:",
                error,
                text
            );

            throw new Error(
                "Invalid JSON response from server."
            );
        }


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
                "Request failed."
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Return Result
        |--------------------------------------------------------------------------
        */

        return result;
    };


    /*
    |--------------------------------------------------------------------------
    | Fetch Products
    |--------------------------------------------------------------------------
    */

    const fetchProducts = async () => {

        try {

            setLoading(true);
            setError("");


            const result =
                await fetchJson(
                    `${API_BASE}/products/index.php`
                );


            const productList =
                result?.data?.products;


            if (
                !Array.isArray(
                    productList
                )
            ) {

                throw new Error(
                    "Invalid products data received from server."
                );
            }


            setProducts(
                productList
            );


        } catch (error) {

            console.error(
                "Products Fetch Error:",
                error
            );


            setError(
                error.message ||
                "Unable to load products."
            );


        } finally {

            setLoading(false);

        }
    };


    /*
    |--------------------------------------------------------------------------
    | Fetch Categories
    |--------------------------------------------------------------------------
    */

    const fetchCategories = async () => {

        try {

            setCategoriesLoading(true);
            setCategoryError("");


            const result =
                await fetchJson(
                    `${API_BASE}/categories/index.php`
                );


            const categoryList =
                result?.data?.categories;


            if (
                !Array.isArray(
                    categoryList
                )
            ) {

                throw new Error(
                    "Invalid categories data received from server."
                );
            }


            setCategories(
                categoryList
            );


        } catch (error) {

            console.error(
                "Categories Fetch Error:",
                error
            );


            setCategoryError(
                error.message ||
                "Unable to load categories."
            );


        } finally {

            setCategoriesLoading(false);

        }
    };


    /*
    |--------------------------------------------------------------------------
    | Initial Load
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        fetchProducts();
        fetchCategories();

    }, []);


    /*
    |--------------------------------------------------------------------------
    | Search + Filters
    |--------------------------------------------------------------------------
    */

    const filteredProducts =
        useMemo(() => {

            const searchValue =
                search
                    .trim()
                    .toLowerCase();


            return products.filter(
                (product) => {

                    const productName =
                        String(
                            product.name || ""
                        ).toLowerCase();


                    const productSku =
                        String(
                            product.sku || ""
                        ).toLowerCase();


                    const matchesSearch =
                        searchValue === "" ||
                        productName.includes(
                            searchValue
                        ) ||
                        productSku.includes(
                            searchValue
                        );


                    const matchesCategory =
                        categoryFilter === "" ||
                        String(
                            product.category_id
                        ) ===
                        String(
                            categoryFilter
                        );


                    const matchesStatus =
                        statusFilter === "" ||
                        String(
                            product.status
                        ) ===
                        String(
                            statusFilter
                        );


                    return (
                        matchesSearch &&
                        matchesCategory &&
                        matchesStatus
                    );
                }
            );

        }, [
            products,
            search,
            categoryFilter,
            statusFilter
        ]);


    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const totalProducts =
        filteredProducts.length;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                totalProducts /
                ITEMS_PER_PAGE
            )
        );


    const safeCurrentPage =
        Math.min(
            currentPage,
            totalPages
        );


    const startIndex =
        (safeCurrentPage - 1) *
        ITEMS_PER_PAGE;


    const endIndex =
        Math.min(
            startIndex +
            ITEMS_PER_PAGE,
            totalProducts
        );


    const paginatedProducts =
        filteredProducts.slice(
            startIndex,
            endIndex
        );


    /*
    |--------------------------------------------------------------------------
    | Keep Current Page Valid
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (
            currentPage >
            totalPages
        ) {

            setCurrentPage(
                totalPages
            );
        }

    }, [
        currentPage,
        totalPages
    ]);


    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    const handleSearchChange = (
        event
    ) => {

        setSearch(
            event.target.value
        );

        setCurrentPage(1);
    };


    /*
    |--------------------------------------------------------------------------
    | Category Filter
    |--------------------------------------------------------------------------
    */

    const handleCategoryChange = (
        event
    ) => {

        setCategoryFilter(
            event.target.value
        );

        setCurrentPage(1);
    };


    /*
    |--------------------------------------------------------------------------
    | Status Filter
    |--------------------------------------------------------------------------
    */

    const handleStatusChange = (
        event
    ) => {

        setStatusFilter(
            event.target.value
        );

        setCurrentPage(1);
    };


    /*
    |--------------------------------------------------------------------------
    | Delete Product
    |--------------------------------------------------------------------------
    */

    const handleDelete = async (
        product
    ) => {

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${product.name}"?`
            );


        if (!confirmed) {
            return;
        }


        const token =
            localStorage.getItem(
                "admin_token"
            );


        if (!token) {

            alert(
                "Admin session expired. Please login again."
            );

            return;
        }


        try {

            setDeletingId(
                Number(product.id)
            );


            const result =
                await fetchJson(
                    `${API_BASE}/products/delete.php?id=${encodeURIComponent(
                        product.id
                    )}`,
                    {
                        method: "DELETE",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            /*
            |--------------------------------------------------------------------------
            | Remove From Current State
            |--------------------------------------------------------------------------
            */

            setProducts(
                (previousProducts) =>
                    previousProducts.filter(
                        (item) =>
                            Number(item.id) !==
                            Number(product.id)
                    )
            );


            alert(
                result.message ||
                "Product deleted successfully."
            );


        } catch (error) {

            console.error(
                "Delete Product Error:",
                error
            );


            alert(
                error.message ||
                "Unable to delete product."
            );


        } finally {

            setDeletingId(null);

        }
    };


    /*
    |--------------------------------------------------------------------------
    | Status Label
    |--------------------------------------------------------------------------
    */

    const getStatusLabel = (
        status
    ) => {

        switch (status) {

            case "active":
                return "Active";

            case "out_of_stock":
                return "Out of Stock";

            case "inactive":
                return "Inactive";

            default:
                return "Unknown";
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Status Class
    |--------------------------------------------------------------------------
    */

    const getStatusClass = (
        status
    ) => {

        switch (status) {

            case "active":
                return "bg-green-100 text-green-700";

            case "out_of_stock":
                return "bg-red-100 text-red-700";

            case "inactive":
                return "bg-slate-100 text-slate-600";

            default:
                return "bg-slate-100 text-slate-600";
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Stats
    |--------------------------------------------------------------------------
    */

    const activeCount =
        products.filter(
            (product) =>
                product.status ===
                "active"
        ).length;


    const outOfStockCount =
        products.filter(
            (product) =>
                product.status ===
                    "out_of_stock" ||
                Number(
                    product.stock
                ) === 0
        ).length;


    /*
    |--------------------------------------------------------------------------
    | Page Numbers
    |--------------------------------------------------------------------------
    */

    const pageNumbers =
        Array.from(
            {
                length: totalPages
            },
            (_, index) =>
                index + 1
        );


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div>

            {/* ================================================================
                HEADER
            ================================================================ */}

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                    <h1 className="font-heading text-2xl font-extrabold text-slate-900">
                        Products
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage your store products and inventory.
                    </p>

                </div>


                <Link
                    to="/admin/products/add"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                    <i className="fa-solid fa-plus" />
                    Add Product
                </Link>

            </div>


            {/* ================================================================
                STATS
            ================================================================ */}

            <div className="mb-6 grid gap-4 sm:grid-cols-3">

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <p className="text-sm text-slate-500">
                        Total Products
                    </p>

                    <p className="mt-2 text-2xl font-extrabold text-slate-900">
                        {products.length}
                    </p>

                </div>


                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <p className="text-sm text-slate-500">
                        Active Products
                    </p>

                    <p className="mt-2 text-2xl font-extrabold text-green-600">
                        {activeCount}
                    </p>

                </div>


                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <p className="text-sm text-slate-500">
                        Out of Stock
                    </p>

                    <p className="mt-2 text-2xl font-extrabold text-red-600">
                        {outOfStockCount}
                    </p>

                </div>

            </div>


            {/* ================================================================
                FILTERS
            ================================================================ */}

            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                <div className="flex flex-col gap-3 md:flex-row">

                    {/* Search */}

                    <div className="relative flex-1">

                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

                        <input
                            type="text"
                            value={search}
                            onChange={
                                handleSearchChange
                            }
                            placeholder="Search products..."
                            className="h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />

                    </div>


                    {/* Category */}

                    <select
                        value={categoryFilter}
                        onChange={
                            handleCategoryChange
                        }
                        disabled={
                            categoriesLoading
                        }
                        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500 disabled:bg-slate-50"
                    >

                        <option value="">
                            {categoriesLoading
                                ? "Loading Categories..."
                                : "All Categories"}
                        </option>


                        {categories.map(
                            (category) => (

                                <option
                                    key={
                                        category.id
                                    }
                                    value={
                                        category.id
                                    }
                                >
                                    {
                                        category.name
                                    }
                                </option>

                            )
                        )}

                    </select>


                    {/* Status */}

                    <select
                        value={statusFilter}
                        onChange={
                            handleStatusChange
                        }
                        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500"
                    >

                        <option value="">
                            All Status
                        </option>

                        <option value="active">
                            Active
                        </option>

                        <option value="out_of_stock">
                            Out of Stock
                        </option>

                        <option value="inactive">
                            Inactive
                        </option>

                    </select>

                </div>


                {categoryError && (

                    <p className="mt-2 text-xs text-red-500">
                        {categoryError}
                    </p>

                )}

            </div>


            {/* ================================================================
                PRODUCT ERROR
            ================================================================ */}

            {error && (

                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                    <i className="fa-solid fa-circle-exclamation mt-0.5" />

                    <div className="flex-1">
                        {error}
                    </div>

                    <button
                        type="button"
                        onClick={
                            fetchProducts
                        }
                        className="font-bold underline"
                    >
                        Retry
                    </button>

                </div>

            )}


            {/* ================================================================
                TABLE
            ================================================================ */}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[850px] text-left">

                        <thead className="border-b border-slate-200 bg-slate-50">

                            <tr className="text-xs uppercase tracking-wide text-slate-500">

                                <th className="px-5 py-4 font-bold">
                                    Product
                                </th>

                                <th className="px-5 py-4 font-bold">
                                    Category
                                </th>

                                <th className="px-5 py-4 font-bold">
                                    Price
                                </th>

                                <th className="px-5 py-4 font-bold">
                                    Stock
                                </th>

                                <th className="px-5 py-4 font-bold">
                                    Status
                                </th>

                                <th className="px-5 py-4 text-right font-bold">
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody className="divide-y divide-slate-100">

                            {/* Loading */}

                            {loading && (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="px-5 py-12 text-center text-sm text-slate-500"
                                    >

                                        <i className="fa-solid fa-spinner fa-spin mr-2" />

                                        Loading products...

                                    </td>

                                </tr>

                            )}


                            {/* Empty */}

                            {!loading &&
                                paginatedProducts.length ===
                                    0 && (

                                    <tr>

                                        <td
                                            colSpan="6"
                                            className="px-5 py-12 text-center"
                                        >

                                            <div className="text-slate-400">

                                                <i className="fa-solid fa-box-open text-3xl" />

                                            </div>


                                            <p className="mt-3 text-sm font-semibold text-slate-600">
                                                No products found.
                                            </p>


                                            <p className="mt-1 text-xs text-slate-400">
                                                Try changing your search or filters.
                                            </p>

                                        </td>

                                    </tr>

                                )}


                            {/* Products */}

                            {!loading &&
                                paginatedProducts.map(
                                    (product) => (

                                        <tr
                                            key={
                                                product.id
                                            }
                                            className="transition hover:bg-slate-50"
                                        >

                                            {/* Product */}

                                            <td className="px-5 py-4">

                                                <div className="flex items-center gap-3">

                                                    {product.image ? (

                                                        <img
                                                            src={
                                                                product.image
                                                            }
                                                            alt={
                                                                product.name
                                                            }
                                                            className="h-12 w-12 rounded-xl border border-slate-200 object-cover"
                                                        />

                                                    ) : (

                                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">

                                                            <i className="fa-solid fa-image" />

                                                        </div>

                                                    )}


                                                    <div>

                                                        <p className="text-sm font-bold text-slate-900">
                                                            {
                                                                product.name
                                                            }
                                                        </p>


                                                        <p className="mt-1 text-xs text-slate-400">

                                                            SKU:{" "}

                                                            {
                                                                product.sku ||
                                                                "-"
                                                            }

                                                        </p>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* Category */}

                                            <td className="px-5 py-4 text-sm text-slate-600">

                                                {
                                                    product.category_name ||
                                                    "-"
                                                }

                                            </td>


                                            {/* Price */}

                                            <td className="px-5 py-4 text-sm font-bold text-slate-900">

                                                ₹

                                                {Number(
                                                    product.price ||
                                                    0
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}

                                            </td>


                                            {/* Stock */}

                                            <td className="px-5 py-4">

                                                <span
                                                    className={`text-sm font-semibold ${
                                                        Number(
                                                            product.stock
                                                        ) === 0
                                                            ? "text-red-600"
                                                            : Number(
                                                                product.stock
                                                            ) <=
                                                            Number(
                                                                product.low_stock_limit ||
                                                                5
                                                            )
                                                                ? "text-orange-600"
                                                                : "text-slate-700"
                                                    }`}
                                                >

                                                    {
                                                        product.stock
                                                    }

                                                </span>

                                            </td>


                                            {/* Status */}

                                            <td className="px-5 py-4">

                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                                                        product.status
                                                    )}`}
                                                >

                                                    {getStatusLabel(
                                                        product.status
                                                    )}

                                                </span>

                                            </td>


                                            {/* Actions */}

                                            <td className="px-5 py-4">

                                                <div className="flex justify-end gap-2">

                                                    {/* View */}

                                                    <Link
                                                        to={`/product/${product.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                        title="View"
                                                    >

                                                        <i className="fa-regular fa-eye text-xs" />

                                                    </Link>


                                                    {/* Edit */}

                                                    <Link
                                                        to={`/admin/products/edit/${product.id}`}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                        title="Edit"
                                                    >

                                                        <i className="fa-solid fa-pen text-xs" />

                                                    </Link>


                                                    {/* Delete */}

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            deletingId ===
                                                            Number(
                                                                product.id
                                                            )
                                                        }
                                                        onClick={() =>
                                                            handleDelete(
                                                                product
                                                            )
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        title="Delete"
                                                    >

                                                        {deletingId ===
                                                            Number(
                                                                product.id
                                                            ) ? (

                                                            <i className="fa-solid fa-spinner fa-spin text-xs" />

                                                        ) : (

                                                            <i className="fa-solid fa-trash text-xs" />

                                                        )}

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )}

                        </tbody>

                    </table>

                </div>


                {/* ================================================================
                    PAGINATION
                ================================================================ */}

                {!loading && (

                    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                        <p className="text-xs text-slate-500">

                            {totalProducts ===
                                0

                                ? "Showing 0 products"

                                : `Showing ${
                                    startIndex +
                                    1
                                }–${endIndex} of ${totalProducts} products`}

                        </p>


                        {totalPages >
                            1 && (

                            <div className="flex items-center gap-2">

                                {/* Previous */}

                                <button
                                    type="button"
                                    disabled={
                                        safeCurrentPage ===
                                        1
                                    }
                                    onClick={() =>
                                        setCurrentPage(
                                            (
                                                page
                                            ) =>
                                                Math.max(
                                                    1,
                                                    page -
                                                    1
                                                )
                                        )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Previous"
                                >

                                    <i className="fa-solid fa-chevron-left text-xs" />

                                </button>


                                {/* Page Numbers */}

                                {pageNumbers.map(
                                    (page) => (

                                        <button
                                            key={
                                                page
                                            }
                                            type="button"
                                            onClick={() =>
                                                setCurrentPage(
                                                    page
                                                )
                                            }
                                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition ${
                                                safeCurrentPage ===
                                                page
                                                    ? "bg-blue-600 text-white"
                                                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >

                                            {
                                                page
                                            }

                                        </button>

                                    )
                                )}


                                {/* Next */}

                                <button
                                    type="button"
                                    disabled={
                                        safeCurrentPage ===
                                        totalPages
                                    }
                                    onClick={() =>
                                        setCurrentPage(
                                            (
                                                page
                                            ) =>
                                                Math.min(
                                                    totalPages,
                                                    page +
                                                    1
                                                )
                                        )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Next"
                                >

                                    <i className="fa-solid fa-chevron-right text-xs" />

                                </button>

                            </div>

                        )}

                    </div>

                )}

            </div>

        </div>
    );
}


export default Products;