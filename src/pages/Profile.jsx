import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const PROFILE_API =
  "http://localhost/ashrafbazar/backend/api/auth/profile.php";

const UPDATE_PROFILE_API =
  "http://localhost/ashrafbazar/backend/api/auth/update-profile.php";

const ADDRESSES_API =
  "http://localhost/ashrafbazar/backend/api/addresses/index.php";

const BACKEND_BASE =
  "http://localhost/ashrafbazar/backend";

/* =========================================================
   HELPERS
========================================================= */

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("user_token") ||
    ""
  );
}

function getStoredUser() {
  try {
    const raw =
      localStorage.getItem("ashrafbazar_user");

    if (!raw) return null;

    const user = JSON.parse(raw);

    return user && typeof user === "object"
      ? user
      : null;
  } catch {
    return null;
  }
}

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

async function readJsonResponse(response) {
  const text = await response.text();

  let result = null;

  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Server returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message ||
        `Request failed with status ${response.status}.`
    );
  }

  return result;
}

/* =========================================================
   REUSABLE INPUT STYLES
========================================================= */

const inputBase =
  "w-full rounded-lg border px-3.5 text-sm text-slate-800 outline-none transition-colors duration-150";

const inputEditable =
  "border-slate-200 bg-white focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15";

const inputDisabled =
  "border-slate-200 bg-slate-50 text-slate-600";

/* =========================================================
   PROFILE
========================================================= */

