import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE =
  "http://localhost/ashrafbazar/backend/api";

const BACKEND_BASE =
  API_BASE.replace(/\/api\/?$/, "");

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

  // Already absolute URL
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Protocol-relative URL
  if (trimmed.startsWith("//")) {
    return `http:${trimmed}`;
  }

  // Remove leading slash
  const normalized = trimmed.replace(/^\/+/, "");

  // Already backend uploads path
  if (normalized.startsWith("uploads/")) {
    return `${BACKEND_BASE}/${normalized}`;
  }

  // If backend path already contains uploads
  if (normalized.includes("uploads/")) {
    return `${BACKEND_BASE}/${normalized}`;
  }

  // Product image directory/path
  if (normalized.includes("/")) {
    return `${BACKEND_BASE}/uploads/${normalized}`;
  }

  // Filename only
  return `${BACKEND_BASE}/uploads/${normalized}`;
}

/* =========================================================
   FALLBACK IMAGE
========================================================= */
const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">' +
      '<rect width="500" height="500" fill="#f8fafc"/>' +
      '<rect x="80" y="90" width="340" height="320" rx="24" fill="#e2e8f0"/>' +
      '<path d="M130 350l75-90 60 65 55-70 80 95H130z" fill="#cbd5e1"/>' +
      '<circle cx="205" cy="190" r="35" fill="#cbd5e1"/>' +
      "</svg>"
  );

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
   API ARRAY HELPER
========================================================= */
function extractProducts(result) {
  if (!result || typeof result !== "object") {
    return [];
  }

  if (result.success === false) {
    return [];
  }

  // data: { products: [...] }
  if (
    Array.isArray(result.data?.products)
  ) {
    return result.data.products;
  }

  // data: [...]
  if (Array.isArray(result.data)) {
    return result.data;
  }

  // products: [...]
  if (Array.isArray(result.products)) {
    return result.products;
  }

  // Raw array
  if (Array.isArray(result)) {
    return result;
  }

  return [];
}

/* =========================================================
   PRODUCT STATUS
========================================================= */
function isActiveProduct(product) {
  if (!product) {
    return false;
  }

  const status = product.status;

  // If backend doesn't return status,
  // don't unnecessarily hide product.
  if (
    status === undefined ||
    status === null ||
    status === ""
  ) {
    return true;
  }

  if (typeof status === "boolean") {
    return status;
  }

  if (typeof status === "number") {
    return status === 1;
  }

  const value =
    String(status).toLowerCase();

 return (
  value === "1" ||
  value === "active" ||
  value === "out_of_stock" ||
  value === "true" ||
  value === "yes"
);
}

