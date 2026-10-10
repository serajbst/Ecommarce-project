import { Link, useLocation } from "react-router-dom";

function MobileBottomNav() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      to: "/",
      icon: "fa-house",
      label: "Home",
    },
    {
      to: "/shop",
      icon: "fa-bag-shopping",
      label: "Shop",
    },
    {
      to: "/services",
      icon: "fa-screwdriver-wrench",
      label: "Services",
    },
    {
      to: "/orders",
      icon: "fa-box",
      label: "Orders",
    },
    {
      to: "/account",
      icon: "fa-user",
      label: "Account",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden">

      <div className="mx-auto grid h-16 max-w-lg grid-cols-5">

        {menuItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`relative flex flex-col items-center justify-center gap-1 transition ${
              isActive(item.to)
                ? "text-blue-600"
                : "text-slate-500"
            }`}
          >

            {/* Active indicator */}
            {isActive(item.to) && (
              <span className="absolute top-0 h-1 w-8 rounded-b-full bg-blue-600" />
            )}

            <i
              className={`fa-solid ${item.icon} text-[18px]`}
            ></i>

            <span className="text-[10px] font-semibold">
              {item.label}
            </span>

          </Link>
        ))}

      </div>

    </nav>
  );
}

export default MobileBottomNav;