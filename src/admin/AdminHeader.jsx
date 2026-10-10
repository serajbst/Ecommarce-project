import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBars,
  FaBell,
  FaChevronDown,
  FaUserShield,
  FaSignOutAlt,
  FaTachometerAlt,
} from "react-icons/fa";

function AdminHeader({ onMenuClick }) {
  const [adminUser, setAdminUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // =====================================================
  // LOAD ADMIN USER
  // =====================================================
  useEffect(() => {
    loadAdminUser();

    const handleAdminAuthChange = () => {
      loadAdminUser();
    };

    window.addEventListener(
      "admin-auth-change",
      handleAdminAuthChange
    );

    return () => {
      window.removeEventListener(
        "admin-auth-change",
        handleAdminAuthChange
      );
    };
  }, []);

  // =====================================================
  // GET ADMIN DATA
  // =====================================================
  const loadAdminUser = () => {
    try {
      const storedAdmin = localStorage.getItem("admin_user");

      if (!storedAdmin) {
        setAdminUser(null);
        return;
      }

      const parsedAdmin = JSON.parse(storedAdmin);

      // Security check:
      // AdminHeader must only accept admin/staff data.
      if (
        parsedAdmin?.role !== "admin" &&
        parsedAdmin?.role !== "staff"
      ) {
        setAdminUser(null);
        return;
      }

      setAdminUser(parsedAdmin);
    } catch (error) {
      console.error("Admin user data error:", error);
      setAdminUser(null);
    }
  };

  // =====================================================
  // ADMIN LOGOUT
  // =====================================================
  const handleLogout = () => {
    setDropdownOpen(false);

    // Remove ONLY admin authentication
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");

    setAdminUser(null);

    // Notify admin components
    window.dispatchEvent(
      new Event("admin-auth-change")
    );

    // Redirect
    window.location.replace("/admin/login");
  };

  // =====================================================
  // ADMIN NAME
  // =====================================================
  const adminName =
    adminUser?.name ||
    adminUser?.full_name ||
    adminUser?.username ||
    "Administrator";

  // =====================================================
  // ADMIN ROLE
  // =====================================================
  const adminRole =
    adminUser?.role === "staff"
      ? "Staff"
      : "Administrator";

  // =====================================================
  // ADMIN EMAIL
  // =====================================================
  const adminEmail =
    adminUser?.email ||
    adminUser?.mobile ||
    "Admin Account";

  // =====================================================
  // PROFILE IMAGE
  // =====================================================
  const profileImage =
    adminUser?.profile_image_url ||
    adminUser?.profile_image ||
    "";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">

      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="flex min-w-0 items-center gap-3">

          {/* MOBILE MENU */}
          <button
            type="button"
            onClick={() => {
              if (typeof onMenuClick === "function") {
                onMenuClick();
              }
            }}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Open admin menu"
          >
            <FaBars size={20} />
          </button>

          {/* TITLE */}
          <div className="min-w-0">

            <h1 className="text-base font-bold text-slate-800 sm:text-lg">
              Admin Panel
            </h1>

            <p className="hidden text-xs text-slate-500 sm:block">
              AshrafBazar Management
            </p>

          </div>
        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="flex items-center gap-2 sm:gap-4">

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <button
            type="button"
            className="relative rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Notifications"
          >
            <FaBell size={18} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* =================================================
              ADMIN PROFILE
          ================================================= */}

          <div className="relative">

            {/* PROFILE BUTTON */}

            <button
              type="button"
              onClick={() =>
                setDropdownOpen((previous) => !previous)
              }
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100 sm:px-3"
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
            >

              {/* AVATAR */}

              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-white">

                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={adminName}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <FaUserShield size={17} />
                )}

              </div>

              {/* NAME + ROLE */}

              <div className="hidden min-w-0 text-left sm:block">

                <p className="max-w-[150px] truncate text-sm font-semibold text-slate-800">
                  {adminName}
                </p>

                <p className="text-xs text-slate-500">
                  {adminRole}
                </p>

              </div>

              
            </button>

           

          </div>

        </div>

      </div>

    </header>
  );
}

export default AdminHeader;