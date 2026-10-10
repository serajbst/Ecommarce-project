import { Routes, Route, useLocation } from "react-router-dom";

// =====================================================
// CUSTOMER
// =====================================================
import Header from "./components/Header";
import Footer from "./components/footer";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Search from "./pages/Search";
import CategoryProducts from "./pages/CategoryProducts";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import TrackOrder from "./pages/TrackOrder";
import Account from "./pages/Account";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";

// Customer Orders
import CustomerOrders from "./pages/Orders";
import Invoice from "./pages/Invoice";

import RepairService from "./pages/services/RepairService";
import ServiceRequest from "./pages/services/ServiceRequest";
import ProductRequest from "./pages/services/ProductRequest";

// =====================================================
// ADMIN
// =====================================================
import AdminProtectedRoute from "./admin/AdminProtectedRoute";
import AdminLogin from "./admin/AdminLogin";
import AdminLayout from "./admin/AdminLayout";

import Dashboard from "./admin/Dashboard";

import Products from "./admin/Products";
import AddProduct from "./admin/AddProduct";
import EditProduct from "./admin/EditProduct";

import Categories from "./admin/Categories";
import AddCategory from "./admin/AddCategory";
import EditCategory from "./admin/EditCategory";

// Admin Orders
import Orders from "./admin/Orders";
import OrderDetails from "./admin/OrderDetails";

import Customers from "./admin/Customers";
import CustomerDetails from "./admin/CustomerDetails";

import Inventory from "./admin/Inventory";

import DeliveryAreas from "./admin/DeliveryAreas";
import AddDeliveryArea from "./admin/AddDeliveryArea";
import EditDeliveryArea from "./admin/EditDeliveryArea";

import Coupons from "./admin/Coupons";
import AddCoupon from "./admin/AddCoupon";
import EditCoupon from "./admin/EditCoupon";

import RepairBookings from "./admin/RepairBookings";
import RepairBookingDetails from "./admin/RepairBookingDetails";

import ServiceRequests from "./admin/ServiceRequests";
import ServiceRequestDetails from "./admin/ServiceRequestDetails";

import ProductRequests from "./admin/ProductRequests";
import ProductRequestDetails from "./admin/ProductRequestDetails";

import Settings from "./admin/Settings";
import Banners from "./admin/Banners";


