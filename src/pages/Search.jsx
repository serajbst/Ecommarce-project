import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const PRODUCTS_API =
  "http://localhost/ashrafbazar/backend/api/products/index.php";

const BACKEND_BASE =
  "http://localhost/ashrafbazar/backend";

function getImageUrl(image) {
  if (!image || typeof image !== "string") {
    return null;
  }

  const value = image.trim();

  if (!value) {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${BACKEND_BASE}${value}`;
  }

  if (value.startsWith("uploads/")) {
    return `${BACKEND_BASE}/${value}`;
  }

  if (value.startsWith("products/")) {
    return `${BACKEND_BASE}/uploads/${value}`;
  }

  return `${BACKEND_BASE}/uploads/products/${value}`;
}

function formatPrice(value) {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return "₹0";
  }

  return `₹${price.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function getProductName(product) {
  return (
    product?.name ||
    product?.product_name ||
    product?.title ||
    "Product"
  );
}

function getProductId(product) {
  return product?.id ?? product?.product_id;
}

function getProductImage(product) {
  return (
    product?.image ||
    product?.image_url ||
    product?.image_path ||
    product?.thumbnail ||
    product?.featured_image ||
    ""
  );
}

function getProductPrice(product) {
  return (
    product?.price ??
    product?.selling_price ??
    product?.sale_price ??
    0
  );
}

function extractProducts(result) {
  if (!result || typeof result !== "object") {
    return [];
  }

  if (Array.isArray(result?.data?.products)) {
    return result.data.products;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.products)) {
    return result.products;
  }

  if (Array.isArray(result)) {
    return result;
  }

  return [];
}

export default function Search() {
  const [searchParams] = useSearchParams();

  const query = searchParams.get("q")?.trim() || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(PRODUCTS_API);

        const text = await response.text();

        let result;

        try {
          result = text ? JSON.parse(text) : null;
        } catch {
          throw new Error(
            "Server returned an invalid response."
          );
        }

        if (!response.ok || result?.success === false) {
          throw new Error(
            result?.message ||
              `Request failed with status ${response.status}.`
          );
        }

        const list = extractProducts(result);

        if (mounted) {
          setProducts(list);
        }
      } catch (err) {
        console.error("Search products error:", err);

        if (mounted) {
          setError(
            err?.message ||
              "Unable to load products."
          );
          setProducts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const searchText = query.toLowerCase();

    if (!searchText) {
      return products;
    }

    return products.filter((product) => {
      const name = String(
        product?.name ||
          product?.product_name ||
          product?.title ||
          ""
      ).toLowerCase();

      const description = String(
        product?.description || ""
      ).toLowerCase();

      const shortDescription = String(
        product?.short_description || ""
      ).toLowerCase();

      const sku = String(
        product?.sku || ""
      ).toLowerCase();

      const category = String(
        product?.category_name ||
          product?.category ||
          ""
      ).toLowerCase();

      return (
        name.includes(searchText) ||
        description.includes(searchText) ||
        shortDescription.includes(searchText) ||
        sku.includes(searchText) ||
        category.includes(searchText)
      );
    });
  }, [products, query]);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              aria-label="Go back home"
            >
              <i className="fa-solid fa-arrow-left" />
            </Link>

            <div>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Search Products
              </h1>

              {query && (
                <p className="mt-1 text-sm text-slate-500">
                  Results for{" "}
                  <span className="font-semibold text-slate-700">
                    "{query}"
                  </span>
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Empty query */}
        {!query && !loading && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <i className="fa-solid fa-magnifying-glass text-2xl" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Search for a product
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Use the search box above to find products.
            </p>

            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <i className="fa-solid fa-house" />
              Go Home
            </Link>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="h-48 animate-pulse bg-slate-100" />

                <div className="space-y-3 p-4">
                  <div className="h-4 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-5 w-1/3 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}

          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <i className="fa-solid fa-triangle-exclamation text-xl" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-red-800">
              Unable to load products
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* Results */}
        {!loading &&
          !error &&
          query &&
          filteredProducts.length > 0 && (
            <>
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-600">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1
                    ? "product"
                    : "products"} found
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

                {filteredProducts.map((product) => {
                  const id = getProductId(product);
                  const name = getProductName(product);
                  const image = getImageUrl(
                    getProductImage(product)
                  );
                  const price = getProductPrice(product);

                  return (
                    <Link
                      key={id ?? name}
                      to={`/product/${id}`}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                    >

                      {/* Image */}
                      <div className="flex h-44 items-center justify-center overflow-hidden bg-slate-50 p-3 sm:h-52">

                        {image ? (
                          <img
                            src={image}
                            alt={name}
                            className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <i className="fa-solid fa-image text-4xl" />
                          </div>
                        )}

                      </div>

                      {/* Details */}
                      <div className="p-4">

                        <h2 className="line-clamp-2 min-h-[40px] text-sm font-semibold text-slate-800 group-hover:text-blue-600">
                          {name}
                        </h2>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-lg font-bold text-blue-600">
                            {formatPrice(price)}
                          </span>

                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <i className="fa-solid fa-arrow-right text-xs" />
                          </span>
                        </div>

                      </div>

                    </Link>
                  );
                })}

              </div>
            </>
          )}

        {/* No results */}
        {!loading &&
          !error &&
          query &&
          filteredProducts.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <i className="fa-solid fa-box-open text-3xl" />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                No products found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                We couldn't find any product matching{" "}
                <span className="font-semibold text-slate-700">
                  "{query}"
                </span>
                .
              </p>

              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                <i className="fa-solid fa-house" />
                Continue Shopping
              </Link>

            </div>
          )}

      </main>
    </div>
  );
}