import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const BACKEND_BASE =
  "http://localhost/ashrafbazar/backend";

/* =========================================================
   IMAGE URL HELPER
========================================================= */

function getImageUrl(image) {
  if (!image) return "";

  const value = String(image).trim();

  if (!value) return "";

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
   ACCOUNT
========================================================= */

function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false);

  /* =========================================================
     LOAD USER
  ========================================================= */

  useEffect(() => {
    const loadUser = () => {
      const storedUser =
        localStorage.getItem("ashrafbazar_user");

      const loggedIn =
        localStorage.getItem(
          "ashrafbazar_logged_in"
        );

      if (!storedUser || loggedIn !== "true") {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error(
          "Invalid stored user:",
          error
        );

        localStorage.removeItem(
          "ashrafbazar_user"
        );

        localStorage.removeItem(
          "ashrafbazar_logged_in"
        );

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

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogoutRequest = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem(
      "ashrafbazar_user"
    );

    localStorage.removeItem(
      "ashrafbazar_logged_in"
    );

    localStorage.removeItem("token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_token");

    setUser(null);
    setShowLogoutConfirm(false);

    window.dispatchEvent(
      new Event("ashrafbazar-auth-change")
    );

    navigate("/login");
  };

  /* =========================================================
     USER DATA
  ========================================================= */

  const userName =
    user?.name || "Customer";

  const firstName =
    userName.split(" ")[0];

  const userInitial =
    userName.charAt(0).toUpperCase();

  const profileImage = getImageUrl(
    user?.profile_image_url ||
      user?.profile_image ||
      ""
  );

  /* =========================================================
     ACCOUNT MENU
  ========================================================= */

  const accountItems = [
    {
      title: "My Orders",
      description:
        "View and manage your orders",
      icon: "fa-box",
      iconBg: "bg-[#0F766E]/10 text-[#0F766E]",
      to: "/orders",
    },

    /* {
      title: "Track Order",
      description:
        "Check your delivery status",
      icon: "fa-truck-fast",
      iconBg: "bg-[#0F766E]/10 text-[#0F766E]",
      to: "/track-order",
    },

   {
      title: "Wishlist",
      description:
        "Your saved favourite products",
      icon: "fa-heart",
      iconBg: "bg-[#0F766E]/10 text-[#0F766E]",
      to: "/wishlist",
    },*/

    {
      title: "Profile",
      description:
        "View and update your information",
      icon: "fa-user-pen",
      iconBg: "bg-[#0F766E]/10 text-[#0F766E]",
      to: "/profile",
    },

    {
      title: "Help & Support",
      description:
        "Get assistance from our team",
      icon: "fa-headset",
      iconBg: "bg-[#0F766E]/10 text-[#0F766E]",
      to: "/contact",
    },
  ];

  /* =========================================================
     LOGGED OUT
  ========================================================= */

  if (!user) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:py-12">
        <div className="mx-auto flex min-h-[75vh] max-w-md items-center">
          <div className="w-full overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
            {/* TOP */}
            <div className="border-b border-[#E2E8F0] px-6 py-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0F766E] text-2xl text-white">
                <i className="fa-solid fa-user" />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
                AshrafChak
              </p>

              <h1 className="mt-1.5 text-xl font-bold text-[#0F172A] sm:text-2xl">
                Welcome Back
              </h1>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                Login to access your orders,
                wishlist and account.
              </p>
            </div>

            {/* ACTIONS */}
            <div className="space-y-3 p-6">
              <Link
                to="/login"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0F766E] text-sm font-semibold text-white transition-colors hover:bg-[#0D9488]"
              >
                <i className="fa-solid fa-right-to-bracket" />
                Login
              </Link>

              <Link
                to="/register"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-sm font-semibold text-slate-700 transition-colors hover:border-[#0F766E]/40 hover:text-[#0F766E]"
              >
                <i className="fa-solid fa-user-plus" />
                Create Account
              </Link>

              <Link
                to="/"
                className="flex h-10 w-full items-center justify-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-[#0F766E]"
              >
                <i className="fa-solid fa-arrow-left text-xs" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     LOGGED IN ACCOUNT
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-10">
      {/* =====================================================
          PROFILE HEADER
      ===================================================== */}

      <section className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            {/* PROFILE */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative shrink-0">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#0F766E] text-lg font-bold text-white sm:h-14 sm:w-14 sm:text-xl">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={userName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    userInitial
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0F766E]">
                  My Account
                </p>

                <h1 className="mt-0.5 truncate text-base font-bold text-[#0F172A] sm:text-lg">
                  {userName}
                </h1>

                <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-slate-500">
                  {user.mobile && (
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <i className="fa-solid fa-phone text-[9px]" />
                      {user.mobile}
                    </span>
                  )}

                  {user.email && (
                    <>
                      <span className="text-slate-300">
                        •
                      </span>

                      <span className="hidden max-w-[180px] truncate sm:flex sm:items-center sm:gap-1.5">
                        <i className="fa-regular fa-envelope text-[9px]" />
                        {user.email}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* LOGOUT */}
            <button
              type="button"
              onClick={handleLogoutRequest}
              className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 sm:h-10 sm:px-4 sm:text-sm"
            >
              <i className="fa-solid fa-right-from-bracket" />

              <span className="hidden sm:inline">
                Logout
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* GREETING */}
<div className="mb-5">
  <div className="flex items-center justify-between gap-4">
    
    {/* LEFT CONTENT */}
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#0F766E]">
        Account Overview
      </p>

      

      <p className="mt-1 text-sm text-slate-500">
        Manage your AshrafChak account
        and shopping activity.
      </p>
    </div>

   {/* RIGHT SIDE VIDEO */}
<div className="h-28 w-48 shrink-0 overflow-hidden rounded-2xl sm:h-32 sm:w-56">
  <video
    src="/images/about/p-video.mp4"
    autoPlay
    muted
    loop
    playsInline
    preload="auto"
    className="h-full w-full object-cover object-center"
  />
</div>

  </div>

  {/* CONTINUE SHOPPING */}
  <div className="mt-4 flex justify-end">
    <Link
      to="/"
      className="hidden h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[#0F766E]/40 hover:text-[#0F766E] sm:flex"
    >
      <i className="fa-solid fa-store" />
      Continue Shopping
    </Link>
  </div>
</div>
        {/* ===================================================
            QUICK LINKS
        =================================================== */}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accountItems.map((item) => (
            <Link
              key={item.title}
              to={item.to}
              className="group flex items-center gap-3.5 rounded-2xl border border-[#E2E8F0] bg-white p-4 transition-colors hover:border-[#0F766E]/40 hover:bg-[#0F766E]/[0.02]"
            >
              {/* ICON */}
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
              >
                <i
                  className={`fa-solid ${item.icon} text-base`}
                />
              </div>

              {/* TEXT */}
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-[#0F172A]">
                  {item.title}
                </h3>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {item.description}
                </p>
              </div>

              {/* ARROW */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors group-hover:text-[#0F766E]">
                <i className="fa-solid fa-chevron-right text-[10px]" />
              </div>
            </Link>
          ))}
        </div>

        {/* ===================================================
            ACCOUNT INFORMATION
        =================================================== */}

        <div className="mt-5 rounded-2xl border border-[#E2E8F0] bg-white">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Account Details
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                Your registered information
              </p>
            </div>

            <Link
              to="/profile"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] transition-colors hover:text-[#0D9488]"
            >
              View
              <i className="fa-solid fa-chevron-right text-[10px]" />
            </Link>
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {/* NAME */}
            <div className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0F766E]/10 text-[#0F766E]">
                <i className="fa-regular fa-user text-xs" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Name
                </p>

                <p className="mt-0.5 truncate text-sm font-medium text-[#0F172A]">
                  {userName}
                </p>
              </div>
            </div>

            {/* MOBILE */}
            {user.mobile && (
              <div className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0F766E]/10 text-[#0F766E]">
                  <i className="fa-solid fa-phone text-xs" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Mobile
                  </p>

                  <p className="mt-0.5 truncate text-sm font-medium text-[#0F172A]">
                    {user.mobile}
                  </p>
                </div>
              </div>
            )}

            {/* EMAIL */}
            {user.email && (
              <div className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0F766E]/10 text-[#0F766E]">
                  <i className="fa-regular fa-envelope text-xs" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Email
                  </p>

                  <p className="mt-0.5 truncate text-sm font-medium text-[#0F172A]">
                    {user.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MOBILE SHOPPING BUTTON */}
        <Link
          to="/"
          className="mt-5 flex h-11 items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-sm font-semibold text-slate-700 transition-colors hover:border-[#0F766E]/40 hover:text-[#0F766E] sm:hidden"
        >
          <i className="fa-solid fa-store" />
          Continue Shopping
        </Link>
      </section>

      {/* =====================================================
          LOGOUT CONFIRMATION MODAL
      ===================================================== */}

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          onClick={handleLogoutCancel}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ICON */}
            <div className="flex flex-col items-center px-6 pt-7 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                <i className="fa-solid fa-right-from-bracket text-xl" />
              </div>

              <h3
                id="logout-title"
                className="mt-4 text-base font-semibold text-[#0F172A]"
              >
                Logout from AshrafBazar?
              </h3>

              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                Are you sure you want to log out of
                your AshrafChak account?
              </p>
            </div>

            {/* ACTIONS */}
            <div className="mt-6 flex flex-col-reverse gap-2.5 border-t border-[#E2E8F0] p-4 sm:flex-row">
              <button
                type="button"
                onClick={handleLogoutCancel}
                className="h-11 flex-1 rounded-lg border border-[#E2E8F0] bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="h-11 flex-1 rounded-lg bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Account;