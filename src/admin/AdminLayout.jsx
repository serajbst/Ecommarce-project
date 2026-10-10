import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-100">

      <AdminSidebar />

      <div className="lg:ml-64">
        <AdminHeader />

        <main className="p-5 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

    </div>
  );
}

export default AdminLayout;