import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const API_URL =
  "http://localhost/ashrafbazar/backend/api/auth/login.php";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobile, setMobile] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    location.state?.message || ""
  );

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    if (!/^[0-9]{10}$/.test(mobile)) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    try {
      setLoading(true);

      console.log(
        "Sending login request..."
      );

      /*
      |--------------------------------------------------------------------------
      | Login API
      |--------------------------------------------------------------------------
      */

      const response = await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },

          body: JSON.stringify({
            login: mobile,
            password: password,
          }),
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Read Raw Response
      |--------------------------------------------------------------------------
      */

      const rawResponse =
        await response.text();

      console.log(
        "LOGIN HTTP STATUS:",
        response.status
      );

      console.log(
        "LOGIN RAW RESPONSE:",
        rawResponse
      );

      /*
      |--------------------------------------------------------------------------
      | Parse JSON
      |--------------------------------------------------------------------------
      */

      let result;

      try {
        result = rawResponse
          ? JSON.parse(rawResponse)
          : null;
      } catch (jsonError) {
        console.error(
          "Invalid JSON from login API:",
          jsonError
        );

        setError(
          "Server returned an invalid response. Please try again."
        );

        return;
      }

      console.log(
        "LOGIN RESULT:",
        result
      );

      /*
      |--------------------------------------------------------------------------
      | API Error
      |--------------------------------------------------------------------------
      */

      if (
        !response.ok ||
        !result ||
        result.success !== true
      ) {
        setError(
          result?.message ||
            "Invalid mobile number or password."
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Get User
      |--------------------------------------------------------------------------
      */

      const user =
        result?.data?.user;

      /*
      |--------------------------------------------------------------------------
      | Get Authentication Token
      |--------------------------------------------------------------------------
      */

      const token =
        result?.data?.token;

      /*
      |--------------------------------------------------------------------------
      | User Validation
      |--------------------------------------------------------------------------
      */

      if (!user) {
        setError(
          "Login successful, but user data was not received."
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Token Validation
      |--------------------------------------------------------------------------
      */

      if (
        !token ||
        typeof token !== "string" ||
        !token.trim()
      ) {
        console.error(
          "Login API did not return a valid authentication token.",
          result
        );

        setError(
          "Login successful, but authentication token was not received."
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Save Authentication Token
      |--------------------------------------------------------------------------
      |
      | Checkout.jsx reads:
      |
      | localStorage.getItem("token")
      |
      | Therefore the customer JWT is stored using
      | the same key.
      |
      */

      localStorage.setItem(
        "token",
        token
      );

      /*
      |--------------------------------------------------------------------------
      | Save Logged-in User
      |--------------------------------------------------------------------------
      */

      localStorage.setItem(
        "ashrafbazar_user",
        JSON.stringify(user)
      );

      /*
      |--------------------------------------------------------------------------
      | Save Login State
      |--------------------------------------------------------------------------
      */

      localStorage.setItem(
        "ashrafbazar_logged_in",
        "true"
      );

      /*
      |--------------------------------------------------------------------------
      | Debug
      |--------------------------------------------------------------------------
      */

      console.log(
        "Customer login successful."
      );

      console.log(
        "Customer:",
        user
      );

      console.log(
        "Authentication token saved."
      );

      /*
      |--------------------------------------------------------------------------
      | Success Message
      |--------------------------------------------------------------------------
      */

      setSuccess(
        "Login successful. Redirecting..."
      );

      /*
      |--------------------------------------------------------------------------
      | Go To Account
      |--------------------------------------------------------------------------
      */

      setTimeout(() => {
        navigate(
          "/account",
          {
            replace: true,
          }
        );
      }, 700);

    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      setError(
        "Unable to connect to the server. Please check XAMPP."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-md">

        {/* =====================================================
            LOGO
        ====================================================== */}

        <Link
          to="/"
          className="mx-auto flex w-fit items-center gap-2.5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-extrabold text-white shadow-md shadow-blue-600/20">
            A
          </div>

          <div className="leading-none">
            <div className="font-heading text-xl font-extrabold tracking-tight text-slate-900">
              Ashraf
              <span className="text-blue-600">
                Chak
              </span>
            </div>

            <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Your Local Store
            </div>
          </div>
        </Link>

        {/* =====================================================
            LOGIN CARD
        ====================================================== */}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          {/* Heading */}

          <div className="text-center">
            <h1 className="font-heading text-2xl font-extrabold text-slate-900">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Login to manage your AshrafChak account.
            </p>
          </div>

          {/* =================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              <i className="fa-solid fa-circle-exclamation mt-0.5" />

              <span>
                {error}
              </span>
            </div>
          )}

          {/* =================================================
              SUCCESS
          ================================================== */}

          {success && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-3.5 text-sm text-green-700">
              <i className="fa-solid fa-circle-check mt-0.5" />

              <span>
                {success}
              </span>
            </div>
          )}

          {/* =================================================
              FORM
          ================================================== */}

          <form
            onSubmit={handleLogin}
            className="mt-7 space-y-5"
          >

            {/* =================================================
                MOBILE
            ================================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mobile Number
              </label>

              <div className="relative">

                <i className="fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  maxLength="10"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    );

                    setError("");
                  }}
                  placeholder="Enter 10-digit mobile number"
                  autoComplete="tel"
                  inputMode="numeric"
                  className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

              </div>
            </div>

            {/* =================================================
                PASSWORD
            ================================================== */}

            <div>

              <div className="mb-2 flex items-center justify-between">

                <label className="block text-sm font-semibold text-slate-700">
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Forgot Password?
                </Link>

              </div>

              <div className="relative">

                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(
                      e.target.value
                    );

                    setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  <i
                    className={`fa-solid ${
                      showPassword
                        ? "fa-eye-slash"
                        : "fa-eye"
                    }`}
                  />
                </button>

              </div>
            </div>

            {/* =================================================
                LOGIN BUTTON
            ================================================== */}

            <button
              type="submit"
              disabled={loading}
              className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition ${
                loading
                  ? "cursor-not-allowed bg-blue-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >

              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Login
                  <i className="fa-solid fa-arrow-right text-xs" />
                </>
              )}

            </button>

          </form>

          {/* =================================================
              REGISTER
          ================================================== */}

          <div className="mt-7 border-t border-slate-100 pt-6 text-center">

            <p className="text-sm text-slate-500">
              Don't have an account?
            </p>

            <Link
              to="/register"
              className="mt-2 inline-flex text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              Create New Account
            </Link>

          </div>

        </div>

        {/* =====================================================
            BACK TO HOME
        ====================================================== */}

        <Link
          to="/"
          className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
        >
          <i className="fa-solid fa-arrow-left text-xs" />
          Back to Home
        </Link>

      </div>
    </main>
  );
}

export default Login;