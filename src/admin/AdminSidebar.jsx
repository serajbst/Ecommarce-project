import { NavLink, useNavigate } from "react-router-dom";

function AdminSidebar() {
  const navigate = useNavigate();

  const menu = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: "fa-gauge-high",
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: "fa-box",
    },
    {
      name: "Categories",
      path: "/admin/categories",
      icon: "fa-layer-group",
    },
    {
      name: "Orders",
      path: "/admin/orders",
      icon: "fa-cart-shopping",
    },
    {
      name: "Customers",
      path: "/admin/customers",
      icon: "fa-users",
    },
    {
      name: "Inventory",
      path: "/admin/inventory",
      icon: "fa-warehouse",
    },
    {
      name: "Delivery Areas",
      path: "/admin/delivery-areas",
      icon: "fa-location-dot",
    },
    {
      name: "Coupons",
      path: "/admin/coupons",
      icon: "fa-ticket",
    },
    {
      name: "Repair Bookings",
      path: "/admin/repairs",
      icon: "fa-screwdriver-wrench",
    },
    {
      name: "Service Requests",
      path: "/admin/services",
      icon: "fa-headset",
    },
    {
      name: "Product Requests",
      path: "/admin/product-requests",
      icon: "fa-lightbulb",
    },
    {
      name: "Banners",
      path: "/admin/banners",
      icon: "fa-images",
    },
  ];

  function handleLogout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");

    navigate("/admin/login", {
      replace: true,
    });
  }

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 border-r border-slate-200 bg-white lg:block">

      {/* Logo */}
      <div className="flex h-[72px] items-center border-b border-slate-200 px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-extrabold text-white">
            A
          </div>

          <div>
            <div className="font-heading text-lg font-extrabold text-slate-900">
              Ashraf<span className="text-blue-600">Bazar</span>
            </div>

            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="h-[calc(100vh-72px)] overflow-y-auto px-3 py-5">

        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Management
        </p>

        <div className="space-y-1">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <i className={`fa-solid ${item.icon} w-5 text-center`} />

              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        <div className="my-5 border-t border-slate-100" />

        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          System
        </p>

        {/* Settings */}
        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
              isActive
                ? "bg-blue-50 text-blue-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`
          }
        >
          <i className="fa-solid fa-gear w-5 text-center" />

          <span>Settings</span>
        </NavLink>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700"
        >
          <i className="fa-solid fa-right-from-bracket w-5 text-center" />

          <span>Logout</span>
        </button>

      </nav>
    </aside>
  );
}

export default AdminSidebar;