/* =========================================================
   CATEGORY PRODUCTS
========================================================= */
function CategoryProducts() {
  const { slug } = useParams();

  const [products, setProducts] =
    useState([]);

  const [category, setCategory] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     FETCH CATEGORY PRODUCTS
  ======================================================= */
  useEffect(() => {
    let cancelled = false;

    const fetchCategoryProducts =
      async () => {
        if (!slug) {
          setProducts([]);
          setCategory(null);
          setError(
            "Category not found."
          );
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `${API_BASE}/products/index.php?category=${encodeURIComponent(
                slug
              )}`,
              {
                method: "GET",
                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          if (!response.ok) {
            throw new Error(
              `Products API returned ${response.status}`
            );
          }

          const result =
            await response
              .json()
              .catch(() => null);

          console.log(
            "CATEGORY PRODUCTS API:",
            result
          );

          if (!result) {
            throw new Error(
              "Invalid API response."
            );
          }

          if (
            result.success === false
          ) {
            throw new Error(
              result.message ||
                "Unable to load products."
            );
          }

          const productList =
            extractProducts(result);

          /*
           * Only active products.
           */
          const activeProducts =
            productList.filter(
              isActiveProduct
            );

          if (cancelled) {
            return;
          }

          setProducts(
            activeProducts
          );

          /*
           * Category name comes from
           * backend product response.
           */
          if (
            activeProducts.length > 0
          ) {
            const firstProduct =
              activeProducts[0];

            setCategory({
              name:
                firstProduct.category_name ||
                firstProduct.categoryName ||
                slug,
            });
          } else {
            setCategory({
              name: slug,
            });
          }
        } catch (err) {
          console.error(
            "Category Products Error:",
            err
          );

          if (!cancelled) {
            setError(
              err?.message ||
                "Something went wrong while loading products."
            );

            setProducts([]);
            setCategory({
              name: slug,
            });
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    fetchCategoryProducts();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  /* =======================================================
     RETRY
  ======================================================= */
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-slate-50">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}
      <section className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* Breadcrumb 
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">

            <Link
              to="/"
              className="transition hover:text-blue-600"
            >
              Home
            </Link>

            <i className="fa-solid fa-chevron-right text-[9px]" />

            <Link
              to="/categories"
              className="transition hover:text-blue-600"
            >
              Categories
            </Link>

            <i className="fa-solid fa-chevron-right text-[9px]" />

            <span className="truncate font-medium text-slate-700">
              {category?.name ||
                slug}
            </span>

          </div>

          {/* Title 
          <h1 className="font-heading text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {category?.name ||
              slug}
          </h1>

          {!loading && !error && (
            <p className="mt-1 text-sm text-slate-500">
              {products.length} product
              {products.length !== 1
                ? "s"
                : ""}{" "}
              available
            </p>
          )}
*/}
        </div>

      </section>


      {/* =====================================================
          PRODUCTS
      ===================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ===================================================
            LOADING
        =================================================== */}
        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

            {Array.from({
              length: 10,
            }).map((_, index) => (
              <div
                key={`category-product-skeleton-${index}`}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >

                <div className="aspect-square animate-pulse bg-slate-100" />

                <div className="space-y-2 p-3">

                  <div className="h-3 animate-pulse rounded bg-slate-100" />

                  <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />

                  <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />

                </div>

              </div>
            ))}

          </div>
        )}


        {/* ===================================================
            ERROR
        =================================================== */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-10 text-center">

            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
              <i className="fa-solid fa-triangle-exclamation" />
            </div>

            <h2 className="font-heading text-lg font-bold text-slate-900">
              Unable to load products
            </h2>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={
                handleRetry
              }
              className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Try Again
            </button>

          </div>
        )}


        {/* ===================================================
            EMPTY
        =================================================== */}
        {!loading &&
          !error &&
          products.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <i className="fa-solid fa-box-open text-2xl" />
              </div>

              <h2 className="font-heading text-xl font-bold text-slate-900">
                No products found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                There are currently no
                products in this category.
              </p>

              <Link
                to="/shop"
                className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Browse All Products
              </Link>

            </div>
          )}


        {/* ===================================================
            PRODUCT GRID
        =================================================== */}
        {!loading &&
          !error &&
          products.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">

              {products.map(
                (product) => {
                  const price =
                    toNumber(
                      product.price,
                      0
                    );

                  const oldPrice =
                    toNumber(
                      product.compare_price ??
                        product.old_price ??
                        product.oldPrice,
                      0
                    );

                  const rating =
                    toNumber(
                      product.rating,
                      0
                    );

                  const reviewCount =
                    toNumber(
                      product.review_count ??
                        product.reviewCount ??
                        product.reviews_count,
                      0
                    );

                  const discount =
                    oldPrice > price &&
                    price > 0
                      ? Math.round(
                          ((oldPrice -
                            price) /
                            oldPrice) *
                            100
                        )
                      : 0;

                  return (
                    <Link
                      key={
                        product.id
                      }
                      to={`/product/${product.id}`}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                    >

                      {/* =================================================
                          IMAGE
                      ================================================= */}
                      <div className="relative aspect-square overflow-hidden bg-slate-50">

                        <img
                          src={getImageUrl(
                            product.image ||
                              product.thumbnail
                          )}
                          alt={
                            product.name ||
                            "Product"
                          }
                          loading="lazy"
                          onError={(
                            e
                          ) => {
                            if (
                              e.currentTarget
                                .src !==
                              FALLBACK_IMAGE
                            ) {
                              e.currentTarget.src =
                                FALLBACK_IMAGE;
                            }
                          }}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />


                        {/* Discount */}
                        {discount >
                          0 && (
                          <span className="absolute left-2 top-2 rounded-md bg-red-500 px-2 py-1 text-[9px] font-bold text-white">
                            {discount}%
                            OFF
                          </span>
                        )}

                      </div>


                      {/* =================================================
                          PRODUCT INFO
                      ================================================= */}
                      <div className="p-3">

                        {/* Product Name */}
                        <h2 className="line-clamp-2 min-h-[36px] text-xs font-semibold leading-5 text-slate-800 sm:text-sm">
                          {product.name ||
                            "Unnamed Product"}
                        </h2>


                        {/* Rating */}
                        <div className="mt-1.5 flex items-center gap-1">

                          <span className="flex items-center gap-1 rounded bg-green-600 px-1.5 py-0.5 text-[9px] font-bold text-white">

                            <i className="fa-solid fa-star text-[8px]" />

                            {rating > 0
                              ? rating.toFixed(
                                  1
                                )
                              : "0.0"}

                          </span>

                          {reviewCount >
                            0 && (
                            <span className="text-[9px] text-slate-400">
                              (
                              {
                                reviewCount
                              }
                              )
                            </span>
                          )}

                        </div>


                        {/* Price */}
                        <div className="mt-2 flex items-center gap-2">

                          <span className="text-sm font-extrabold text-slate-900 sm:text-base">
                            ₹
                            {price.toLocaleString(
                              "en-IN"
                            )}
                          </span>

                          {oldPrice >
                            price && (
                            <span className="text-[10px] text-slate-400 line-through sm:text-xs">
                              ₹
                              {oldPrice.toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          )}

                        </div>

                      </div>

                    </Link>
                  );
                }
              )}

            </div>
          )}

      </section>

    </main>
  );
}

export default CategoryProducts;