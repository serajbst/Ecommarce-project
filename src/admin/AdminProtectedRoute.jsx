import { Navigate, Outlet } from "react-router-dom";

export default function AdminProtectedRoute() {
    const token = localStorage.getItem("admin_token");
    const userData = localStorage.getItem("admin_user");

    if (!token || !userData) {
        return <Navigate to="/admin/login" replace />;
    }

    try {
        const user = JSON.parse(userData);

        if (user.role !== "admin") {
            localStorage.removeItem("admin_token");
            localStorage.removeItem("admin_user");

            return <Navigate to="/admin/login" replace />;
        }

        return <Outlet />;
    } catch (error) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");

        return <Navigate to="/admin/login" replace />;
    }
}