function Profile() {
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [previewImage, setPreviewImage] =
    useState("");

  const [profile, setProfile] = useState({
    id: null,
    name: "",
    mobile: "",
    email: "",
    profileImage: "",
    address: "",
    city: "Simri Bakhtiyarpur",
    state: "Bihar",
    pincode: "",
    addressType: "home",
  });

  /* =======================================================
     LOAD PROFILE
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      const token = getToken();

      if (!token) {
        if (mounted) {
          setError(
            "Please login to view your profile."
          );
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);
        setError("");
        setSuccess("");

        let user = getStoredUser();

        /* -----------------------------------------------
           Fetch Profile
        ------------------------------------------------ */

        try {
          const response = await fetch(
            PROFILE_API,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const result =
              await readJsonResponse(response);

            const apiUser =
              result?.data?.user ||
              result?.data ||
              null;

            if (
              apiUser &&
              typeof apiUser === "object"
            ) {
              user = apiUser;
            }
          }
        } catch (profileError) {
          console.warn(
            "Profile API unavailable:",
            profileError
          );
        }

        /* -----------------------------------------------
           Fetch Addresses
        ------------------------------------------------ */

        const addressResponse = await fetch(
          ADDRESSES_API,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const addressResult =
          await readJsonResponse(
            addressResponse
          );

        const addresses =
          Array.isArray(
            addressResult?.data?.addresses
          )
            ? addressResult.data.addresses
            : [];

        const defaultAddress =
          addresses.find(
            (item) =>
              Number(item.is_default) === 1
          ) ||
          addresses[0] ||
          null;

        if (!mounted) return;

        const profileImage =
          user?.profile_image_url ||
          user?.profile_image ||
          "";

        setProfile({
          id:
            Number(user?.id || 0) || null,

          name: String(
            user?.name || ""
          ),

          mobile: String(
            user?.mobile || ""
          ),

          email: String(
            user?.email || ""
          ),

          profileImage:
            getImageUrl(profileImage),

          address: String(
            defaultAddress?.address_line || ""
          ),

          city: String(
            defaultAddress?.city ||
              "Simri Bakhtiyarpur"
          ),

          state: String(
            defaultAddress?.state ||
              "Bihar"
          ),

          pincode: String(
            defaultAddress?.pincode || ""
          ),

          addressType: String(
            defaultAddress?.address_type ||
              "home"
          ),
        });

        if (user) {
          localStorage.setItem(
            "ashrafbazar_user",
            JSON.stringify(user)
          );
        }
      } catch (err) {
        console.error(
          "Profile loading error:",
          err
        );

        if (mounted) {
          setError(
            err?.message ||
              "Unable to load your profile."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     INPUT CHANGE
  ======================================================= */

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  /* =======================================================
     IMAGE PICKER
  ======================================================= */

  const handleImageButton = () => {
    setEditing(true);
    setError("");
    setSuccess("");

    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, PNG and WEBP images are allowed."
      );

      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Profile image must not exceed 5 MB."
      );

      e.target.value = "";
      return;
    }

    const objectUrl =
      URL.createObjectURL(file);

    setSelectedImage(file);
    setPreviewImage(objectUrl);

    setEditing(true);
    setError("");
    setSuccess("");
  };

  /* =======================================================
     SAVE PROFILE
  ======================================================= */

  const handleSave = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const token = getToken();

    if (!token) {
      setError(
        "Your login session has expired. Please login again."
      );

      return;
    }

    const name =
      profile.name.trim();

    const mobile =
      profile.mobile.trim();

    const email =
      profile.email.trim();

    const address =
      profile.address.trim();

    const city =
      profile.city.trim();

    const state =
      profile.state.trim();

    const pincode =
      profile.pincode.trim();

    /* -----------------------------------------------
       Validation
    ------------------------------------------------ */

    if (!name) {
      setError(
        "Please enter your full name."
      );
      return;
    }

    if (
      name.length < 2 ||
      name.length > 100
    ) {
      setError(
        "Full name must be between 2 and 100 characters."
      );
      return;
    }

    if (
      !/^[6-9][0-9]{9}$/.test(mobile)
    ) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    if (!address) {
      setError(
        "Please enter your delivery address."
      );
      return;
    }

    if (!city) {
      setError(
        "Please enter your city."
      );
      return;
    }

    if (!state) {
      setError(
        "Please enter your state."
      );
      return;
    }

    if (
      !/^[0-9]{6}$/.test(pincode)
    ) {
      setError(
        "Please enter a valid 6-digit PIN code."
      );
      return;
    }

    /* -----------------------------------------------
       FormData
    ------------------------------------------------ */

    const formData = new FormData();

    formData.append("name", name);
    formData.append("mobile", mobile);
    formData.append("email", email);
    formData.append("address", address);
    formData.append("city", city);
    formData.append("state", state);
    formData.append("pincode", pincode);
    formData.append(
      "address_type",
      profile.addressType || "home"
    );

    if (selectedImage) {
      formData.append(
        "profile_image",
        selectedImage
      );
    }

    try {
      setSaving(true);

      const response = await fetch(
        UPDATE_PROFILE_API,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result =
        await readJsonResponse(response);

      const updatedUser =
        result?.data?.user || null;

      const updatedAddress =
        result?.data?.address || null;

      /* -----------------------------------------------
         Local User
      ------------------------------------------------ */

      if (updatedUser) {
        localStorage.setItem(
          "ashrafbazar_user",
          JSON.stringify(updatedUser)
        );
      }

      /* -----------------------------------------------
         Image
      ------------------------------------------------ */

      let updatedProfileImage =
        profile.profileImage;

      if (
        updatedUser?.profile_image_url
      ) {
        updatedProfileImage =
          getImageUrl(
            updatedUser.profile_image_url
          );
      } else if (
        updatedUser?.profile_image
      ) {
        updatedProfileImage =
          getImageUrl(
            updatedUser.profile_image
          );
      }

      /* -----------------------------------------------
         State
      ------------------------------------------------ */

      setProfile((prev) => ({
        ...prev,

        id:
          Number(
            updatedUser?.id ||
              prev.id ||
              0
          ) || null,

        name:
          updatedUser?.name ||
          prev.name,

        mobile:
          updatedUser?.mobile ||
          prev.mobile,

        email:
          updatedUser?.email ||
          "",

        profileImage:
          updatedProfileImage,

        address:
          updatedAddress?.address_line ||
          prev.address,

        city:
          updatedAddress?.city ||
          prev.city,

        state:
          updatedAddress?.state ||
          prev.state,

        pincode:
          updatedAddress?.pincode ||
          prev.pincode,

        addressType:
          updatedAddress?.address_type ||
          prev.addressType,
      }));

      setSelectedImage(null);
      setPreviewImage("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setEditing(false);

      setSuccess(
        result.message ||
          "Profile updated successfully."
      );

      window.dispatchEvent(
        new Event(
          "ashrafbazar-auth-change"
        )
      );
    } catch (err) {
      console.error(
        "Profile save error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     CANCEL
  ======================================================= */

  const handleCancel = () => {
    setEditing(false);
    setError("");
    setSuccess("");

    setSelectedImage(null);
    setPreviewImage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    window.location.reload();
  };

  /* =======================================================
     AVATAR
  ======================================================= */

  const avatarImage =
    previewImage ||
    profile.profileImage ||
    "";

  const avatarLetter =
    profile.name
      ?.charAt(0)
      ?.toUpperCase() || "U";

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4">
          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-500">
            <i className="fa-solid fa-spinner fa-spin text-[#0F766E]" />
            Loading profile...
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-10">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                to="/account"
                aria-label="Back to account"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] text-slate-600 transition-colors hover:border-[#0F766E]/40 hover:text-[#0F766E]"
              >
                <i className="fa-solid fa-arrow-left text-sm" />
              </Link>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0F766E]">
                  Account
                </p>

                <h1 className="truncate text-lg font-bold leading-tight text-[#0F172A] sm:text-xl">
                  My Profile
                </h1>
              </div>
            </div>

            {!editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setError("");
                  setSuccess("");
                }}
                className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-[#0F766E] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#0D9488] sm:h-10 sm:px-4 sm:text-sm"
              >
                <i className="fa-solid fa-pen text-[11px]" />

                <span className="hidden sm:inline">
                  Edit Profile
                </span>

                <span className="sm:hidden">
                  Edit
                </span>
              </button>
            )}
          </div>

          <p className="mt-1.5 hidden text-xs text-slate-500 sm:block">
            Manage your personal information and
            delivery address
          </p>
        </div>
      </section>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <section className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-6">
        {/* Messages */}

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 sm:text-sm">
            <i className="fa-solid fa-circle-exclamation mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-xs font-medium text-green-700 sm:text-sm">
            <i className="fa-solid fa-circle-check mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* ===================================================
            PROFILE SUMMARY
        =================================================== */}

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
            {/* Avatar */}

            <div className="relative shrink-0">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#0F766E] text-2xl font-bold text-white sm:h-24 sm:w-24 sm:text-3xl">
                {avatarImage ? (
                  <img
                    src={avatarImage}
                    alt={profile.name || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  avatarLetter
                )}
              </div>

              <button
                type="button"
                onClick={handleImageButton}
                disabled={saving}
                className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#0F766E] text-white shadow-sm transition-colors hover:bg-[#0D9488] disabled:opacity-60"
                aria-label="Change profile photo"
              >
                <i className="fa-solid fa-camera text-[11px]" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* User details */}

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold text-[#0F172A] sm:text-xl">
                {profile.name || "Customer"}
              </h2>

              <div className="mt-1.5 flex flex-col items-center gap-1 text-sm text-slate-500 sm:items-start">
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-phone text-[11px] text-slate-400" />
                  {profile.mobile || "Mobile not added"}
                </span>

                {profile.email && (
                  <span className="flex max-w-full items-center gap-2">
                    <i className="fa-regular fa-envelope text-[11px] text-slate-400" />
                    <span className="truncate">
                      {profile.email}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            FORM
        =================================================== */}

        <form
          onSubmit={handleSave}
          className="mt-4 space-y-4"
        >
          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <div className="rounded-2xl border border-[#E2E8F0] bg-white">
            <div className="border-b border-[#E2E8F0] px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-[#0F172A]">
                Personal Information
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Your basic account details
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Name */}

                <div>
                  <label
                    htmlFor="profile-name"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Full Name
                  </label>

                  <input
                    id="profile-name"
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    maxLength={100}
                    autoComplete="name"
                    className={`${inputBase} h-11 ${
                      editing ? inputEditable : inputDisabled
                    }`}
                  />
                </div>

                {/* Mobile */}

                <div>
                  <label
                    htmlFor="profile-mobile"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Mobile Number
                  </label>

                  <input
                    id="profile-mobile"
                    type="tel"
                    name="mobile"
                    value={profile.mobile}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    maxLength={10}
                    inputMode="numeric"
                    autoComplete="tel"
                    className={`${inputBase} h-11 ${
                      editing ? inputEditable : inputDisabled
                    }`}
                  />
                </div>

                {/* Email */}

                <div className="sm:col-span-2">
                  <label
                    htmlFor="profile-email"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Email Address
                  </label>

                  <input
                    id="profile-email"
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    maxLength={150}
                    autoComplete="email"
                    className={`${inputBase} h-11 ${
                      editing ? inputEditable : inputDisabled
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              DELIVERY ADDRESS
          ================================================= */}

          <div className="rounded-2xl border border-[#E2E8F0] bg-white">
            <div className="border-b border-[#E2E8F0] px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-[#0F172A]">
                Delivery Address
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Address used for your local deliveries
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Address */}

                <div className="sm:col-span-2">
                  <label
                    htmlFor="profile-address"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Full Address
                  </label>

                  <textarea
                    id="profile-address"
                    name="address"
                    value={profile.address}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    rows={3}
                    maxLength={5000}
                    placeholder="House no., street, landmark, village/locality..."
                    autoComplete="street-address"
                    className={`${inputBase} resize-none py-2.5 leading-6 ${
                      editing ? inputEditable : inputDisabled
                    }`}
                  />
                </div>

                {/* City */}

                <div>
                  <label
                    htmlFor="profile-city"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    City
                  </label>

                  <input
                    id="profile-city"
                    type="text"
                    name="city"
                    value={profile.city}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    maxLength={100}
                    autoComplete="address-level2"
                    className={`${inputBase} h-11 ${
                      editing ? inputEditable : inputDisabled
                    }`}
                  />
                </div>

                {/* State */}

                <div>
                  <label
                    htmlFor="profile-state"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    State
                  </label>

                  <input
                    id="profile-state"
                    type="text"
                    name="state"
                    value={profile.state}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    maxLength={100}
                    autoComplete="address-level1"
                    className={`${inputBase} h-11 ${
                      editing ? inputEditable : inputDisabled
                    }`}
                  />
                </div>

                {/* Pincode */}

                <div>
                  <label
                    htmlFor="profile-pincode"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    PIN Code
                  </label>

                  <input
                    id="profile-pincode"
                    type="text"
                    name="pincode"
                    value={profile.pincode}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    className={`${inputBase} h-11 ${
                      editing ? inputEditable : inputDisabled
                    }`}
                  />
                </div>

                {/* Address type */}

                <div>
                  <label
                    htmlFor="profile-address-type"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Address Type
                  </label>

                  <select
                    id="profile-address-type"
                    name="addressType"
                    value={profile.addressType}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    className={`${inputBase} h-11 ${
                      editing ? inputEditable : inputDisabled
                    }`}
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              EDIT ACTIONS
          ================================================= */}

          {editing && (
            <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="h-11 rounded-lg border border-[#E2E8F0] bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex h-11 items-center justify-center rounded-lg bg-[#0F766E] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0D9488] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>

        {/* =====================================================
            SECURITY
        ===================================================== */}

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3.5 sm:px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <i className="fa-solid fa-shield-halved text-sm" />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#0F172A]">
              Account Security
            </h3>

            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              Your profile information is protected.
              Only you can update your account
              details.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Profile;