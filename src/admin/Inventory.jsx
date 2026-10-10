import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE =
  "http://localhost/ashrafbazar/backend/api";

const PRODUCTS_API =
  `${API_BASE}/products/index.php`;

const INVENTORY_API =
  `${API_BASE}/inventory/create.php`;

const CATEGORIES_API =
  `${API_BASE}/categories/index.php`;

function Inventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");

  // Only true during FIRST page load.
  const [loading, setLoading] = useState(true);

  // Used for background refresh.
  const [refreshing, setRefreshing] = useState(false);

  // Used for individual stock actions.
  const [actionLoading, setActionLoading] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | ADMIN TOKEN
  |--------------------------------------------------------------------------
  */

  const getAdminToken = () => {
    return localStorage.getItem("admin_token");
  };

  /*
  |--------------------------------------------------------------------------
  | HEADERS
  |--------------------------------------------------------------------------
  */

  const getHeaders = () => {
    const token = getAdminToken();

    return {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  /*
  |--------------------------------------------------------------------------
  | PARSE API RESPONSE
  |--------------------------------------------------------------------------
  */

  const parseResponse = async (response) => {
    const text = await response.text();

    let result = null;

    try {
      result = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(
        "Server returned an invalid response."
      );
    }

    if (!response.ok || !result?.success) {
      throw new Error(
        result?.message ||
          "Unable to complete request."
      );
    }

    return result;
  };

  /*
  |--------------------------------------------------------------------------
  | STOCK STATUS
  |--------------------------------------------------------------------------
  */

  const getStockStatus = (
    stock,
    lowStockLimit
  ) => {
    const quantity = Number(stock) || 0;
    const limit = Number(lowStockLimit) || 0;

    if (quantity <= 0) {
      return "Out of Stock";
    }

    if (limit > 0 && quantity <= limit) {
      return "Low Stock";
    }

    return "In Stock";
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD PRODUCTS
  |--------------------------------------------------------------------------
  */

  const loadProducts = useCallback(
    async () => {
      const token = getAdminToken();

      if (!token) {
        throw new Error(
          "Admin session expired. Please login again."
        );
      }

      const response = await fetch(
        `${PRODUCTS_API}?page=1&limit=1000`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      const result =
        await parseResponse(response);

      const rawProducts =
        Array.isArray(
          result?.data?.products
        )
          ? result.data.products
          : Array.isArray(result?.data)
          ? result.data
          : [];

      const formattedProducts =
        rawProducts.map((product) => {
          const stock =
            Number(product.stock) || 0;

          const lowStock =
            Number(
              product.low_stock_limit ??
                product.lowStock ??
                0
            ) || 0;

          return {
            ...product,

            id: Number(product.id),

            name:
              product.name ||
              "Unnamed Product",

            sku:
              product.sku || "—",

            category:
              product.category_name ||
              product.category ||
              "Uncategorized",

            categoryId:
              Number(
                product.category_id
              ) || null,

            stock,

            lowStock,

            price:
              Number(product.price) || 0,

            status: getStockStatus(
              stock,
              lowStock
            ),
          };
        });

      setProducts(formattedProducts);
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | LOAD CATEGORIES
  |--------------------------------------------------------------------------
  */

  const loadCategories = useCallback(
    async () => {
      try {
        const response = await fetch(
          CATEGORIES_API,
          {
            method: "GET",
            headers: {
              Accept:
                "application/json",
            },
          }
        );

        const result =
          await parseResponse(response);

        const rawCategories =
          Array.isArray(
            result?.data?.categories
          )
            ? result.data.categories
            : Array.isArray(
                result?.data
              )
            ? result.data
            : [];

        const activeCategories =
          rawCategories.filter(
            (item) =>
              item.status === undefined ||
              item.status === "active"
          );

        setCategories(
          activeCategories
        );
      } catch (err) {
        console.error(
          "Category load error:",
          err
        );

        // Categories should not break inventory.
        setCategories([]);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | LOAD INVENTORY
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | showLoader = true only on FIRST load.
  |
  */

  const loadInventory = useCallback(
    async (showLoader = false) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        await Promise.all([
          loadProducts(),
          loadCategories(),
        ]);
      } catch (err) {
        console.error(
          "Inventory load error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load inventory."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      loadProducts,
      loadCategories,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadInventory(true);
  }, [loadInventory]);

  /*
  |--------------------------------------------------------------------------
  | SUCCESS AUTO HIDE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success]);

  /*
  |--------------------------------------------------------------------------
  | FILTERED PRODUCTS
  |--------------------------------------------------------------------------
  */

  const filteredProducts = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return products.filter(
      (product) => {
        const matchesSearch =
          !searchText ||
          String(product.name)
            .toLowerCase()
            .includes(searchText) ||
          String(product.sku)
            .toLowerCase()
            .includes(searchText);

        const matchesCategory =
          category === "All" ||
          String(product.category) ===
            category;

        const matchesStock =
          stockFilter === "All" ||
          product.status ===
            stockFilter;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesStock
        );
      }
    );
  }, [
    products,
    search,
    category,
    stockFilter,
  ]);

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const totalProducts =
    products.length;

  const totalUnits =
    products.reduce(
      (total, product) =>
        total +
        (Number(product.stock) || 0),
      0
    );

  const lowStockProducts =
    products.filter(
      (product) =>
        product.status ===
        "Low Stock"
    ).length;

  const outOfStockProducts =
    products.filter(
      (product) =>
        product.status ===
        "Out of Stock"
    ).length;

  /*
  |--------------------------------------------------------------------------
  | CATEGORY OPTIONS
  |--------------------------------------------------------------------------
  */

  const categoryOptions = useMemo(() => {
    const names =
      categories
        .map((item) => item.name)
        .filter(Boolean);

    if (names.length === 0) {
      return [
        ...new Set(
          products
            .map(
              (product) =>
                product.category
            )
            .filter(Boolean)
        ),
      ];
    }

    return [
      ...new Set(names),
    ];
  }, [
    categories,
    products,
  ]);

  /*
  |--------------------------------------------------------------------------
  | STOCK ADJUSTMENT
  |--------------------------------------------------------------------------
  */

  const adjustStock = async (
    product,
    quantity,
    note
  ) => {
    if (
      !product ||
      !product.id
    ) {
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity === 0
    ) {
      return;
    }

    const currentStock =
      Number(product.stock) || 0;

    /*
    |--------------------------------------------------------------------------
    | PREVENT NEGATIVE STOCK
    |--------------------------------------------------------------------------
    */

    if (
      quantity < 0 &&
      currentStock + quantity < 0
    ) {
      window.alert(
        "Stock cannot be negative."
      );

      return;
    }

    const actionKey =
      `${product.id}:${quantity}`;

    try {
      setActionLoading(actionKey);
      setError("");

      const token =
        getAdminToken();

      if (!token) {
        throw new Error(
          "Admin session expired. Please login again."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | INVENTORY API
      |--------------------------------------------------------------------------
      */

      const response = await fetch(
        INVENTORY_API,
        {
          method: "POST",

          headers: {
            ...getHeaders(),
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            product_id:
              Number(product.id),

            type: "adjustment",

            quantity: quantity,

            reference_type:
              "manual",

            reference_id: null,

            note:
              note ||
              (
                quantity > 0
                  ? "Manual stock increase"
                  : "Manual stock decrease"
              ),
          }),
        }
      );

      await parseResponse(
        response
      );

      /*
      |--------------------------------------------------------------------------
      | REFRESH DATA WITHOUT FULL PAGE BLINK
      |--------------------------------------------------------------------------
      */

      await loadProducts();

      setSuccess(
        quantity > 0
          ? `${product.name} stock increased by ${quantity}.`
          : `${product.name} stock decreased by ${Math.abs(
              quantity
            )}.`
      );
    } catch (err) {
      console.error(
        "Inventory adjustment error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update stock."
      );
    } finally {
      setActionLoading(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INCREASE
  |--------------------------------------------------------------------------
  */

  const increaseStock = (product) => {
    adjustStock(
      product,
      1,
      "Manual stock increase"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | DECREASE
  |--------------------------------------------------------------------------
  */

  const decreaseStock = (product) => {
    if (
      Number(product.stock) <= 0
    ) {
      return;
    }

    adjustStock(
      product,
      -1,
      "Manual stock decrease"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | MANUAL STOCK
  |--------------------------------------------------------------------------
  */

  const handleManualStock = (
    product
  ) => {
    const currentStock =
      Number(product.stock) || 0;

    const value = window.prompt(
      `Enter new stock quantity for ${product.name}`,
      String(currentStock)
    );

    if (value === null) {
      return;
    }

    const newStock =
      Number(value.trim());

    if (
      !Number.isInteger(newStock) ||
      newStock < 0
    ) {
      window.alert(
        "Please enter a valid whole number greater than or equal to 0."
      );

      return;
    }

    if (
      newStock === currentStock
    ) {
      return;
    }

    const difference =
      newStock - currentStock;

    const confirmed =
      window.confirm(
        `Change ${product.name} stock from ${currentStock} to ${newStock}?`
      );

    if (!confirmed) {
      return;
    }

    adjustStock(
      product,
      difference,
      `Manual stock adjustment: ${currentStock} → ${newStock}`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS STYLE
  |--------------------------------------------------------------------------
  */

  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case "In Stock":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";

      case "Low Stock":
        return "bg-amber-50 text-amber-700 border border-amber-100";

      case "Out of Stock":
        return "bg-red-50 text-red-700 border border-red-100";

      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PRICE FORMAT
  |--------------------------------------------------------------------------
  */

  const formatPrice = (
    value
  ) => {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;
  };

  /*
  |--------------------------------------------------------------------------
  | IMAGE URL
  |--------------------------------------------------------------------------
  */

  const getProductImage = (
    product
  ) => {
    if (!product?.image) {
      return "";
    }

    if (
      String(
        product.image
      ).startsWith("http")
    ) {
      return product.image;
    }

    return `${API_BASE.replace(
      "/api",
      ""
    )}/uploads/products/${String(
      product.image
    ).replace(/^\/+/, "")}`;
  };

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">

        <div className="mb-6">

          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-100" />

        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}

        </div>

        <div className="mt-6 h-96 animate-pulse rounded-2xl border border-slate-200 bg-white" />

      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto max-w-7xl">

      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">

              <i className="fa-solid fa-boxes-stacked" />

            </div>

            <div>

              <h1 className="font-heading text-2xl font-extrabold text-slate-900">
                Inventory
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Monitor and manage your real-time product stock.
              </p>

            </div>

          </div>

        </div>

        {/* REFRESH */}

        <button
          type="button"
          onClick={() =>
            loadInventory(false)
          }
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >

          <i
            className={`fa-solid fa-rotate-right ${
              refreshing
                ? "fa-spin"
                : ""
            }`}
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}

        </button>

      </div>

      {/* ================================================================
          SUCCESS
      ================================================================ */}

      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">

          <i className="fa-solid fa-circle-check mt-0.5" />

          <p className="font-semibold">
            {success}
          </p>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
            className="ml-auto text-emerald-600 hover:text-emerald-800"
          >
            <i className="fa-solid fa-xmark" />
          </button>

        </div>
      )}

      {/* ================================================================
          ERROR
      ================================================================ */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">

          <i className="fa-solid fa-circle-exclamation mt-0.5" />

          <div>

            <p className="font-bold">
              Inventory Error
            </p>

            <p className="mt-0.5">
              {error}
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <i className="fa-solid fa-xmark" />
          </button>

        </div>
      )}

      {/* ================================================================
          STATS
      ================================================================ */}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

        {/* PRODUCTS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Products
              </p>

              <p className="mt-2 font-heading text-2xl font-extrabold text-slate-900">
                {totalProducts}
              </p>

            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

              <i className="fa-solid fa-boxes-stacked" />

            </span>

          </div>

        </div>

        {/* UNITS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Total Units
              </p>

              <p className="mt-2 font-heading text-2xl font-extrabold text-slate-900">
                {totalUnits.toLocaleString(
                  "en-IN"
                )}
              </p>

            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">

              <i className="fa-solid fa-cubes" />

            </span>

          </div>

        </div>

        {/* LOW STOCK */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Low Stock
              </p>

              <p className="mt-2 font-heading text-2xl font-extrabold text-amber-600">
                {lowStockProducts}
              </p>

            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">

              <i className="fa-solid fa-triangle-exclamation" />

            </span>

          </div>

        </div>

        {/* OUT OF STOCK */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Out of Stock
              </p>

              <p className="mt-2 font-heading text-2xl font-extrabold text-red-600">
                {outOfStockProducts}
              </p>

            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">

              <i className="fa-solid fa-circle-xmark" />

            </span>

          </div>

        </div>

      </div>

      {/* ================================================================
          FILTERS
      ================================================================ */}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="grid gap-3 md:grid-cols-[1fr_210px_190px]">

          {/* SEARCH */}

          <div className="relative">

            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search product or SKU..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

          </div>

          {/* CATEGORY */}

          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >

            <option value="All">
              All Categories
            </option>

            {categoryOptions.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}

          </select>

          {/* STOCK FILTER */}

          <select
            value={stockFilter}
            onChange={(event) =>
              setStockFilter(
                event.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >

            <option value="All">
              All Stock
            </option>

            <option value="In Stock">
              In Stock
            </option>

            <option value="Low Stock">
              Low Stock
            </option>

            <option value="Out of Stock">
              Out of Stock
            </option>

          </select>

        </div>

      </div>

      {/* ================================================================
          RESULT COUNT
      ================================================================ */}

      <div className="mb-3 flex items-center justify-between">

        <p className="text-sm font-semibold text-slate-500">

          Showing{" "}

          <span className="font-bold text-slate-800">
            {filteredProducts.length}
          </span>

          {" "}of{" "}

          <span className="font-bold text-slate-800">
            {products.length}
          </span>

          {" "}products

        </p>

      </div>

      {/* ================================================================
          DESKTOP TABLE
      ================================================================ */}

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1050px]">

            <thead className="border-b border-slate-200 bg-slate-50">

              <tr>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Product
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Category
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Price
                </th>

                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Stock
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

              {filteredProducts.map(
                (product) => {

                  const minusLoading =
                    actionLoading ===
                    `${product.id}:-1`;

                  const plusLoading =
                    actionLoading ===
                    `${product.id}:1`;

                  const image =
                    getProductImage(
                      product
                    );

                  return (
                    <tr
                      key={
                        product.id
                      }
                      className="transition hover:bg-slate-50"
                    >

                      {/* PRODUCT */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          {image ? (
                            <img
                              src={image}
                              alt={
                                product.name
                              }
                              className="h-11 w-11 rounded-xl border border-slate-200 object-cover"
                              onError={(
                                event
                              ) => {
                                event.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">

                              <i className="fa-solid fa-box" />

                            </div>
                          )}

                          <div>

                            <p className="font-bold text-slate-900">
                              {product.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              SKU:{" "}
                              {product.sku}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* CATEGORY */}

                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {product.category}
                      </td>

                      {/* PRICE */}

                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatPrice(
                          product.price
                        )}
                      </td>

                      {/* STOCK */}

                      <td className="px-6 py-4">

                        <span className="font-heading text-lg font-extrabold text-slate-900">
                          {product.stock}
                        </span>

                        <span className="ml-1 text-xs text-slate-400">
                          units
                        </span>

                        {product.lowStock >
                          0 && (
                          <p className="mt-1 text-[11px] text-slate-400">
                            Alert at{" "}
                            {product.lowStock}
                          </p>
                        )}

                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClass(
                            product.status
                          )}`}
                        >
                          {product.status}
                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">

                          {/* MINUS */}

                          <button
                            type="button"
                            onClick={() =>
                              decreaseStock(
                                product
                              )
                            }
                            disabled={
                              product.stock <=
                                0 ||
                              actionLoading !==
                                null
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Decrease Stock"
                          >

                            {minusLoading ? (
                              <i className="fa-solid fa-spinner fa-spin text-xs" />
                            ) : (
                              <i className="fa-solid fa-minus text-xs" />
                            )}

                          </button>

                          {/* PLUS */}

                          <button
                            type="button"
                            onClick={() =>
                              increaseStock(
                                product
                              )
                            }
                            disabled={
                              actionLoading !==
                              null
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Increase Stock"
                          >

                            {plusLoading ? (
                              <i className="fa-solid fa-spinner fa-spin text-xs" />
                            ) : (
                              <i className="fa-solid fa-plus text-xs" />
                            )}

                          </button>

                          {/* MANUAL */}

                          <button
                            type="button"
                            onClick={() =>
                              handleManualStock(
                                product
                              )
                            }
                            disabled={
                              actionLoading !==
                              null
                            }
                            className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Set Stock"
                          >

                            <i className="fa-solid fa-pen" />

                            Set

                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ================================================================
          MOBILE
      ================================================================ */}

      <div className="grid gap-4 lg:hidden">

        {filteredProducts.map(
          (product) => {

            const minusLoading =
              actionLoading ===
              `${product.id}:-1`;

            const plusLoading =
              actionLoading ===
              `${product.id}:1`;

            const image =
              getProductImage(
                product
              );

            return (
              <div
                key={
                  product.id
                }
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >

                {/* TOP */}

                <div className="flex items-start justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-3">

                    {image ? (
                      <img
                        src={image}
                        alt={
                          product.name
                        }
                        className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">

                        <i className="fa-solid fa-box" />

                      </div>
                    )}

                    <div className="min-w-0">

                      <h3 className="truncate font-bold text-slate-900">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        {product.sku}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {product.category}
                      </p>

                    </div>

                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
                      product.status
                    )}`}
                  >
                    {product.status}
                  </span>

                </div>

                {/* INFO */}

                <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-4">

                  <div>

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Price
                    </p>

                    <p className="mt-1 font-extrabold text-slate-900">
                      {formatPrice(
                        product.price
                      )}
                    </p>

                  </div>

                  <div>

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Current Stock
                    </p>

                    <p className="mt-1 font-extrabold text-slate-900">
                      {product.stock}{" "}
                      <span className="text-xs font-medium text-slate-400">
                        units
                      </span>
                    </p>

                  </div>

                </div>

                {/* ACTIONS */}

                <div className="mt-4 flex items-center justify-end gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      decreaseStock(
                        product
                      )
                    }
                    disabled={
                      product.stock <=
                        0 ||
                      actionLoading !==
                        null
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >

                    {minusLoading ? (
                      <i className="fa-solid fa-spinner fa-spin text-xs" />
                    ) : (
                      <i className="fa-solid fa-minus text-xs" />
                    )}

                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      increaseStock(
                        product
                      )
                    }
                    disabled={
                      actionLoading !==
                      null
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >

                    {plusLoading ? (
                      <i className="fa-solid fa-spinner fa-spin text-xs" />
                    ) : (
                      <i className="fa-solid fa-plus text-xs" />
                    )}

                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleManualStock(
                        product
                      )
                    }
                    disabled={
                      actionLoading !==
                      null
                    }
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    <i className="fa-solid fa-pen" />

                    Update Stock

                  </button>

                </div>

              </div>
            );
          }
        )}

      </div>

      {/* ================================================================
          EMPTY
      ================================================================ */}

      {!loading &&
        filteredProducts.length ===
          0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

              <i className="fa-solid fa-box-open text-2xl" />

            </div>

            <h3 className="mt-4 font-heading text-lg font-extrabold text-slate-800">
              No inventory found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try another product, category or stock filter.
            </p>

            {(search ||
              category !== "All" ||
              stockFilter !==
                "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                  setStockFilter("All");
                }}
                className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}

          </div>
        )}

    </div>
  );
}

export default Inventory;