function App() {
    const location = useLocation();

    // =====================================================
    // ADMIN ROUTE DETECTION
    // =====================================================
    // Customer Header must NOT appear on any admin page.
    //
    // Examples:
    // /admin
    // /admin/products
    // /admin/orders
    // /admin/customers
    // /admin/settings
    // =====================================================

    const isAdminRoute = location.pathname.startsWith("/admin");

    return (
        <>
            {/* =====================================================
                CUSTOMER HEADER

                Hidden completely on:
                /admin/*
            ===================================================== */}

            {!isAdminRoute && <Header />}

            <div className={!isAdminRoute ? "pb-20 lg:pb-0" : ""}>

                <Routes>

                    {/* =================================================
                        CUSTOMER ROUTES
                    ================================================= */}

                    <Route
                        path="/"
                        element={<Home />}
                    />

                    <Route
                        path="/shop"
                        element={<Shop />}
                    />
                    <Route path="/search" element={<Search />} />
                    {/* =================================================
                        CATEGORY PRODUCTS
                    ================================================= */}

                    <Route
                        path="/categories/:slug"
                        element={<CategoryProducts />}
                    />

                    {/* Backward-compatible category URL */}
                    <Route
                        path="/category/:slug"
                        element={<CategoryProducts />}
                    />

                    {/* =================================================
                        PRODUCT
                    ================================================= */}

                    <Route
                        path="/product/:id"
                        element={<ProductDetails />}
                    />

                    {/* =================================================
                        CART
                    ================================================= */}

                    <Route
                        path="/cart"
                        element={<Cart />}
                    />

                    {/* =================================================
                        CHECKOUT
                    ================================================= */}

                    <Route
                        path="/checkout"
                        element={<Checkout />}
                    />

                    {/* =================================================
                        ORDER SUCCESS
                    ================================================= */}

                    <Route
                        path="/order-success"
                        element={<OrderSuccess />}
                    />

                    {/* =================================================
                        CUSTOMER ORDERS
                    ================================================= */}

                    <Route
                        path="/orders"
                        element={<CustomerOrders />}
                    />
                    <Route
                            path="/orders/:id/invoice"
                            element={<Invoice />}
                            />

                    {/* =================================================
                        TRACK ORDER
                    ================================================= */}

                    <Route
                        path="/track-order"
                        element={<TrackOrder />}
                    />

                    {/* =================================================
                        ACCOUNT
                    ================================================= */}

                    <Route
                        path="/account"
                        element={<Account />}
                    />

                    {/* =================================================
                        PROFILE
                    ================================================= */}

                    <Route
                        path="/profile"
                        element={<Profile />}
                    />

                    {/* =================================================
                        WISHLIST
                    ================================================= */}

                    <Route
                        path="/wishlist"
                        element={<Wishlist />}
                    />

                    {/* =================================================
                        AUTH
                    ================================================= */}

                    <Route
                        path="/login"
                        element={<Login />}
                    />

                    <Route
                        path="/register"
                        element={<Register />}
                    />

                    {/* =================================================
                        CUSTOMER SERVICES
                    ================================================= */}

                    <Route
                        path="/services"
                        element={<RepairService />}
                    />

                    <Route
                        path="/services/request"
                        element={<ServiceRequest />}
                    />

                    <Route
                        path="/product-request"
                        element={<ProductRequest />}
                    />

                    {/* =================================================
                        ADMIN LOGIN
                    ================================================= */}

                    <Route
                        path="/admin/login"
                        element={<AdminLogin />}
                    />

                    {/* =================================================
                        PROTECTED ADMIN ROUTES
                    ================================================= */}

                    <Route element={<AdminProtectedRoute />}>

                        <Route
                            path="/admin"
                            element={<AdminLayout />}
                        >

                            {/* =================================================
                                ADMIN DASHBOARD
                            ================================================= */}

                            <Route
                                index
                                element={<Dashboard />}
                            />

                            <Route
                                path="dashboard"
                                element={<Dashboard />}
                            />

                            {/* =================================================
                                PRODUCTS
                            ================================================= */}

                            <Route
                                path="products"
                                element={<Products />}
                            />

                            <Route
                                path="products/add"
                                element={<AddProduct />}
                            />

                            <Route
                                path="products/edit/:id"
                                element={<EditProduct />}
                            />

                            {/* =================================================
                                CATEGORIES
                            ================================================= */}

                            <Route
                                path="categories"
                                element={<Categories />}
                            />

                            <Route
                                path="categories/add"
                                element={<AddCategory />}
                            />

                            <Route
                                path="categories/edit/:id"
                                element={<EditCategory />}
                            />

                            {/* =================================================
                                ADMIN ORDERS
                            ================================================= */}

                            <Route
                                path="orders"
                                element={<Orders />}
                            />

                            <Route
                                path="orders/:id"
                                element={<OrderDetails />}
                            />

                            {/* =================================================
                                CUSTOMERS
                            ================================================= */}

                            <Route
                                path="customers"
                                element={<Customers />}
                            />

                            <Route
                                path="customers/:id"
                                element={<CustomerDetails />}
                            />

                            {/* =================================================
                                INVENTORY
                            ================================================= */}

                            <Route
                                path="inventory"
                                element={<Inventory />}
                            />

                            {/* =================================================
                                DELIVERY AREAS
                            ================================================= */}

                            <Route
                                path="delivery-areas"
                                element={<DeliveryAreas />}
                            />

                            <Route
                                path="delivery-areas/add"
                                element={<AddDeliveryArea />}
                            />

                            <Route
                                path="delivery-areas/edit/:id"
                                element={<EditDeliveryArea />}
                            />

                            {/* =================================================
                                COUPONS
                            ================================================= */}

                            <Route
                                path="coupons"
                                element={<Coupons />}
                            />

                            <Route
                                path="coupons/add"
                                element={<AddCoupon />}
                            />

                            <Route
                                path="coupons/edit/:id"
                                element={<EditCoupon />}
                            />

                            {/* =================================================
                                REPAIR BOOKINGS
                            ================================================= */}

                            <Route
                                path="repairs"
                                element={<RepairBookings />}
                            />

                            <Route
                                path="repairs/:id"
                                element={<RepairBookingDetails />}
                            />

                            {/* =================================================
                                SERVICE REQUESTS
                            ================================================= */}

                            <Route
                                path="services"
                                element={<ServiceRequests />}
                            />

                            <Route
                                path="services/:id"
                                element={<ServiceRequestDetails />}
                            />

                            {/* =================================================
                                PRODUCT REQUESTS
                            ================================================= */}

                            <Route
                                path="product-requests"
                                element={<ProductRequests />}
                            />

                            <Route
                                path="product-requests/:id"
                                element={<ProductRequestDetails />}
                            />

                            {/* =================================================
                                SETTINGS
                            ================================================= */}

                            <Route
                                path="settings"
                                element={<Settings />}
                            />

                            {/* =================================================
                                BANNERS
                            ================================================= */}

                            <Route
                                path="banners"
                                element={<Banners />}
                            />

                        </Route>

                    </Route>

                </Routes>

                
                <Footer />

            </div>
        </>
    );
}

export default App;