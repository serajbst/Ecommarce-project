import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost/ashrafbazar/backend/api";

export default function AdminLogin() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        login: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!formData.login.trim()) {
            setError("Email or mobile number is required.");
            return;
        }

        if (!formData.password) {
            setError("Password is required.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/admin/login.php`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        login: formData.login.trim(),
                        password: formData.password,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                setError(
                    result.message || "Unable to login."
                );
                return;
            }

            const token = result.data?.token;
            const user = result.data?.user;

            if (!token || !user) {
                setError("Invalid server response.");
                return;
            }

            if (user.role !== "admin") {
                setError("Admin access is required.");
                return;
            }

            localStorage.setItem(
                "admin_token",
                token
            );

            localStorage.setItem(
                "admin_user",
                JSON.stringify(user)
            );

           navigate("/admin", { replace: true });

        } catch (error) {
            console.error(
                "Admin login error:",
                error
            );

            setError(
                "Unable to connect to server."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

            <div className="w-full max-w-md">

                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">

                    <div className="text-center mb-8">

                        <h1 className="text-2xl font-bold text-gray-900">
                            Admin Login
                        </h1>

                        <p className="text-sm text-gray-500 mt-2">
                            Sign in to AshrafBazar Admin Panel
                        </p>

                    </div>

                    {error && (
                        <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        <div>
                            <label
                                htmlFor="login"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Email or Mobile
                            </label>

                            <input
                                id="login"
                                name="login"
                                type="text"
                                value={formData.login}
                                onChange={handleChange}
                                placeholder="Enter email or mobile"
                                autoComplete="username"
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter password"
                                autoComplete="current-password"
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading
                                ? "Signing in..."
                                : "Sign In"}
                        </button>

                    </form>

                </div>

            </div>

        </div>
    );
}