import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

  const backendRoot = API_BASE.replace(/\/api\/?$/, "");

  // Already contains uploads/
  if (normalized.startsWith("uploads/")) {
    return `${backendRoot}/${normalized}`;
  }

  // Directory path
  if (normalized.includes("/")) {
    return `${backendRoot}/uploads/${normalized}`;
  }

  // Filename only
  return `${backendRoot}/uploads/${normalized}`;
}

/* =========================================================
   FALLBACK IMAGE
========================================================= */
const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">' +
      '<rect width="400" height="500" fill="#f1f5f9"/>' +
      '<path d="M90 330l65-80 55 60 50-55 50 75H90z" fill="#cbd5e1"/>' +
      '<circle cx="150" cy="170" r="35" fill="#cbd5e1"/>' +
      "</svg>"
  );

/* =========================================================
   IMAGE ERROR
========================================================= */
function handleImageError(e) {
  if (
    e?.currentTarget &&
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
   API ARRAY HELPER
========================================================= */
function extractArray(json) {
  if (!json || typeof json !== "object") {
    return [];
  }

  if (json.success === false) {
    return [];
  }

  // data: [...]
  if (Array.isArray(json.data)) {
    return json.data;
  }

  // data: { products: [...] }
  if (
    Array.isArray(json.data?.products)
  ) {
    return json.data.products;
  }

  // products: [...]
  if (Array.isArray(json.products)) {
    return json.products;
  }

  // Raw array
  if (Array.isArray(json)) {
    return json;
  }

  return [];
}

/* =========================================================
   ACTIVE STATUS
========================================================= */
function isActive(product) {
  if (!product) {
    return false;
  }

  const status = product.status;

  // If status isn't returned, don't hide product
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

  const value = String(status).toLowerCase();

  return (
    value === "1" ||
    value === "active" ||
    value === "true" ||
    value === "yes"
  );
}

/* =========================================================
   NORMALIZE PRODUCT
========================================================= */
function normalizeProduct(product) {
  if (!product || typeof product !== "object") {
    return null;
  }

  const id =
    product.id ??
    product.product_id;

  if (
    id === undefined ||
    id === null
  ) {
    return null;
  }

  return {
    id,
    name: product.name ?? "",

    image:
      product.image ??
      product.thumbnail ??
      "",

    oldPrice: toNumber(
      product.old_price ??
        product.oldPrice,
      0
    ),

    price: toNumber(
      product.price,
      0
    ),

    stock: toNumber(
      product.stock,
      0
    ),

    status: product.status,

    featured:
      product.featured === true ||
      product.featured === 1 ||
      String(product.featured).toLowerCase() ===
        "1" ||
      String(product.featured).toLowerCase() ===
        "true",
  };
}

/* =========================================================
   DISCOUNT
========================================================= */
function getDiscount(
  oldPrice,
  price
) {
  const oldValue =
    toNumber(oldPrice);

  const currentValue =
    toNumber(price);

  if (
    oldValue <= 0 ||
    currentValue <= 0 ||
    oldValue <= currentValue
  ) {
    return 0;
  }

  return Math.round(
    ((oldValue - currentValue) /
      oldValue) *
      100
  );
}

/* =========================================================
   FEATURED PRODUCTS
========================================================= */
function FeaturedProducts() {
  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */
  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError(false);

      try {
        const response =
          await fetch(
            `${API_BASE}/products/index.php`,
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

        const json =
          await response
            .json()
            .catch(() => null);

        if (!json) {
          throw new Error(
            "Invalid products API response."
          );
        }

        if (
          json.success === false
        ) {
          throw new Error(
            json.message ||
              "Unable to load products."
          );
        }

        /*
         * IMPORTANT
         *
         * Supports:
         *
         * data: [...]
         *
         * OR
         *
         * data: {
         *   products: [...]
         * }
         */
        const list =
          extractArray(json);

        const normalized =
          list
            .map(
              normalizeProduct
            )
            .filter(
            (product) =>
              product.status === "active" ||
              product.status === "out_of_stock"
          );

        /*
         * Featured products first.
         *
         * Then products having
         * higher discount.
         */
        normalized.sort(
          (a, b) => {
            if (
              a.featured !==
              b.featured
            ) {
              return (
                Number(b.featured) -
                Number(a.featured)
              );
            }

            const aDiscount =
              getDiscount(
                a.oldPrice,
                a.price
              );

            const bDiscount =
              getDiscount(
                b.oldPrice,
                b.price
              );

            return (
              bDiscount -
              aDiscount
            );
          }
        );

        if (!cancelled) {
          setProducts(
            normalized.slice(
              0,
              18
            )
          );
        }
      } catch (err) {
        console.error(
          "Featured products error:",
          err
        );

        if (!cancelled) {
          setProducts([]);
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">

        {/* =================================================
            SECTION HEADER
        ================================================= */}
        <div className="mb-5 flex items-end justify-between gap-3 sm:mb-7">

          <div>
            <span className="text-[10px] font-bold tracking-widest text-blue-600 sm:text-xs">
              FEATURED PRODUCTS
            </span>

            <h2 className="font-heading mt-1 text-xl font-extrabold text-slate-900 sm:text-3xl">
              Popular Products
            </h2>

            <p className="mt-1 hidden text-sm text-slate-500 sm:block">
              Shop popular products from
              AshrafChak.
            </p>
          </div>

          <Link
            to="/shop"
            className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-blue-600 sm:text-sm"
          >
            View All

            <i className="fa-solid fa-arrow-right text-[10px]" />
          </Link>

        </div>


        {/* =================================================
            PRODUCT GRID
        ================================================= */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-5 sm:gap-4 lg:gap-6">

          {/* =================================================
              LOADING
          ================================================= */}
          {loading ? (
            Array.from({
              length: 18,
            }).map(
              (_, index) => (
                <div
                  key={`featured-skeleton-${index}`}
                  className="min-w-0"
                >

                  <div className="aspect-[0.82/1] animate-pulse rounded-lg bg-slate-100 sm:rounded-xl" />

                  <div className="mt-2 px-0.5">

                    <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />

                    <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />

                  </div>

                </div>
              )
            )
          ) : error ? (

            /* =================================================
               ERROR
            ================================================= */
            <div className="col-span-3 py-10 text-center">

              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">

                <i className="fa-solid fa-box-open" />

              </div>

              <p className="text-sm font-semibold text-slate-700">
                Unable to load products
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Please try again later.
              </p>

            </div>

          ) : products.length === 0 ? (

            /* =================================================
               EMPTY
            ================================================= */
            <div className="col-span-3 py-10 text-center">

              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">

                <i className="fa-solid fa-box-open" />

              </div>

              <p className="text-sm font-semibold text-slate-700">
                No featured products available
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Products will appear here once
                they are added.
              </p>

            </div>

          ) : (

            /* =================================================
               PRODUCTS
            ================================================= */
            products.map(
              (product) => {
                const discount =
                  getDiscount(
                    product.oldPrice,
                    product.price
                  );

                return (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="group min-w-0"
                  >

                    {/* Product Image */}
                    <div className="relative aspect-[0.82/1] overflow-hidden rounded-lg bg-slate-100 sm:rounded-xl">

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


                      {/* Featured Badge */}
                      {product.featured && (
                        <span className="absolute right-1.5 top-1.5 rounded bg-blue-600 px-1.5 py-0.5 text-[8px] font-bold text-white sm:right-2 sm:top-2 sm:px-2 sm:text-[9px]">
                          FEATURED
                        </span>
                      )}


                      {/* Discount */}
                      {discount > 0 && (
                        <span className="absolute left-1.5 top-1.5 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white sm:left-2 sm:top-2 sm:px-2 sm:text-[10px]">
                          {discount}% OFF
                        </span>
                      )}

                    </div>


                    {/* Product Info */}
                    <div className="mt-2 px-0.5">

                      <h3 className="truncate text-[11px] font-semibold leading-4 text-slate-800 sm:text-sm sm:leading-5">
                        {product.name}
                      </h3>


                      <div className="mt-0.5 flex items-center gap-1.5 sm:mt-1 sm:gap-2">

                        <span className="text-[11px] font-bold text-slate-900 sm:text-sm">
                          ₹
                          {product.price.toLocaleString(
                            "en-IN"
                          )}
                        </span>

                        {product.oldPrice >
                          product.price && (
                          <span className="text-[9px] text-slate-400 line-through sm:text-xs">
                            ₹
                            {product.oldPrice.toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        )}

                      </div>

                    </div>

                  </Link>
                );
              }
            )
          )}

        </div>


       

      </div>
    </section>
  );
}

export default FeaturedProducts;