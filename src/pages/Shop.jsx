import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function Shop() {
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  ============================================================
  API URLs
  ============================================================
  */

  const PRODUCTS_API =
    "http://localhost/ashrafbazar/backend/api/products/index.php";

  const CATEGORIES_API =
    "http://localhost/ashrafbazar/backend/api/categories/index.php";

  /*
  ============================================================
  FETCH PRODUCTS
  ============================================================
  */

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(PRODUCTS_API);

        if (!response.ok) {
          throw new Error(
            `Products API failed: ${response.status}`
          );
        }

        const result = await response.json();

        console.log("PRODUCTS API:", result);

        if (!result.success) {
          throw new Error(
            result.message || "Unable to load products."
          );
        }

        const apiProducts = result.data?.products || [];

        /*
        --------------------------------------------------------
        Convert API response into the structure used by
        the existing Shop UI.
        --------------------------------------------------------
        */

        const formattedProducts = apiProducts.map((product) => ({
          id: product.id,
          name: product.name,

          category:
            product.category_name ||
            product.category ||
            "Other",

          categorySlug:
            product.category_slug || "",

          price: Number(product.price || 0),

          oldPrice: Number(
            product.compare_price ||
              product.old_price ||
              product.oldPrice ||
              product.price ||
              0
          ),

          image:
            product.image ||
            product.thumbnail ||
            "/images/products/default-product.jpg",

          rating: Number(product.rating || 0),

          stock: Number(product.stock || 0),

          slug: product.slug || "",
        }));

        setProducts(formattedProducts);
      } catch (error) {
        console.error("Products API Error:", error);

        setError(
          error.message ||
            "Products load nahi ho pa rahe hain."
        );

        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  /*
  ============================================================
  FETCH CATEGORIES
  ============================================================
  */

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoryLoading(true);

        const response = await fetch(CATEGORIES_API);

        if (!response.ok) {
          throw new Error(
            `Categories API failed: ${response.status}`
          );
        }

        const result = await response.json();

        console.log("CATEGORIES API:", result);

        if (!result.success) {
          throw new Error(
            result.message || "Unable to load categories."
          );
        }

        const apiCategories =
          result.data?.categories || [];

        /*
        --------------------------------------------------------
        Keep the existing Shop category UI.
        "All" remains local, rest comes from API.
        --------------------------------------------------------
        */

        const formattedCategories = apiCategories
          .filter(
            (item) =>
              item.status === undefined ||
              item.status === 1 ||
              item.status === "1" ||
              item.status === "active"
          )
          .map((item) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            icon: item.icon || "",
          }));

        setCategories(formattedCategories);
      } catch (error) {
        console.error(
          "Categories API Error:",
          error
        );

        setCategories([]);
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, []);

  /*
  ============================================================
  CATEGORY FILTER + SORT
  ============================================================
  */

  const filteredProducts = useMemo(() => {
    let result = [...products];

    /*
    ----------------------------------------------------------
    Category filter
    ----------------------------------------------------------
    */

    if (category !== "All") {
      result = result.filter(
        (product) =>
          product.category === category
      );
    }

    /*
    ----------------------------------------------------------
    Sorting
    ----------------------------------------------------------
    */

    if (sort === "low") {
      result.sort(
        (a, b) => a.price - b.price
      );
    }

    if (sort === "high") {
      result.sort(
        (a, b) => b.price - a.price
      );
    }

    if (sort === "name") {
      result.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }

    return result;
  }, [products, category, sort]);

  /*
  ============================================================
  PRODUCT IMAGE FALLBACK
  ============================================================
  */

  const getProductImage = (product) => {
    if (!product.image) {
      return "/images/products/default-product.jpg";
    }

    return product.image;
  };

  /*
  ============================================================
  DISCOUNT
  ============================================================
  */

  const getDiscount = (product) => {
    if (
      !product.oldPrice ||
      product.oldPrice <= product.price
    ) {
      return 0;
    }

    return Math.round(
      ((product.oldPrice - product.price) /
        product.oldPrice) *
        100
    );
  };

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <main className="min-h-screen bg-slate-50">

      {/* =====================================================
          SHOP HEADER
      ===================================================== */}

      <section className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">


          

          {/* Title */}

          <div className="mt-3 flex items-end justify-between gap-3">

            {/* Product count */}

            <div className="hidden shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 sm:block">
              {loading
                ? "Loading..."
                : `${filteredProducts.length} Products`}
            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          SHOP CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">

        {/* =================================================
            CATEGORY + SORT
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4">

          {/* =================================================
              CATEGORIES
          ================================================= */}

          <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 p-3 shadow-sm ring-1 ring-blue-100 sm:p-4">

            {/* Category Heading */}

            <div className="mb-3 flex items-center gap-2 px-1">

              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <i className="fa-solid fa-layer-group text-[11px]" />
              </div>

              <span className="text-xs font-bold text-slate-800 sm:text-sm">
                Shop by Category
              </span>

            </div>

            {/* Category Buttons */}

            <div className="overflow-x-auto pb-1 scrollbar-hide">

              <div className="flex min-w-max gap-2">

                {/* All */}

                <button
                  type="button"
                  onClick={() => setCategory("All")}
                  className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 sm:text-sm ${
                    category === "All"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-200"
                      : "border border-white/80 bg-white/80 text-slate-600 shadow-sm backdrop-blur-sm hover:border-blue-200 hover:bg-white hover:text-blue-600 hover:shadow-md"
                  }`}
                >
                  All
                </button>

                {/* API Categories */}

                {categoryLoading ? (
                  <>
                    {[1, 2, 3, 4].map(
                      (item) => (
                        <div
                          key={item}
                          className="h-10 w-24 animate-pulse rounded-xl bg-white/80"
                        />
                      )
                    )}
                  </>
                ) : categories.length > 0 ? (
                  categories.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setCategory(item.name)
                      }
                      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 sm:text-sm ${
                        category === item.name
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-200"
                          : "border border-white/80 bg-white/80 text-slate-600 shadow-sm backdrop-blur-sm hover:border-blue-200 hover:bg-white hover:text-blue-600 hover:shadow-md"
                      }`}
                    >
                      {item.name}
                    </button>
                  ))
                ) : (
                  <span className="px-3 py-2 text-xs text-slate-400">
                    Categories unavailable
                  </span>
                )}

              </div>

            </div>

          </div>

          {/* =================================================
              RESULT + SORT
          ================================================= */}

          <div className="flex items-center justify-between gap-3">

            {/* Result Count */}

            <div className="flex items-center gap-2">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-slate-200 sm:h-9 sm:w-9">
                <i className="fa-solid fa-box text-xs" />
              </div>

              <p className="text-xs text-slate-500 sm:text-sm">

                Showing{" "}

                <span className="font-bold text-slate-800">
                  {loading
                    ? "..."
                    : filteredProducts.length}
                </span>{" "}

                products

              </p>

            </div>

            {/* Sort */}

            <div className="relative w-40 sm:w-48">

              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value)
                }
                className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:h-11 sm:px-4 sm:text-sm"
              >

                <option value="default">
                  Featured
                </option>

                <option value="low">
                  Price: Low to High
                </option>

                <option value="high">
                  Price: High to Low
                </option>

                <option value="name">
                  Name: A to Z
                </option>

              </select>

              <i className="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 sm:right-4 sm:text-xs" />

            </div>

          </div>

        </div>

        {/* =====================================================
            ACTIVE CATEGORY
        ===================================================== */}

        {category !== "All" && (

          <div className="mb-5 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">

            <div className="flex items-center gap-2">

              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white">
                <i className="fa-solid fa-filter text-[9px]" />
              </div>

              <span className="text-xs font-semibold text-blue-700">
                {category}
              </span>

            </div>

            <button
              type="button"
              onClick={() => setCategory("All")}
              className="rounded-lg px-2 py-1 text-xs font-bold text-blue-600 transition hover:bg-blue-100 hover:text-blue-700"
            >
              Clear
            </button>

          </div>

        )}

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && !loading && (

          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-center">

            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500">
              <i className="fa-solid fa-triangle-exclamation" />
            </div>

            <h2 className="mt-3 text-sm font-bold text-red-700">
              Products load nahi ho pa rahe hain
            </h2>

            <p className="mt-1 text-xs text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              Retry
            </button>

          </div>

        )}

        {/* =====================================================
            PRODUCTS
        ===================================================== */}

        {loading ? (

          /* ===================================================
              LOADING SKELETON
          =================================================== */

          <div className="grid grid-cols-3 gap-x-2.5 gap-y-7 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">

            {Array.from({ length: 8 }).map(
              (_, index) => (

                <div
                  key={index}
                  className="min-w-0"
                >

                  <div className="aspect-square animate-pulse rounded-2xl bg-slate-200" />

                  <div className="mt-3 h-3 w-4/5 animate-pulse rounded bg-slate-200" />

                  <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-200" />

                </div>

              )
            )}

          </div>

        ) : filteredProducts.length > 0 ? (

          <div className="grid grid-cols-3 gap-x-2.5 gap-y-7 sm:gap-5 lg:grid-cols-4 lg:gap-6">

            {filteredProducts.map(
              (product) => {

                const discount =
                  getDiscount(product);

                return (

                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="group min-w-0"
                  >

                    {/* Product Image */}

                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md">

                      <img
                        src={getProductImage(
                          product
                        )}
                        alt={product.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src =
                            "/images/products/default-product.jpg";
                        }}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Discount */}

                      {discount > 0 && (

                        <span className="absolute left-1.5 top-1.5 rounded-md bg-red-500 px-1.5 py-1 text-[8px] font-bold text-white shadow-sm sm:left-2 sm:top-2 sm:text-[10px]">
                          {discount}% OFF
                        </span>

                      )}

                      {/* Rating */}

                      {product.rating > 0 && (

                        <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-1 text-[8px] font-bold text-slate-800 shadow-sm backdrop-blur-sm sm:bottom-2 sm:left-2 sm:text-[10px]">

                          <i className="fa-solid fa-star text-[7px] text-yellow-500 sm:text-[8px]" />

                          {product.rating}

                        </span>

                      )}

                    </div>

                    {/* Product Info */}

                    <div className="px-0.5">

                      {/* Product Name */}

                      <h2 className="mt-2 truncate text-[11px] font-bold text-slate-800 transition-colors group-hover:text-blue-600 sm:text-sm">
                        {product.name}
                      </h2>

                      {/* Price */}

                      <div className="mt-1 flex items-center gap-1.5 sm:gap-2">

                        <span className="text-[11px] font-extrabold text-slate-900 sm:text-sm">
                          ₹{product.price}
                        </span>

                        {product.oldPrice >
                          product.price && (

                          <span className="text-[9px] text-slate-400 line-through sm:text-xs">
                            ₹{product.oldPrice}
                          </span>

                        )}

                      </div>

                    </div>

                  </Link>

                );
              }
            )}

          </div>

        ) : (

          /* ===================================================
              EMPTY STATE
          =================================================== */

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">

              <i className="fa-solid fa-box-open text-xl" />

            </div>

            <h2 className="mt-4 font-heading text-lg font-bold text-slate-900">
              No products found
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              No products are available in this category.
            </p>

            {category !== "All" && (

              <button
                type="button"
                onClick={() =>
                  setCategory("All")
                }
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 sm:text-sm"
              >
                View All Products
              </button>

            )}

          </div>

        )}

      </section>

      {/* =====================================================
          LOCAL DELIVERY
      ===================================================== */}

      <section className="border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">

          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 p-4 ring-1 ring-blue-100 sm:p-5">

            {/* Icon */}

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">

              <i className="fa-solid fa-truck" />

            </div>

            {/* Content */}

            <div>

              <h3 className="text-sm font-bold text-slate-900">
                Local Delivery
              </h3>

              <p className="mt-0.5 text-[11px] text-slate-600 sm:text-xs">
                Currently available in Simri Bakhtiyarpur.
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Shop;