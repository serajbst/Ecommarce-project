import { useState, useEffect } from "react";
import HeroSlider from "../components/HeroSlider";
import FeaturedProducts from "../components/FeaturedProducts";
import { Link } from "react-router-dom";
import About from "./About"; 
const API_BASE = "http://localhost/ashrafbazar/backend/api";
/* =========================================================
   IMAGE URL HELPER
========================================================= */
function getImageUrl(imagePath) {
  if (!imagePath || typeof imagePath !== "string") {
    return "";
  }

  const trimmed = imagePath.trim();

  if (!trimmed) {
    return "";
  }

  // Absolute URL
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Protocol-relative URL
  if (trimmed.startsWith("//")) {
    return `http:${trimmed}`;
  }

  // Remove leading slash
  const normalized = trimmed.replace(/^\/+/, "");

  // Backend root
  const backendRoot = API_BASE.replace(/\/api\/?$/, "");

  // Already starts with uploads/
  if (normalized.startsWith("uploads/")) {
    return `${backendRoot}/${normalized}`;
  }

  // Directory path such as products/image.jpg
  if (normalized.includes("/")) {
    return `${backendRoot}/uploads/${normalized}`;
  }

  // Plain filename
  return `${backendRoot}/uploads/${normalized}`;
}

/* =========================================================
   FALLBACK IMAGE
========================================================= */
const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">' +
      '<rect width="200" height="200" fill="#f1f5f9"/>' +
      '<path d="M60 130l25-30 20 22 18-20 17 28H60z" fill="#cbd5e1"/>' +
      '<circle cx="75" cy="75" r="12" fill="#cbd5e1"/>' +
      "</svg>"
  );

/* =========================================================
   IMAGE ERROR HANDLER
========================================================= */
function handleImageError(e) {
  if (
    e &&
    e.currentTarget &&
    e.currentTarget.src !== FALLBACK_IMAGE
  ) {
    e.currentTarget.src = FALLBACK_IMAGE;
  }
}

