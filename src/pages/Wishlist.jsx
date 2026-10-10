import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Wishlist() {
  const { addToCart } = useCart();

  const [wishlist, setWishlist] = useState([
    {
      id: 1,
      name: "9W LED Bulb",
      category: "Electrical",
      price: 80,
      oldPrice: 100,
      rating: 4.8,
      reviews: 124,
      image: "/images/products/led-bulb.jpg",
      stock: 25,
    },
    {
      id: 2,
      name: "LED Emergency Bulb",
      category: "Electrical",
      price: 180,
      oldPrice: 220,
      rating: 4.7,
      reviews: 86,
      image: "/images/products/emergency-bulb.jpg",
      stock: 15,
    },
    {
      id: 3,
      name: "Extension Board",
      category: "Electrical",
      price: 249,
      oldPrice: 299,
      rating: 4.6,
      reviews: 72,
      image: "/images/products/extension-board.jpg",
      stock: 18,
    },
  ]);

  const removeFromWishlist = (id) => {
    setWishlist((items) => items.filter((item) => item.id !== id));
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  const getDiscount = (price, oldPrice) => {
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/account"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </Link>

            <div>
              <h1 className="font-heading text-xl font-extrabold text-slate-900 sm:text-2xl">
                My Wishlist
              </h1>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Products you saved for later
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Wishlist Count */}
        {wishlist.length > 0 && (
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                <i className="fa-solid fa-heart text-sm"></i>
              </div>

              <span className="text-sm font-bold text-slate-700">
                {wishlist.length}{" "}
                {wishlist.length === 1 ? "Product" : "Products"}
              </span>
            </div>
          </div>
        )}

        {/* Empty Wishlist */}
        {wishlist.length === 0 ? (
          <div className="flex min-h-[55vh] items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <i className="fa-regular fa-heart text-3xl"></i>
              </div>

              <h2 className="mt-5 font-heading text-xl font-extrabold text-slate-900">
                Your Wishlist is Empty
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Save products you like here and easily find them whenever you
                are ready to buy.
              </p>

              <Link
                to="/shop"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <i className="fa-solid fa-bag-shopping"></i>
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {wishlist.map((product) => (
                <article
                  key={product.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Remove Wishlist */}
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(product.id)}
                    aria-label="Remove from wishlist"
                    className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-rose-500 shadow-md backdrop-blur transition hover:bg-rose-50"
                  >
                    <i className="fa-solid fa-heart text-sm"></i>
                  </button>

                  {/* Discount */}
                  {product.oldPrice > product.price && (
                    <span className="absolute left-2 top-2 z-10 rounded-lg bg-blue-600 px-2 py-1 text-[9px] font-bold text-white sm:text-[10px]">
                      {getDiscount(product.price, product.oldPrice)}% OFF
                    </span>
                  )}

                  {/* Product Image */}
                  <Link
                    to={`/product/${product.id}`}
                    className="block overflow-hidden bg-slate-50"
                  >
                    <div className="flex aspect-square items-center justify-center p-3 sm:p-5">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-3 sm:p-4">
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:text-[10px]">
                      {product.category}
                    </p>

                    <Link
                      to={`/product/${product.id}`}
                      className="block"
                    >
                      <h2 className="line-clamp-2 min-h-[36px] text-xs font-bold leading-5 text-slate-800 transition hover:text-blue-600 sm:text-sm">
                        {product.name}
                      </h2>
                    </Link>

                    {/* Rating */}
                    <div className="mt-2 flex items-center gap-1">
                      <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
                        <i className="fa-solid fa-star text-[8px]"></i>
                        {product.rating}
                      </span>

                      <span className="text-[9px] text-slate-400">
                        ({product.reviews})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900 sm:text-base">
                        ₹{product.price}
                      </span>

                      <span className="text-[10px] text-slate-400 line-through sm:text-xs">
                        ₹{product.oldPrice}
                      </span>
                    </div>

                    {/* Add to Cart */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0}
                      className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold transition sm:text-sm ${
                        product.stock > 0
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700"
                          : "cursor-not-allowed bg-slate-100 text-slate-400"
                      }`}
                    >
                      <i className="fa-solid fa-cart-plus"></i>

                      {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="mt-8 flex justify-center">
              <Link
                to="/shop"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              >
                <i className="fa-solid fa-arrow-left"></i>
                Continue Shopping
              </Link>
            </div>
          </>
        )}

        {/* Local Delivery */}
        {wishlist.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white shadow-lg sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <i className="fa-solid fa-truck-fast text-lg"></i>
              </div>

              <div>
                <h3 className="font-heading text-sm font-extrabold sm:text-base">
                  Fast Local Delivery
                </h3>

                <p className="mt-1 text-xs leading-5 text-blue-100 sm:text-sm">
                  Order your favourite products from AshrafBazar and get them
                  delivered locally in Simri Bakhtiyarpur.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default Wishlist;