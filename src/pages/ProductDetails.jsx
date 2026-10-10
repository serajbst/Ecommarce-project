import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";

const PRODUCTS_API =
  "http://localhost/ashrafbazar/backend/api/products/index.php";

const BACKEND_BASE =
  "http://localhost/ashrafbazar/backend";

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" fill="#f8fafc"/>
      <rect x="80" y="90" width="340" height="320" rx="24" fill="#e2e8f0"/>
      <path d="M130 350l75-90 60 65 55-70 80 95H130z" fill="#cbd5e1"/>
      <circle cx="205" cy="190" r="35" fill="#cbd5e1"/>
    </svg>
  `);

function getImageUrl(imagePath) {
  if (!imagePath || typeof imagePath !== "string") {
    return "";
  }

  const value = imagePath.trim();

  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("//")) {
    return `http:${value}`;
  }

  const normalized = value.replace(/^\/+/, "");

  if (normalized.startsWith("uploads/")) {
    return `${BACKEND_BASE}/${normalized}`;
  }

  if (normalized.includes("uploads/")) {
    return `${BACKEND_BASE}/${normalized}`;
  }

  if (normalized.startsWith("products/")) {
    return `${BACKEND_BASE}/uploads/${normalized}`;
  }

  if (normalized.includes("/")) {
    return `${BACKEND_BASE}/uploads/${normalized}`;
  }

  return `${BACKEND_BASE}/uploads/products/${normalized}`;
}

function extractProducts(result) {
  if (!result || typeof result !== "object") {
    return [];
  }

  if (result.success === false) {
    return [];
  }

  if (Array.isArray(result.data?.products)) {
    return result.data.products;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.products)) {
    return result.products;
  }

  if (Array.isArray(result)) {
    return result;
  }

  return [];
}

function handleImageError(event) {
  if (
    event?.currentTarget &&
    event.currentTarget.src !== FALLBACK_IMAGE
  ) {
    event.currentTarget.src = FALLBACK_IMAGE;
  }
}

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

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

        if (!result.success) {
          throw new Error(
            result.message || "Unable to load products."
          );
        }

        const apiProducts = extractProducts(result);

        const formattedProducts = apiProducts.map((item) => {
          const gallery = Array.isArray(item.images)
            ? item.images
                .map((image) =>
                  typeof image === "string"
                    ? image
                    : image?.image
                )
                .filter(Boolean)
            : [];

          const mainImage =
            item.image ||
            item.thumbnail ||
            gallery[0] ||
            "";

          return {
            id: Number(item.id),
            name: item.name || "Product",

            category:
              item.category_name ||
              item.category ||
              "Other",

            categorySlug:
              item.category_slug || "",

            price: Number(item.price || 0),

            oldPrice: Number(
              item.compare_price ||
                item.old_price ||
                item.oldPrice ||
                item.price ||
                0
            ),

            rating: Number(item.rating || 0),

            reviews: Number(
              item.review_count ||
                item.reviews ||
                0
            ),

            stock: Number(item.stock || 0),

            image: mainImage,

            images: gallery,

            description:
              item.description ||
              "No description available for this product.",

            features: Array.isArray(item.features)
              ? item.features
              : [],

            slug: item.slug || "",
          };
        });

        if (!mounted) {
          return;
        }

        setAllProducts(formattedProducts);

        const foundProduct = formattedProducts.find(
          (item) => item.id === Number(id)
        );

        if (!foundProduct) {
          setProduct(null);
          setError("");
          return;
        }

        setProduct(foundProduct);
        setQuantity(1);

        const firstImage =
          foundProduct.images?.[0] ||
          foundProduct.image ||
          "";

        setSelectedImage(
          getImageUrl(firstImage) || FALLBACK_IMAGE
        );
      } catch (err) {
        console.error(
          "Product Details API Error:",
          err
        );

        if (!mounted) {
          return;
        }

        setError(
          err?.message ||
            "Product load nahi ho pa raha hai."
        );

        setProduct(null);
        setAllProducts([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      mounted = false;
    };
  }, [id]);

  const relatedProducts = useMemo(() => {
    if (!product) {
      return [];
    }

    return allProducts
      .filter(
        (item) =>
          item.category === product.category &&
          item.id !== product.id &&
          item.stock > 0
      )
      .slice(0, 4);
  }, [allProducts, product]);

  const discount = useMemo(() => {
    if (
      !product ||
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
  }, [product]);

  const totalPrice = product
    ? product.price * quantity
    : 0;

  const handleDecrease = () => {
    setQuantity((previous) =>
      Math.max(1, previous - 1)
    );
  };

  const handleIncrease = () => {
    if (!product || product.stock <= 0) {
      return;
    }

    setQuantity((previous) =>
      Math.min(product.stock, previous + 1)
    );
  };

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) {
      return;
    }

    addToCart(product, quantity);
  };

 const handleBuyNow = () => {

  if (!product || product.stock <= 0) {

    return;

  }

  navigate("/checkout", {
    state: {
      buyNowItem: {
        ...product,
        quantity: quantity,
      },
    },
  });

};

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-4">
            <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
          </div>
        </div>

        <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-2 lg:gap-10">
            <div>
              <div className="aspect-square animate-pulse rounded-2xl bg-slate-200" />

              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-16 w-16 shrink-0 animate-pulse rounded-lg bg-slate-200 sm:h-20 sm:w-20"
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />

              <div className="mt-3 h-8 w-full animate-pulse rounded bg-slate-200 sm:w-4/5" />

              <div className="mt-4 h-8 w-40 animate-pulse rounded bg-slate-200" />

              <div className="mt-5 h-28 animate-pulse rounded-xl bg-slate-200" />

              <div className="mt-5 h-12 animate-pulse rounded-xl bg-slate-200" />

              <div className="mt-3 h-12 animate-pulse rounded-xl bg-slate-200" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <i className="fa-solid fa-triangle-exclamation text-2xl" />
          </div>

          <h1 className="mt-5 text-xl font-extrabold text-slate-900 sm:text-2xl">
            Something went wrong
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Try Again
          </button>

          <Link
            to="/shop"
            className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-blue-600"
          >
            <i className="fa-solid fa-arrow-left" />
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <i className="fa-solid fa-box-open text-2xl" />
          </div>

          <h1 className="mt-5 text-xl font-extrabold text-slate-900 sm:text-2xl">
            Product Not Found
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            The product you are looking for may have
            been removed or is currently unavailable.
          </p>

          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
          >
            <i className="fa-solid fa-arrow-left" />
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50">
      

      {/* Product Section */}
      <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid min-w-0 gap-5 lg:grid-cols-2 lg:gap-10">
          {/* LEFT */}
          <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm sm:p-5">
              {/* Main Image */}
              <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                {discount > 0 && (
                  <span className="absolute left-3 top-3 z-10 rounded-lg bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm sm:text-xs">
                    {discount}% OFF
                  </span>
                )}

                <img
                  src={
                    selectedImage ||
                    getImageUrl(product.image) ||
                    FALLBACK_IMAGE
                  }
                  alt={product.name}
                  onError={handleImageError}
                  className="h-full w-full object-contain transition duration-500 hover:scale-105"
                />
              </div>

              {/* Gallery */}
              {product.images?.length > 0 && (
                <div className="mt-3 sm:mt-4">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {product.images
                      .slice(0, 5)
                      .map((image, index) => {
                        const imageUrl =
                          getImageUrl(image) ||
                          FALLBACK_IMAGE;

                        const active =
                          selectedImage === imageUrl;

                        return (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() =>
                              setSelectedImage(imageUrl)
                            }
                            aria-label={`View product image ${
                              index + 1
                            }`}
                            className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-100 transition sm:h-20 sm:w-20 sm:rounded-xl ${
                              active
                                ? "border-blue-600 ring-2 ring-blue-100"
                                : "border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <img
                              src={imageUrl}
                              alt={`${product.name} view ${
                                index + 1
                              }`}
                              onError={handleImageError}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Info */}
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3">
              <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 sm:h-9 sm:w-9">
                    <i className="fa-solid fa-truck text-xs sm:text-sm" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-slate-800 sm:text-xs">
                      Local Delivery
                    </p>

                    <p className="mt-0.5 truncate text-[9px] text-slate-500 sm:text-[10px]">
                      Simri Bakhtiyarpur
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 sm:h-9 sm:w-9">
                    <i className="fa-solid fa-shield-halved text-xs sm:text-sm" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-slate-800 sm:text-xs">
                      Secure Payment
                    </p>

                    <p className="mt-0.5 truncate text-[9px] text-slate-500 sm:text-[10px]">
                      COD & Online
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="min-w-0">
            {/* Category */}
            <Link
              to={
                product.categorySlug
                  ? `/categories/${product.categorySlug}`
                  : "/shop"
              }
              className="inline-flex max-w-full items-center gap-1.5 truncate text-xs font-bold uppercase tracking-wider text-blue-600"
            >
              <i className="fa-solid fa-layer-group shrink-0" />
              <span className="truncate">
                {product.category}
              </span>
            </Link>

            {/* Product Name */}
            <h1 className="font-heading mt-2 break-words text-[22px] font-extrabold leading-tight text-slate-900 sm:text-4xl">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              {product.rating > 0 && (
                <div className="flex items-center gap-1 rounded-lg bg-green-600 px-2 py-1">
                  <span className="text-[11px] font-bold text-white">
                    {product.rating}
                  </span>

                  <i className="fa-solid fa-star text-[9px] text-white" />
                </div>
              )}

              {product.reviews > 0 && (
                <span className="text-xs text-slate-500 sm:text-sm">
                  {product.reviews} Reviews
                </span>
              )}

              {(product.rating > 0 ||
                product.reviews > 0) && (
                <span className="text-slate-300">
                  •
                </span>
              )}

              <span
                className={`text-xs font-medium sm:text-sm ${
                  product.stock > 0
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {product.stock > 0
                  ? "In Stock"
                  : "Out of Stock"}
              </span>
            </div>

            {/* Price */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5 sm:mt-5 sm:p-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[28px] font-extrabold text-slate-900 sm:text-4xl">
                  ₹
                  {product.price.toLocaleString(
                    "en-IN"
                  )}
                </span>

                {product.oldPrice >
                  product.price && (
                  <span className="text-base text-slate-400 line-through sm:text-lg">
                    ₹
                    {product.oldPrice.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                )}

                {discount > 0 && (
                  <span className="rounded-md bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600 sm:text-xs">
                    Save {discount}%
                  </span>
                )}
              </div>

              <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                Inclusive of applicable taxes
              </p>
            </div>

            {/* Description */}
            <div className="mt-5 border-t border-slate-200 pt-5 sm:mt-6 sm:pt-6">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Product Description
              </h2>

              <p className="mt-3 break-words text-sm leading-6 text-slate-600 sm:leading-7">
                {product.description}
              </p>
            </div>

            {/* Features */}
            {product.features.length > 0 && (
              <div className="mt-5 sm:mt-6">
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Key Features
                </h2>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {product.features.map(
                    (feature, index) => (
                      <div
                        key={`${feature}-${index}`}
                        className="flex min-w-0 items-start gap-2 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-600"
                      >
                        <i className="fa-solid fa-circle-check mt-0.5 shrink-0 text-green-500" />

                        <span className="break-words">
                          {feature}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Quantity */}
            {product.stock > 0 && (
              <div className="mt-5 sm:mt-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-slate-800">
                    Quantity
                  </span>

                  <span className="text-[11px] text-slate-500 sm:text-xs">
                    {product.stock} available
                  </span>
                </div>

                <div className="mt-3 inline-flex h-11 items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                    className="flex h-full w-11 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <i className="fa-solid fa-minus text-xs" />
                  </button>

                  <span className="flex h-full min-w-12 items-center justify-center border-x border-slate-200 px-3 text-sm font-bold text-slate-900">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={handleIncrease}
                    disabled={
                      quantity >= product.stock
                    }
                    className="flex h-full w-11 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <i className="fa-solid fa-plus text-xs" />
                  </button>
                </div>
              </div>
            )}

            {/* Total */}
            {quantity > 1 &&
              product.stock > 0 && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-blue-50 px-4 py-3">
                  <span className="text-sm font-medium text-slate-600">
                    Total Price
                  </span>

                  <span className="text-lg font-extrabold text-blue-600">
                    ₹
                    {totalPrice.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              )}

            {/* Action Buttons */}
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex h-12 min-w-0 items-center justify-center rounded-xl border-2 border-blue-600 px-1.5 text-[11px] font-bold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 sm:px-2 sm:text-sm"
              >
                <i className="fa-solid fa-cart-plus mr-1.5 sm:mr-2" />

                {product.stock > 0
                  ? "Add to Cart"
                  : "Out of Stock"}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="flex h-12 min-w-0 items-center justify-center rounded-xl bg-blue-600 px-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:px-2 sm:text-sm"
              >
                Buy Now

                <i className="fa-solid fa-arrow-right ml-1.5 text-[10px] sm:ml-2 sm:text-xs" />
              </button>
            </div>

            {/* Delivery Box */}
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3.5 sm:mt-5 sm:p-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                  <i className="fa-solid fa-location-dot" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">
                    Local Delivery Available
                  </h3>

                  <p className="mt-1 break-words text-xs leading-5 text-slate-600">
                    Currently delivering in
                    Simri Bakhtiyarpur.
                    Delivery availability will
                    be checked during checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-7xl px-3 py-7 sm:px-6 sm:py-10 lg:px-8">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 sm:text-xs">
                  You may also like
                </p>

                <h2 className="font-heading mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Related Products
                </h2>
              </div>

              <Link
                to="/shop"
                className="hidden items-center gap-1 text-sm font-bold text-blue-600 sm:flex"
              >
                View All
                <i className="fa-solid fa-arrow-right text-xs" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {relatedProducts.map((item) => {
                const itemDiscount =
                  item.oldPrice > item.price
                    ? Math.round(
                        ((item.oldPrice -
                          item.price) /
                          item.oldPrice) *
                          100
                      )
                    : 0;

                const itemImage =
                  getImageUrl(
                    item.images?.[0] ||
                      item.image
                  ) || FALLBACK_IMAGE;

                return (
                  <Link
                    key={item.id}
                    to={`/product/${item.id}`}
                    className="group min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      {itemDiscount > 0 && (
                        <span className="absolute left-2 top-2 z-10 rounded-md bg-red-500 px-1.5 py-1 text-[9px] font-bold text-white">
                          {itemDiscount}% OFF
                        </span>
                      )}

                      <img
                        src={itemImage}
                        alt={item.name}
                        onError={handleImageError}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="min-w-0 p-2.5 sm:p-3">
                      {item.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="rounded bg-green-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            {item.rating}
                            <i className="fa-solid fa-star ml-0.5 text-[7px]" />
                          </span>

                          {item.reviews > 0 && (
                            <span className="text-[10px] text-slate-400">
                              {item.reviews}
                            </span>
                          )}
                        </div>
                      )}

                      <h3 className="mt-2 line-clamp-2 min-h-[32px] break-words text-[11px] font-bold leading-4 text-slate-800 sm:text-sm">
                        {item.name}
                      </h3>

                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className="text-sm font-extrabold text-slate-900">
                          ₹
                          {item.price.toLocaleString(
                            "en-IN"
                          )}
                        </span>

                        {item.oldPrice >
                          item.price && (
                          <span className="text-[9px] text-slate-400 line-through sm:text-[10px]">
                            ₹
                            {item.oldPrice.toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <Link
              to="/shop"
              className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 sm:hidden"
            >
              View All Products
              <i className="fa-solid fa-arrow-right text-xs" />
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

export default ProductDetails;