/* =========================================================
   NUMBER HELPER
========================================================= */
function toNumber(value, fallback = 0) {
  const number =
    typeof value === "number"
      ? value
      : parseFloat(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

/* =========================================================
   EXTRACT API ARRAY
========================================================= */
function extractArray(json, type = "") {
  if (!json || typeof json !== "object") {
    return [];
  }

  // API explicitly returned failure
  if (json.success === false) {
    return [];
  }

  // Direct:
  // data: [...]
  if (Array.isArray(json.data)) {
    return json.data;
  }

  // Products API:
  // data: {
  //   products: [...]
  // }
  if (
    type === "products" &&
    Array.isArray(json.data?.products)
  ) {
    return json.data.products;
  }

  // Categories API:
  // data: {
  //   categories: [...]
  // }
  if (
    type === "categories" &&
    Array.isArray(json.data?.categories)
  ) {
    return json.data.categories;
  }

  // Extra fallback:
  // products: [...]
  if (
    type === "products" &&
    Array.isArray(json.products)
  ) {
    return json.products;
  }

  // Extra fallback:
  // categories: [...]
  if (
    type === "categories" &&
    Array.isArray(json.categories)
  ) {
    return json.categories;
  }

  // Raw array
  if (Array.isArray(json)) {
    return json;
  }

  return [];
}

/* =========================================================
   NORMALIZE PRODUCT
========================================================= */
function normalizeProduct(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = raw.id ?? raw.product_id;

  if (id === undefined || id === null) {
    return null;
  }

  return {
    id,
    name: raw.name ?? "",
    image: raw.image ?? raw.thumbnail ?? "",

    rating: toNumber(raw.rating, 0),

    reviewCount: toNumber(
      raw.review_count ??
      raw.reviewCount ??
      raw.reviews_count,
      0
    ),

    stock: toNumber(raw.stock, 0),

    status: raw.status ?? "",

    inStock:
      raw.stock !== undefined &&
      Number(raw.stock) > 0,

    outOfStock:
      raw.stock !== undefined &&
      Number(raw.stock) <= 0,
  };
}

/* =========================================================
   NORMALIZE CATEGORY
========================================================= */
function normalizeCategory(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = raw.id ?? raw.category_id;

  if (id === undefined || id === null) {
    return null;
  }

  const slug = raw.slug ?? String(id);

  if (!slug) {
    return null;
  }

  return {
    id,
    name: raw.name ?? "",
    slug,
    image: raw.image ?? "",
    sortOrder: toNumber(
      raw.sort_order ?? raw.sortOrder,
      0
    ),
    status: raw.status,
  };
}

/* =========================================================
   ACTIVE STATUS CHECK
========================================================= */
function isActive(item) {
  if (!item) {
    return false;
  }

  const status = item.status;

  // If API doesn't provide status,
  // don't unnecessarily hide item.
  if (
    status === undefined ||
    status === null ||
    status === ""
  ) {
    return true;
  }

  if (typeof status === "number") {
    return status === 1;
  }

  if (typeof status === "boolean") {
    return status;
  }

  const value = String(status).toLowerCase();

  return (
    value === "1" ||
    value === "active" ||
    value === "true" ||
    value === "yes"
  );
}

/* =========================================================
   HOME
========================================================= */
function Home() {
  const [reviewedProducts, setReviewedProducts] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [productsLoading, setProductsLoading] =
    useState(true);

  const [categoriesLoading, setCategoriesLoading] =
    useState(true);

  const [productsError, setProductsError] =
    useState(false);

  const [categoriesError, setCategoriesError] =
    useState(false);

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */
  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setProductsLoading(true);
      setProductsError(false);

      try {
        const response = await fetch(
          `${API_BASE}/products/index.php`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Products API returned ${response.status}`
          );
        }

        const json =
          await response.json().catch(() => null);

        if (!json) {
          throw new Error(
            "Invalid products API response."
          );
        }

        if (json.success === false) {
          throw new Error(
            json.message ||
              "Unable to load products."
          );
        }

        /*
         * IMPORTANT:
         * Backend returns:
         *
         * data: {
         *   products: [...]
         * }
         *
         * So type = "products"
         * is required here.
         */
        const list = extractArray(
          json,
          "products"
        );

       const normalized = list
  .map(normalizeProduct)
  .filter(Boolean)
  .filter((product) =>
    product.status === "active" ||
    product.status === "out_of_stock"
  );

        /*
         * Popular products:
         *
         * 1. Products with reviews first
         * 2. More reviews first
         * 3. Higher rating first
         */
        normalized.sort((a, b) => {
          const aHasReviews =
            a.reviewCount > 0 ? 1 : 0;

          const bHasReviews =
            b.reviewCount > 0 ? 1 : 0;

          if (
            aHasReviews !==
            bHasReviews
          ) {
            return (
              bHasReviews -
              aHasReviews
            );
          }

          if (
            b.reviewCount !==
            a.reviewCount
          ) {
            return (
              b.reviewCount -
              a.reviewCount
            );
          }

          return b.rating - a.rating;
        });

        if (!cancelled) {
          setReviewedProducts(
            normalized.slice(0, 10)
          );
        }
      } catch (error) {
        console.error(
          "Home products error:",
          error
        );

        if (!cancelled) {
          setProductsError(true);
          setReviewedProducts([]);
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     LOAD CATEGORIES
  ======================================================= */
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setCategoriesLoading(true);
      setCategoriesError(false);

      try {
        const response = await fetch(
          `${API_BASE}/categories/index.php`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Categories API returned ${response.status}`
          );
        }

        const json =
          await response.json().catch(() => null);

        if (!json) {
          throw new Error(
            "Invalid categories API response."
          );
        }

        if (json.success === false) {
          throw new Error(
            json.message ||
              "Unable to load categories."
          );
        }

        /*
         * IMPORTANT:
         * Backend may return:
         *
         * data: {
         *   categories: [...]
         * }
         *
         * So type = "categories"
         * is required here.
         */
        const list = extractArray(
          json,
          "categories"
        );

        const normalized = list
          .map(normalizeCategory)
          .filter(Boolean)
          .filter((category) =>
            isActive(category)
          );

        /*
         * Sort by backend sort_order
         */
        normalized.sort(
          (a, b) =>
            a.sortOrder -
            b.sortOrder
        );

        if (!cancelled) {
          setCategories(
            normalized.slice(0, 6)
          );
        }
      } catch (error) {
        console.error(
          "Home categories error:",
          error
        );

        if (!cancelled) {
          setCategoriesError(true);
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="overflow-hidden">

      {/* =====================================================
          HERO SLIDER
      ===================================================== */}
      <HeroSlider />


      {/* =====================================================
          POPULAR WITH CUSTOMERS
      ===================================================== */}
      <section className="bg-white py-5 sm:py-8">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">

          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-purple-100 via-purple-50 to-pink-100 p-3 sm:p-5">

            {/* Header */}
            <div className="mb-3 flex items-center justify-between">

              <div>
                <h2 className="font-heading text-base font-extrabold text-slate-900 sm:text-xl">
                  Popular with Customers ⭐
                </h2>

                <p className="mt-0.5 text-[10px] text-slate-600 sm:text-xs">
                  Loved and reviewed by our customers
                </p>
              </div>

              <Link
                to="/shop"
                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 sm:text-xs"
              >
                View All

                <i className="fa-solid fa-arrow-right text-[9px]" />
              </Link>

            </div>


            {/* Horizontal Products */}
            <div className="flex gap-2.5 overflow-x-auto pb-1 sm:gap-4">

              {/* Loading */}
              {productsLoading ? (
                Array.from({ length: 5 }).map(
                  (_, index) => (
                    <div
                      key={`product-skeleton-${index}`}
                      className="w-[92px] shrink-0 sm:w-[125px]"
                    >
                      <div className="aspect-square animate-pulse rounded-xl bg-white/70" />

                      <div className="mt-1.5 h-3 w-3/4 animate-pulse rounded bg-white/70" />

                      <div className="mt-1 h-2.5 w-1/2 animate-pulse rounded bg-white/70" />
                    </div>
                  )
                )
              ) : productsError ? (

                <div className="w-full py-6 text-center text-xs text-slate-600 sm:text-sm">
                  Unable to load popular products right now.
                </div>

              ) : reviewedProducts.length === 0 ? (

                <div className="w-full py-6 text-center text-xs text-slate-600 sm:text-sm">
                  No popular products available yet.
                </div>

              ) : (

                reviewedProducts.map(
                  (product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="group w-[92px] shrink-0 sm:w-[125px]"
                    >

                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-white">

                        <img
                          src={getImageUrl(
                            product.image
                          )}
                          alt={
                            product.name ||
                            "Product"
                          }
                          loading="lazy"
                          onError={
                            handleImageError
                          }
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Rating */}
                        <div className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded bg-white px-1.5 py-0.5 text-[8px] font-bold text-slate-800 shadow-sm">

                          <i className="fa-solid fa-star text-[7px] text-yellow-500" />

                          {product.rating > 0
                            ? product.rating.toFixed(
                                1
                              )
                            : "New"}

                        </div>

                      </div>


                      {/* Product Name */}
                      <h3 className="mt-1.5 truncate text-[10px] font-semibold text-slate-800 sm:text-xs">
                        {product.name}
                      </h3>


                      {/* Reviews */}
                      <p className="mt-0.5 text-[9px] text-slate-500 sm:text-[10px]">
                        {product.reviewCount}{" "}
                        reviews
                      </p>

                    </Link>
                  )
                )
              )}

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          SHOP BY CATEGORY
      ===================================================== */}
      <section className="bg-white py-8 sm:py-12">

        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-5 flex items-center justify-between">

            <div>

              <span className="text-[10px] font-bold tracking-widest text-blue-600 sm:text-xs">
                SHOP BY CATEGORY
              </span>

              <h2 className="font-heading mt-1 text-xl font-extrabold text-slate-900 sm:text-3xl">
                Browse Categories
              </h2>

            </div>


            <Link
              to="/categories"
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 sm:text-sm"
            >
              View All

              <i className="fa-solid fa-arrow-right text-[10px]" />
            </Link>

          </div>


          {/* Category Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-5 lg:gap-6">

            {/* Loading */}
            {categoriesLoading ? (
              Array.from({ length: 6 }).map(
                (_, index) => (
                  <div
                    key={`category-skeleton-${index}`}
                    className="min-w-0"
                  >

                    <div className="aspect-square animate-pulse rounded-xl bg-slate-100 sm:rounded-2xl" />

                    <div className="mx-auto mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-100 sm:mt-3" />

                  </div>
                )
              )
            ) : categoriesError ? (

              <div className="col-span-3 py-6 text-center text-xs text-slate-600 sm:text-sm">
                Unable to load categories right now.
              </div>

            ) : categories.length === 0 ? (

              <div className="col-span-3 py-6 text-center text-xs text-slate-600 sm:text-sm">
                No categories available yet.
              </div>

            ) : (

              categories.map(
                (category) => (
                  <Link
                    key={category.id}
                    to={`/categories/${category.slug}`}
                    className="group min-w-0"
                  >

                    {/* Image */}
                    <div className="aspect-square overflow-hidden rounded-xl bg-slate-100 sm:rounded-2xl">

                      <img
                        src={getImageUrl(
                          category.image
                        )}
                        alt={
                          category.name ||
                          "Category"
                        }
                        loading="lazy"
                        onError={
                          handleImageError
                        }
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                    </div>


                    {/* Name */}
                    <h3 className="mt-2 truncate text-center text-[11px] font-bold text-slate-800 sm:mt-3 sm:text-sm">
                      {category.name}
                    </h3>

                  </Link>
                )
              )
            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURED PRODUCTS
      ===================================================== */}
      <FeaturedProducts />


      {/* =====================================================
          BENEFITS
      ===================================================== */}
      <section className="border-y border-slate-100 bg-slate-50 py-8 sm:py-10">

        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-8">

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-slate-200">

            {/* Delivery */}
            <div className="flex items-center gap-3 sm:px-5 lg:first:pl-0">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 sm:h-12 sm:w-12">
                <i className="fa-solid fa-truck-fast" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  Local Delivery
                </h3>

                <p className="mt-0.5 text-[11px] text-slate-500 sm:text-sm">
                  Simri Bakhtiyarpur
                </p>
              </div>

            </div>


            {/* Quality */}
            <div className="flex items-center gap-3 sm:px-5">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600 sm:h-12 sm:w-12">
                <i className="fa-solid fa-shield-halved" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  Quality Products
                </h3>

                <p className="mt-0.5 text-[11px] text-slate-500 sm:text-sm">
                  Products you can trust
                </p>
              </div>

            </div>


            {/* Support */}
            <div className="flex items-center gap-3 sm:px-5">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 sm:h-12 sm:w-12">
                <i className="fa-solid fa-headset" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  Local Support
                </h3>

                <p className="mt-0.5 text-[11px] text-slate-500 sm:text-sm">
                  We're here to help
                </p>
              </div>

            </div>


            {/* Returns */}
            <div className="flex items-center gap-3 sm:px-5 lg:last:pr-0">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 sm:h-12 sm:w-12">
                <i className="fa-solid fa-rotate-left" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  Easy Returns
                </h3>

                <p className="mt-0.5 text-[11px] text-slate-500 sm:text-sm">
                  Simple & transparent
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>
 <About />
    </main>
  );
}
   

export default Home;