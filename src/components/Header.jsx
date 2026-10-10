import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import MobileBottomNav from "./MobileBottomNav";

import { useCart } from "../context/CartContext";

import logo from "../assets/images/Ashrafchak-logo.png";

/* =========================================================
   API
========================================================= */

const CATEGORIES_API =
  "http://localhost/ashrafbazar/backend/api/categories/index.php";

const BACKEND_BASE =
  "http://localhost/ashrafbazar/backend";

/* =========================================================
   IMAGE URL
========================================================= */

function getImageUrl(image) {
  if (!image) {
    return "";
  }

  const value = String(image).trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${BACKEND_BASE}${value}`;
  }

  return `${BACKEND_BASE}/${value}`;
}

/* =========================================================
   HEADER
========================================================= */

function Header() {
  const navigate = useNavigate();

  const { cartCount } = useCart();

  /* =======================================================
     SEARCH
  ======================================================= */

  const [search, setSearch] = useState("");

  /* =======================================================
     HEADER SCROLL
  ======================================================= */

  const [showMainHeader, setShowMainHeader] =
    useState(true);

  const [lastScrollY, setLastScrollY] =
    useState(0);

  /* =======================================================
     LOGIN USER
  ======================================================= */

  const [user, setUser] = useState(null);

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const [categories, setCategories] =
    useState([]);

  const [categoryLoading, setCategoryLoading] =
    useState(true);

  /* =======================================================
     PWA INSTALL
  ======================================================= */

  const [deferredPrompt, setDeferredPrompt] =
    useState(null);

  const [appInstalled, setAppInstalled] =
    useState(false);

  /* =======================================================
     PWA INSTALL EVENT
  ======================================================= */

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();

      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setAppInstalled(true);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );
    };
  }, []);

  /* =======================================================
     INSTALL APP
  ======================================================= */

  const handleInstallApp = async () => {
    if (appInstalled) {
      return;
    }

    if (!deferredPrompt) {
      alert(
        "Install option abhi available nahi hai.\n\nChrome ke 3 dots (⋮) par click karke 'Install Ashraf Chak' ya 'Add to Home screen' option check karein."
      );

      return;
    }

    try {
      deferredPrompt.prompt();

      const { outcome } =
        await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error(
        "PWA installation error:",
        error
      );
    }
  };

  /* =======================================================
     LOAD USER
  ======================================================= */

  useEffect(() => {
    const loadUser = () => {
      const loggedIn =
        localStorage.getItem(
          "ashrafbazar_logged_in"
        ) === "true";

      const savedUser =
        localStorage.getItem(
          "ashrafbazar_user"
        );

      if (loggedIn && savedUser) {
        try {
          const parsedUser =
            JSON.parse(savedUser);

          if (
            parsedUser &&
            typeof parsedUser === "object"
          ) {
            setUser(parsedUser);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error(
            "Invalid saved user:",
            error
          );

          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    loadUser();

    window.addEventListener(
      "ashrafbazar-auth-change",
      loadUser
    );

    return () => {
      window.removeEventListener(
        "ashrafbazar-auth-change",
        loadUser
      );
    };
  }, []);

  /* =======================================================
     LOAD CATEGORIES
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      try {
        setCategoryLoading(true);

        const response =
          await fetch(CATEGORIES_API);

        const result =
          await response.json();

        console.log(
          "CATEGORIES API:",
          result
        );

        if (!mounted) {
          return;
        }

        if (
          result?.success &&
          Array.isArray(
            result?.data?.categories
          )
        ) {
          setCategories(
            result.data.categories
          );
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error(
          "Categories API Error:",
          error
        );

        if (mounted) {
          setCategories([]);
        }
      } finally {
        if (mounted) {
          setCategoryLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     SCROLL HEADER
  ======================================================= */

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY =
        window.scrollY;

      if (currentScrollY <= 10) {
        setShowMainHeader(true);
        setLastScrollY(currentScrollY);
        return;
      }

      if (
        Math.abs(
          currentScrollY - lastScrollY
        ) < 8
      ) {
        return;
      }

      if (
        currentScrollY > lastScrollY
      ) {
        setShowMainHeader(false);
      } else {
        setShowMainHeader(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, [lastScrollY]);

  /* =======================================================
     CATEGORY ICON
  ======================================================= */

  const getCategoryIcon = (category) => {
    if (category?.icon) {
      return category.icon;
    }

    const name =
      category?.name?.toLowerCase() || "";

    if (name.includes("electrical")) {
      return "fa-lightbulb";
    }

    if (
      name.includes("home") ||
      name.includes("kitchen")
    ) {
      return "fa-house";
    }

    if (name.includes("electronic")) {
      return "fa-mobile-screen";
    }

    if (
      name.includes("daily") ||
      name.includes("need")
    ) {
      return "fa-basket-shopping";
    }

    if (name.includes("tool")) {
      return "fa-screwdriver-wrench";
    }

    if (name.includes("light")) {
      return "fa-lightbulb";
    }

    return "fa-layer-group";
  };

  /* =======================================================
     PROFILE IMAGE
  ======================================================= */

  const profileImage =
    getImageUrl(
      user?.profile_image_url ||
        user?.profile_image ||
        user?.profileImage ||
        ""
    );

  /* =======================================================
     USER NAME
  ======================================================= */

  const userName =
    user?.name || "Customer";

  /* =======================================================
     USER INITIAL
  ======================================================= */

  const userInitial =
    userName
      .charAt(0)
      .toUpperCase() || "U";

  /* =======================================================
     PROFILE IMAGE ERROR
  ======================================================= */

  const handleProfileImageError = (
    event
  ) => {
    event.currentTarget.style.display =
      "none";

    console.error(
      "Profile image failed to load:",
      profileImage
    );
  };

  /* =======================================================
     SEARCH SUBMIT
  ======================================================= */

  const handleSearch = (event) => {
    event.preventDefault();

    const query = search.trim();

    if (!query) {
      return;
    }

    navigate(
      `/search?q=${encodeURIComponent(query)}`
    );
  };

  /* =======================================================
     CLEAR SEARCH
  ======================================================= */

  const clearSearch = () => {
    setSearch("");
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* =====================================================
          HEADER SPACER
      ===================================================== */}

      <div className="h-[208px] sm:h-[216px] lg:h-[104px]" />

      {/* =====================================================
          FIXED HEADER
      ===================================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 bg-white shadow-sm">

        {/* ===================================================
            DESKTOP TOP BAR
        =================================================== */}

        <div className="hidden bg-slate-900 text-white sm:block">

          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2 text-xs sm:px-8">

            <div className="flex items-center gap-2 text-slate-300">

              <i className="fa-solid fa-location-dot text-blue-400" />

              <span>
                Delivering in Simri Bakhtiyarpur
              </span>

            </div>

            <div className="text-slate-300">

              Local Delivery

              <span className="mx-2 text-slate-500">
                •
              </span>

              Easy Shopping

            </div>

          </div>

        </div>

        {/* ===================================================
            MAIN HEADER
        =================================================== */}

        <div className="relative h-16 sm:h-[72px]">

          <div
            className={`absolute inset-x-0 top-0 z-30 border-b border-slate-100 bg-white transition-transform duration-300 ease-out ${
              showMainHeader
                ? "translate-y-0"
                : "-translate-y-full lg:translate-y-0"
            }`}
          >

            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-8">

              {/* =================================================
                  LOGO
              ================================================= */}

              <Link
                to="/"
                className="group flex shrink-0 items-center gap-2.5"
              >

                <img
                  src={logo}
                  alt="Ashraf Chak"
                  className="h-11 w-11 rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="leading-none">

                  <div className="font-heading text-lg font-extrabold tracking-tight text-slate-900">

                    Ashraf

                    <span className="text-green-600">
                      Chak
                    </span>

                  </div>

                  <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                     Online Shopping Now
                  </div>

                </div>

              </Link>

              {/* =================================================
                  DESKTOP NAV
              ================================================= */}

              <nav className="hidden items-center gap-1 lg:flex">

                <Link
                  to="/"
                  className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  Home
                </Link>

                <Link
                  to="/shop"
                  className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  Shop
                </Link>

                <Link
                  to="/services"
                  className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  Services
                </Link>

                <Link
                  to="/orders"
                  className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  My Order
                </Link>

              </nav>

              {/* =================================================
                  HEADER ACTIONS
              ================================================= */}

              <div className="flex items-center gap-1.5 sm:gap-2">

                {/* Desktop Install */}

                {!appInstalled && (
                  <button
                    type="button"
                    onClick={handleInstallApp}
                    aria-label="Install Ashraf Chak App"
                    className="hidden h-10 items-center gap-2 rounded-xl bg-green-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 lg:flex"
                  >

                    <i className="fa-solid fa-download text-sm" />

                    <span>
                     Install App
                    </span>

                  </button>
                )}

                {/* Desktop Account */}

                <Link
                  to="/account"
                  aria-label="Account"
                  className="hidden h-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 lg:flex"
                >

                  {user ? (

                    <div className="flex items-center gap-2 px-2">

                      {profileImage ? (

                        <img
                          src={profileImage}
                          alt={userName}
                          className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                          onError={
                            handleProfileImageError
                          }
                        />

                      ) : (

                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                          {userInitial}
                        </div>

                      )}

                      <span className="max-w-[90px] truncate text-sm font-semibold">
                        {userName}
                      </span>

                    </div>

                  ) : (

                    <div className="flex h-10 w-10 items-center justify-center">
                      <i className="fa-regular fa-user text-[18px]" />
                    </div>

                  )}

                </Link>

                {/* Mobile Profile */}

                <Link
                  to="/account"
                  aria-label="Account"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:border-blue-200 hover:bg-blue-50 lg:hidden"
                >

                  {user && profileImage ? (

                    <img
                      src={profileImage}
                      alt={userName}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={
                        handleProfileImageError
                      }
                    />

                  ) : user ? (

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {userInitial}
                    </div>

                  ) : (

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <i className="fa-regular fa-user text-sm" />
                    </div>

                  )}

                </Link>

                {/* Cart */}

                <Link
                  to="/cart"
                  aria-label="Cart"
                  className="relative flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                >

                  <i className="fa-solid fa-bag-shopping text-[16px]" />

                  <span className="hidden text-sm font-semibold sm:inline">
                    Cart
                  </span>

                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>

                </Link>

              </div>

            </div>

          </div>

        </div>

        {/* ===================================================
            MOBILE SEARCH + CATEGORIES
        =================================================== */}

        <div
          className={`absolute left-0 right-0 top-16 z-20 bg-white transition-transform duration-300 ease-out sm:top-[72px] lg:hidden ${
            showMainHeader
              ? "translate-y-0"
              : "-translate-y-16 sm:-translate-y-[72px]"
          }`}
        >

          {/* =================================================
              MOBILE SEARCH
          ================================================= */}

          <div className="border-b border-slate-100 bg-white px-4 py-3">

            <div className="flex w-full items-center gap-2">

              {/* =================================================
                  INSTALL BUTTON
                  OUTSIDE SEARCH INPUT
              ================================================= */}

              {!appInstalled && (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  aria-label="Install Ashraf Chak App"
                  className="flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-green-600 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-green-700 active:scale-95"
                >

                  <i className="fa-solid fa-download text-[11px]" />

                  <span>
                    App
                  </span>

                </button>
              )}

              {/* =================================================
                  SEARCH INPUT ONLY
              ================================================= */}

              <form
                onSubmit={handleSearch}
                className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10"
              >

                <i className="fa-solid fa-magnifying-glass shrink-0 text-lg text-blue-600" />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search products"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  aria-label="Search products"
                />

                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                    aria-label="Clear search"
                  >
                    <i className="fa-solid fa-xmark text-xs" />
                  </button>
                )}

              </form>

              {/* =================================================
                  SEARCH BUTTON
                  OUTSIDE SEARCH INPUT
              ================================================= */}

              <button
                type="button"
                onClick={handleSearch}
                disabled={!search.trim()}
                aria-label="Search"
                className="flex h-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 px-3 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Search
              </button>

            </div>

          </div>

          {/* =================================================
              CATEGORIES
          ================================================= */}

          <div className="border-b border-slate-100 bg-white">
  <div className="flex gap-4 overflow-x-auto px-4 py-3 scrollbar-hide">

    {categoryLoading ? (
      <>
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="flex min-w-[64px] shrink-0 flex-col items-center gap-1.5"
          >
            <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-100" />

            <div className="h-2 w-12 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </>
    ) : categories.length > 0 ? (
      categories.map((category) => (
        <Link
          key={category.id}
          to={`/categories/${category.slug}`}
          className="group flex min-w-[64px] shrink-0 flex-col items-center gap-1.5"
        >
          {/* CATEGORY IMAGE */}
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-slate-50 transition-transform duration-200 group-hover:scale-105">
  {category.image ? (
    <img
      src={getImageUrl(category.image)}
      alt={category.name}
      loading="lazy"
      className="h-full w-full object-cover"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  ) : (
    <i className="fa-solid fa-image text-sm text-slate-300" />
  )}
</div>

          {/* CATEGORY NAME */}
          <span className="max-w-[70px] truncate text-center text-[10px] font-semibold text-slate-700 transition-colors group-hover:text-[#0F766E]">
            {category.name}
          </span>
        </Link>
      ))
    ) : (
      <div className="px-2 py-2 text-xs text-slate-400">
        Categories unavailable
      </div>
    )}

  </div>
</div>

        </div>

      </header>

      {/* =====================================================
          MOBILE BOTTOM NAV
      ===================================================== */}

      <MobileBottomNav />

    </>
  );
}

export default Header;