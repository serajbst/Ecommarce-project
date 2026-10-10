import { useEffect, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";

const API_URL =

  "http://localhost/ashrafbazar/backend/api/orders/create.php";

const ADDRESSES_API =

  "http://localhost/ashrafbazar/backend/api/addresses/index.php";

const CREATE_ADDRESS_API =

  "http://localhost/ashrafbazar/backend/api/addresses/create.php";

const BACKEND_BASE =

  "http://localhost/ashrafbazar/backend";

/*

|--------------------------------------------------------------------------

| Helpers

|--------------------------------------------------------------------------

*/

function toNumber(value, fallback = 0) {

  const number = Number(value);

  return Number.isFinite(number)

    ? number

    : fallback;

}

function getImageUrl(image) {

  if (!image) {

    return "";

  }

  const value = String(image).trim();

  if (!value) {

    return "";

  }

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

/*

|--------------------------------------------------------------------------

| Token

|--------------------------------------------------------------------------

*/

function getCustomerToken() {

  return (

    localStorage.getItem("token") ||

    localStorage.getItem("auth_token") ||

    localStorage.getItem("user_token") ||

    ""

  );

}

/*

|--------------------------------------------------------------------------

| Checkout

|--------------------------------------------------------------------------

*/

function Checkout() {

  const navigate = useNavigate();
  const location = useLocation();

  const {

    cartItems,

    cartSubtotal,

    deliveryCharge = 0,

    cartTotal,

    clearCart,

  } = useCart();

  /*
   * Buy Now is passed through React Router state and is NOT
   * added to CartContext.
   */
  const buyNowItem = location.state?.buyNowItem || null;
  const isBuyNow = Boolean(buyNowItem);

  /*
   * Buy Now checkout uses only the selected product.
   * Normal checkout continues using CartContext items.
   */
  const checkoutItems = isBuyNow
    ? [buyNowItem]
    : Array.isArray(cartItems)
      ? cartItems
      : [];

  const checkoutSubtotal = isBuyNow
    ? toNumber(buyNowItem?.price) *
      toNumber(buyNowItem?.quantity, 1)
    : toNumber(cartSubtotal);

  const checkoutTotal =
    checkoutSubtotal + toNumber(deliveryCharge);

  /*

  |--------------------------------------------------------------------------

  | Form

  |--------------------------------------------------------------------------

  */

  const [formData, setFormData] = useState({

    name: "",

    mobile: "",

    email: "",

    address: "",

    city: "Simri Bakhtiyarpur",

    state: "Bihar",

    pincode: "",

  });

  /*

  |--------------------------------------------------------------------------

  | Saved Addresses

  |--------------------------------------------------------------------------

  */

  const [savedAddresses, setSavedAddresses] = useState([]);

  const [selectedAddressId, setSelectedAddressId] =

    useState(null);

  const [loadingAddresses, setLoadingAddresses] =

    useState(false);

  const [showNewAddressForm, setShowNewAddressForm] =

    useState(false);

  /*

  |--------------------------------------------------------------------------

  | Checkout State

  |--------------------------------------------------------------------------

  */

  const [paymentMethod, setPaymentMethod] =

    useState("cod");

  const [loading, setLoading] =

    useState(false);

  const [error, setError] =

    useState("");

  /*

  |--------------------------------------------------------------------------

  | Load Saved Addresses

  |--------------------------------------------------------------------------

  */

  useEffect(() => {

    let mounted = true;

    const token = getCustomerToken();

    /*

     * Guest user

     */

    if (!token) {

      setShowNewAddressForm(true);

      return;

    }

    const fetchAddresses = async () => {

      try {

        setLoadingAddresses(true);

        const response = await fetch(

          ADDRESSES_API,

          {

            method: "GET",

            headers: {

              Accept: "application/json",

              Authorization: `Bearer ${token}`,

            },

          }

        );

        const responseText =

          await response.text();

        let result = null;

        try {

          result = responseText

            ? JSON.parse(responseText)

            : null;

        } catch (parseError) {

          console.error(

            "Invalid addresses response:",

            responseText

          );

          throw new Error(

            "Unable to read saved addresses."

          );

        }

        if (

          !response.ok ||

          !result ||

          result.success !== true

        ) {

          throw new Error(

            result?.message ||

              "Unable to load saved addresses."

          );

        }

        const addresses =

          Array.isArray(result?.data?.addresses)

            ? result.data.addresses

            : [];

        if (!mounted) {

          return;

        }

        setSavedAddresses(addresses);

        /*

         * Existing saved address

         */

        if (addresses.length > 0) {

          const defaultAddress =

            addresses.find(

              (address) =>

                Number(address.is_default) === 1

            ) || addresses[0];

          handleSelectAddress(

            defaultAddress,

            false

          );

        } else {

          /*

           * First order

           */

          setShowNewAddressForm(true);

        }

      } catch (err) {

        console.error(

          "Saved addresses error:",

          err

        );

        if (mounted) {

          setSavedAddresses([]);

          setShowNewAddressForm(true);

        }

      } finally {

        if (mounted) {

          setLoadingAddresses(false);

        }

      }

    };

    fetchAddresses();

    return () => {

      mounted = false;

    };

  }, []);

  /*

  |--------------------------------------------------------------------------

  | Change Handler

  |--------------------------------------------------------------------------

  */

  const handleChange = (e) => {

    const {

      name,

      value,

    } = e.target;

    setFormData((prev) => ({

      ...prev,

      [name]: value,

    }));

    /*

     * If user starts editing address manually,

     * it is a new address.

     */

    if (

      name === "address" ||

      name === "city" ||

      name === "state" ||

      name === "pincode" ||

      name === "name" ||

      name === "mobile"

    ) {

      setSelectedAddressId(null);

    }

    if (error) {

      setError("");

    }

  };

  /*

  |--------------------------------------------------------------------------

  | Select Saved Address

  |--------------------------------------------------------------------------

  */

  const handleSelectAddress = (

    address,

    closeNewForm = true

  ) => {

    if (!address) {

      return;

    }

    setSelectedAddressId(

      Number(address.id)

    );

    setFormData((prev) => ({

      ...prev,

      name:

        address.name ||

        "",

      mobile:

        address.mobile ||

        "",

      address:

        address.address_line ||

        "",

      city:

        address.city ||

        "Simri Bakhtiyarpur",

      state:

        address.state ||

        "Bihar",

      pincode:

        address.pincode ||

        "",

    }));

    if (closeNewForm) {

      setShowNewAddressForm(false);

    }

    setError("");

  };

  /*

  |--------------------------------------------------------------------------

  | Add New Address

  |--------------------------------------------------------------------------

  */

  const handleUseNewAddress = () => {

    setSelectedAddressId(null);

    setShowNewAddressForm(true);

    /*

     * Keep name/mobile because they may be useful

     * for the new address.

     */

    setFormData((prev) => ({

      ...prev,

      address: "",

      city: "Simri Bakhtiyarpur",

      state: "Bihar",

      pincode: "",

    }));

    setError("");

  };

  /*

  |--------------------------------------------------------------------------

  | Save New Address

  |--------------------------------------------------------------------------

  |

  | This runs AFTER successful order.

  |

  | Important:

  | If address saving fails, the order remains successful.

  |

  */

  const saveNewAddress = async ({

    name,

    mobile,

    address,

    city,

    state,

    pincode,

  }) => {

    const token = getCustomerToken();

    if (!token) {

      return false;

    }

    try {

      const payload = {

        name,

        mobile,

        address_line: address,

        city,

        state,

        pincode,

        address_type: "home",

        is_default:

          savedAddresses.length === 0 ? 1 : 0,

      };

      const response = await fetch(

        CREATE_ADDRESS_API,

        {

          method: "POST",

          headers: {

            "Content-Type":

              "application/json",

            Accept:

              "application/json",

            Authorization:

              `Bearer ${token}`,

          },

          body: JSON.stringify(payload),

        }

      );

      const responseText =

        await response.text();

      let result = null;

      try {

        result = responseText

          ? JSON.parse(responseText)

          : null;

      } catch (parseError) {

        console.error(

          "Invalid create address response:",

          responseText

        );

        return false;

      }

      if (

        !response.ok ||

        !result ||

        result.success !== true

      ) {

        console.error(

          "Address save failed:",

          result?.message ||

            "Unable to save address."

        );

        return false;

      }

      return true;

    } catch (err) {

      console.error(

        "Save address error:",

        err

      );

      return false;

    }

  };

  /*

  |--------------------------------------------------------------------------

  | Place Order

  |--------------------------------------------------------------------------

  */

  const handlePlaceOrder = async (e) => {

    e.preventDefault();

    if (loading) {

      return;

    }

    setError("");

    /*

    |--------------------------------------------------------------------------

    | Cart Check

    |--------------------------------------------------------------------------

    */

    if (

      !Array.isArray(checkoutItems) ||

      checkoutItems.length === 0

    ) {

      setError(

        isBuyNow

          ? "The selected product is no longer available for checkout."

          : "Your cart is empty."

      );

      return;

    }

    /*

    |--------------------------------------------------------------------------

    | Clean Values

    |--------------------------------------------------------------------------

    */

    const name =

      formData.name.trim();

    const mobile =

      formData.mobile.trim();

    const email =

      formData.email.trim();

    const address =

      formData.address.trim();

    const city =

      formData.city.trim();

    const state =

      formData.state.trim();

    const pincode =

      formData.pincode.trim();

    /*

    |--------------------------------------------------------------------------

    | Validation

    |--------------------------------------------------------------------------

    */

    if (!name) {

      setError(

        "Please enter your full name."

      );

      return;

    }

    if (name.length > 100) {

      setError(

        "Name cannot be longer than 100 characters."

      );

      return;

    }

    if (

      !/^[0-9]{10}$/.test(mobile)

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

        "Please enter your complete delivery address."

      );

      return;

    }

    if (address.length > 5000) {

      setError(

        "Delivery address is too long."

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

    /*

    |--------------------------------------------------------------------------

    | Payment

    |--------------------------------------------------------------------------

    */

    if (paymentMethod !== "cod") {

      setError(

        "Online payment is not available yet."

      );

      return;

    }

    /*

    |--------------------------------------------------------------------------

    | Build Order Items

    |--------------------------------------------------------------------------

    */

    const items = [];

    for (const item of checkoutItems) {

      const productId =

        Number(item.id);

      const quantity =

        Number(item.quantity);

      if (

        !Number.isInteger(productId) ||

        productId <= 0

      ) {

        setError(

          "A product in your cart is invalid. Please remove it and add it again."

        );

        return;

      }

      if (

        !Number.isInteger(quantity) ||

        quantity <= 0

      ) {

        setError(

          "Invalid product quantity found in your cart."

        );

        return;

      }

      if (quantity > 100) {

        setError(

          "Maximum 100 units of one product can be ordered."

        );

        return;

      }

      items.push({

        product_id:

          productId,

        quantity:

          quantity,

      });

    }

    /*

    |--------------------------------------------------------------------------

    | Start Request

    |--------------------------------------------------------------------------

    */

    setLoading(true);

    try {

      /*

      |--------------------------------------------------------------------------

      | Customer Token

      |--------------------------------------------------------------------------

      */

      const token =

        getCustomerToken();

      /*

      |--------------------------------------------------------------------------

      | Payload

      |--------------------------------------------------------------------------

      */

      const payload = {

        customer_name:

          name,

        customer_mobile:

          mobile,

        customer_email:

          email || null,

        address_line:

          address,

        city:

          city,

        state:

          state,

        pincode:

          pincode,

        payment_method:

          paymentMethod,

        subtotal: checkoutSubtotal,

        delivery_charge:

          toNumber(deliveryCharge),

        discount: 0,

        total: checkoutTotal,

        items:

          items,

      };

      /*

      |--------------------------------------------------------------------------

      | Headers

      |--------------------------------------------------------------------------

      */

      const headers = {

        "Content-Type":

          "application/json",

        Accept:

          "application/json",

      };

      if (token) {

        headers.Authorization =

          `Bearer ${token}`;

      }

      /*

      |--------------------------------------------------------------------------

      | API Request

      |--------------------------------------------------------------------------

      */

      const response = await fetch(

        API_URL,

        {

          method: "POST",

          headers,

          body: JSON.stringify(

            payload

          ),

        }

      );

      /*

      |--------------------------------------------------------------------------

      | Read Response

      |--------------------------------------------------------------------------

      */

      const responseText =

        await response.text();

      let result = null;

      try {

        result = responseText

          ? JSON.parse(responseText)

          : null;

      } catch (parseError) {

        console.error(

          "Invalid API response:",

          responseText

        );

        throw new Error(

          "Server returned an invalid response."

        );

      }

      /*

      |--------------------------------------------------------------------------

      | API Failure

      |--------------------------------------------------------------------------

      */

      if (

        !response.ok ||

        !result ||

        result.success !== true

      ) {

        throw new Error(

          result?.message ||

            "Unable to place your order."

        );

      }

      /*

      |--------------------------------------------------------------------------

      | Created Order

      |--------------------------------------------------------------------------

      */

      const order =

        result?.data?.order ||

        result?.data ||

        null;

      const orderNumber =

        order?.order_number ||

        result?.data?.order_number ||

        "";

      /*

      |--------------------------------------------------------------------------

      | Save New Address

      |--------------------------------------------------------------------------

      |

      | Only save when:

      | 1. Customer is logged in

      | 2. User was using new address form

      | 3. It wasn't an already-selected saved address

      |

      */

      if (

        token &&

        showNewAddressForm &&

        !selectedAddressId

      ) {

        await saveNewAddress({

          name,

          mobile,

          address,

          city,

          state,

          pincode,

        });

      }

      /*

      |--------------------------------------------------------------------------

      | Clear Cart ONLY After Successful Normal Cart Order

      |--------------------------------------------------------------------------

      | Buy Now never clears the existing CartContext cart.

      |--------------------------------------------------------------------------

      */

      if (!isBuyNow) {

        clearCart();

      }

      /*

      |--------------------------------------------------------------------------

      | Success Page

      |--------------------------------------------------------------------------

      */

     navigate("/order-success", {
  replace: true,
  state: {
    order: order,
    orderNumber: orderNumber,
    total: checkoutTotal,
    paymentMethod: paymentMethod,
    message:
      result.message ||
      "Order placed successfully.",
  },
});

    } catch (err) {

      console.error(

        "Place order error:",

        err

      );

      setError(

        err?.message ||

          "Unable to place your order. Please try again."

      );

    } finally {

      setLoading(false);

    }

  };

  /*

  |--------------------------------------------------------------------------

  | Empty Cart

  |--------------------------------------------------------------------------

  */

  if (

    !isBuyNow &&

    (!Array.isArray(cartItems) ||

      cartItems.length === 0)

  ) {

    return (

      <main className="min-h-screen bg-slate-50 px-5 py-12">

        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">

            <i className="fa-solid fa-cart-shopping text-2xl" />

          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">

            Your Cart is Empty

          </h1>

          <p className="mt-2 text-sm text-slate-500">

            Add some products before proceeding to checkout.

          </p>

          <Link

            to="/shop"

            className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"

          >

            Continue Shopping

          </Link>

        </div>

      </main>

    );

  }

  /*

  |--------------------------------------------------------------------------

  | Main UI

  |--------------------------------------------------------------------------

  */

  return (

    <main className="min-h-screen bg-slate-50">

      

      {/* Checkout Content */}

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">

        <form

          onSubmit={handlePlaceOrder}

          className="grid gap-6 lg:grid-cols-[1fr_400px]"

        >

          {/* LEFT */}

          <div className="space-y-6">

            {/* Error */}

            {error && (

              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                <i className="fa-solid fa-circle-exclamation mt-0.5" />

                <p className="font-medium">

                  {error}

                </p>

              </div>

            )}

            {/* Delivery Information */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <h2 className="text-lg font-bold text-slate-900">

                    Delivery Information

                  </h2>

                  <p className="mt-1 text-xs text-slate-500">

                    Choose where you want your order delivered.

                  </p>

                </div>

              </div>

              {/* Loading Addresses */}

              {loadingAddresses && (

                <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">

                  <i className="fa-solid fa-spinner fa-spin text-blue-600" />

                  Loading saved addresses...

                </div>

              )}

              {/* Saved Addresses */}

              {!loadingAddresses &&

                savedAddresses.length > 0 && (

                  <div className="mt-5">

                    <div className="mb-3 flex items-center justify-between gap-3">

                      <h3 className="text-sm font-bold text-slate-800">

                        Saved Addresses

                      </h3>

                      <button

                        type="button"

                        onClick={

                          handleUseNewAddress

                        }

                        className="text-xs font-bold text-blue-600 transition hover:text-blue-700"

                      >

                        + Add New Address

                      </button>

                    </div>

                    <div className="space-y-3">

                      {savedAddresses.map(

                        (address) => {

                          const isSelected =

                            Number(

                              selectedAddressId

                            ) ===

                            Number(

                              address.id

                            );

                          return (

                            <button

                              key={

                                address.id

                              }

                              type="button"

                              onClick={() =>

                                handleSelectAddress(

                                  address

                                )

                              }

                              className={`w-full rounded-xl border-2 p-4 text-left transition ${

                                isSelected

                                  ? "border-blue-600 bg-blue-50"

                                  : "border-slate-200 bg-white hover:border-slate-300"

                              }`}

                            >

                              <div className="flex items-start gap-3">

                                <div

                                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${

                                    isSelected

                                      ? "border-blue-600 bg-blue-600 text-white"

                                      : "border-slate-300 bg-white"

                                  }`}

                                >

                                  {isSelected && (

                                    <i className="fa-solid fa-check text-[10px]" />

                                  )}

                                </div>

                                <div className="min-w-0 flex-1">

                                  <div className="flex flex-wrap items-center gap-2">

                                    <p className="text-sm font-bold text-slate-900">

                                      {

                                        address.name

                                      }

                                    </p>

                                    {Number(

                                      address.is_default

                                    ) ===

                                      1 && (

                                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">

                                        Default

                                      </span>

                                    )}

                                  </div>

                                  <p className="mt-1 text-xs text-slate-600">

                                    {

                                      address.mobile

                                    }

                                  </p>

                                  <p className="mt-2 text-xs leading-5 text-slate-600">

                                    {

                                      address.address_line

                                    }

                                    <br />

                                    {

                                      address.city

                                    }

                                    ,{" "}

                                    {

                                      address.state

                                    }{" "}

                                    -{" "}

                                    {

                                      address.pincode

                                    }

                                  </p>

                                </div>

                              </div>

                            </button>

                          );

                        }

                      )}

                    </div>

                  </div>

                )}

              {/* New Address Form */}

              {showNewAddressForm && (

                <>

                  {savedAddresses.length > 0 && (

                    <div className="mt-6 border-t border-slate-200 pt-5">

                      <div className="flex items-center justify-between gap-3">

                        <div>

                          <h3 className="text-sm font-bold text-slate-800">

                            New Delivery Address

                          </h3>

                          <p className="mt-1 text-xs text-slate-500">

                            This address will be saved for your future orders.

                          </p>

                        </div>

                        <button

                          type="button"

                          onClick={() => {

                            const defaultAddress =

                              savedAddresses.find(

                                (item) =>

                                  Number(

                                    item.is_default

                                  ) === 1

                              ) ||

                              savedAddresses[0];

                            if (

                              defaultAddress

                            ) {

                              handleSelectAddress(

                                defaultAddress

                              );

                            }

                          }}

                          className="text-xs font-semibold text-slate-500 hover:text-slate-700"

                        >

                          Cancel

                        </button>

                      </div>

                    </div>

                  )}

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">

                    {/* Name */}

                    <div>

                      <label

                        htmlFor="checkout-name"

                        className="mb-2 block text-sm font-semibold text-slate-700"

                      >

                        Full Name

                      </label>

                      <input

                        id="checkout-name"

                        type="text"

                        name="name"

                        value={

                          formData.name

                        }

                        onChange={

                          handleChange

                        }

                        maxLength={100}

                        autoComplete="name"

                        required

                        placeholder="Enter your full name"

                        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                      />

                    </div>

                    {/* Mobile */}

                    <div>

                      <label

                        htmlFor="checkout-mobile"

                        className="mb-2 block text-sm font-semibold text-slate-700"

                      >

                        Mobile Number

                      </label>

                      <input

                        id="checkout-mobile"

                        type="tel"

                        name="mobile"

                        value={

                          formData.mobile

                        }

                        onChange={

                          handleChange

                        }

                        inputMode="numeric"

                        maxLength={10}

                        pattern="[0-9]{10}"

                        autoComplete="tel"

                        required

                        placeholder="10-digit mobile number"

                        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                      />

                    </div>

                    {/* Email */}

                    <div className="sm:col-span-2">

                      <label

                        htmlFor="checkout-email"

                        className="mb-2 block text-sm font-semibold text-slate-700"

                      >

                        Email

                        <span className="ml-1 font-normal text-slate-400">

                          (Optional)

                        </span>

                      </label>

                      <input

                        id="checkout-email"

                        type="email"

                        name="email"

                        value={

                          formData.email

                        }

                        onChange={

                          handleChange

                        }

                        maxLength={150}

                        autoComplete="email"

                        placeholder="Enter your email address"

                        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                      />

                    </div>

                    {/* Address */}

                    <div className="sm:col-span-2">

                      <label

                        htmlFor="checkout-address"

                        className="mb-2 block text-sm font-semibold text-slate-700"

                      >

                        Full Address

                      </label>

                      <textarea

                        id="checkout-address"

                        name="address"

                        value={

                          formData.address

                        }

                        onChange={

                          handleChange

                        }

                        maxLength={5000}

                        autoComplete="street-address"

                        required

                        rows={4}

                        placeholder="House no., street, landmark, village/locality..."

                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                      />

                    </div>

                    {/* City */}

                    <div>

                      <label

                        htmlFor="checkout-city"

                        className="mb-2 block text-sm font-semibold text-slate-700"

                      >

                        City

                      </label>

                      <input

                        id="checkout-city"

                        type="text"

                        name="city"

                        value={

                          formData.city

                        }

                        onChange={

                          handleChange

                        }

                        maxLength={100}

                        autoComplete="address-level2"

                        required

                        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                      />

                    </div>

                    {/* State */}

                    <div>

                      <label

                        htmlFor="checkout-state"

                        className="mb-2 block text-sm font-semibold text-slate-700"

                      >

                        State

                      </label>

                      <input

                        id="checkout-state"

                        type="text"

                        name="state"

                        value={

                          formData.state

                        }

                        onChange={

                          handleChange

                        }

                        maxLength={100}

                        autoComplete="address-level1"

                        required

                        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                      />

                    </div>

                    {/* Pincode */}

                    <div>

                      <label

                        htmlFor="checkout-pincode"

                        className="mb-2 block text-sm font-semibold text-slate-700"

                      >

                        PIN Code

                      </label>

                      <input

                        id="checkout-pincode"

                        type="text"

                        name="pincode"

                        value={

                          formData.pincode

                        }

                        onChange={

                          handleChange

                        }

                        inputMode="numeric"

                        maxLength={6}

                        pattern="[0-9]{6}"

                        autoComplete="postal-code"

                        required

                        placeholder="6-digit PIN"

                        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                      />

                    </div>

                  </div>

                </>

              )}

              {/* Logged-in user with saved address */}

              {!loadingAddresses &&

                savedAddresses.length > 0 &&

                !showNewAddressForm &&

                selectedAddressId && (

                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">

                    <i className="fa-solid fa-circle-check" />

                    <span>

                      This saved address will be used for your order.

                    </span>

                  </div>

                )}

            </div>

            {/* Payment */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <h2 className="text-lg font-bold text-slate-900">

                Payment Method

              </h2>

              {/* COD */}

              <label

                className={`mt-5 flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition ${

                  paymentMethod === "cod"

                    ? "border-blue-600 bg-blue-50"

                    : "border-slate-200 bg-white"

                }`}

              >

                <input

                  type="radio"

                  name="payment"

                  value="cod"

                  checked={

                    paymentMethod ===

                    "cod"

                  }

                  onChange={(e) =>

                    setPaymentMethod(

                      e.target.value

                    )

                  }

                  className="h-4 w-4 accent-blue-600"

                />

                <div>

                  <p className="text-sm font-bold text-slate-900">

                    Cash on Delivery

                  </p>

                  <p className="mt-1 text-xs text-slate-500">

                    Pay when your order is delivered.

                  </p>

                </div>

              </label>

              {/* Online Payment */}

              <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-60">

                <i className="fa-solid fa-credit-card text-slate-400" />

                <div>

                  <p className="text-sm font-bold text-slate-700">

                    Online Payment

                  </p>

                  <p className="mt-1 text-xs text-slate-500">

                    Coming soon

                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* RIGHT */}

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-28">

            <h2 className="text-lg font-bold text-slate-900">

              Order Summary

            </h2>

            {/* Products */}

            <div className="mt-5 space-y-4">

              {checkoutItems.map((item) => {

                const quantity =

                  toNumber(

                    item.quantity,

                    1

                  );

                const price =

                  toNumber(

                    item.price

                  );

                const image =

                  getImageUrl(

                    item.image

                  );

                return (

                  <div

                    key={item.id}

                    className="flex gap-3"

                  >

                    {/* Image */}

                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">

                      {image ? (

                        <img

                          src={image}

                          alt={

                            item.name ||

                            "Product"

                          }

                          className="h-full w-full object-cover"

                          onError={(e) => {

                            e.currentTarget.style.display =

                              "none";

                          }}

                        />

                      ) : (

                        <div className="flex h-full w-full items-center justify-center text-slate-300">

                          <i className="fa-solid fa-image" />

                        </div>

                      )}

                    </div>

                    {/* Details */}

                    <div className="min-w-0 flex-1">

                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-800">

                        {item.name}

                      </h3>

                      <p className="mt-1 text-xs text-slate-500">

                        Qty: {quantity}

                      </p>

                    </div>

                    {/* Price */}

                    <span className="whitespace-nowrap text-sm font-bold text-slate-900">

                      ₹

                      {(

                        price *

                        quantity

                      ).toFixed(2)}

                    </span>

                  </div>

                );

              })}

            </div>

            <div className="my-5 border-t border-slate-200" />

            {/* Amount */}

            <div className="space-y-3 text-sm">

              <div className="flex justify-between text-slate-600">

                <span>

                  Subtotal

                </span>

                <span>

                  ₹

                  {checkoutSubtotal.toFixed(2)}

                </span>

              </div>

              <div className="flex justify-between text-slate-600">

                <span>

                  Delivery

                </span>

                <span>

                  {toNumber(

                    deliveryCharge

                  ) > 0

                    ? `₹${toNumber(

                        deliveryCharge

                      ).toFixed(2)}`

                    : "Free"}

                </span>

              </div>

              <div className="border-t border-slate-200 pt-3">

                <div className="flex justify-between">

                  <span className="text-base font-bold text-slate-900">

                    Total

                  </span>

                  <span className="text-xl font-extrabold text-slate-900">

                    ₹

                    {checkoutTotal.toFixed(2)}

                  </span>

                </div>

              </div>

            </div>

            {/* Place Order */}

            <button

              type="submit"

              disabled={loading}

              className={`mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition ${

                loading

                  ? "cursor-not-allowed bg-blue-400"

                  : "bg-blue-600 hover:bg-blue-700"

              }`}

            >

              {loading ? (

                <>

                  <i className="fa-solid fa-spinner fa-spin text-xs" />

                  Placing Order...

                </>

              ) : (

                <>

                  <i className="fa-solid fa-lock text-xs" />

                  Place Order

                </>

              )}

            </button>

            {/* Back */}

            <Link

              to="/cart"

              className={`mt-3 flex h-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 ${

                loading

                  ? "pointer-events-none opacity-50"

                  : ""

              }`}

            >

              Back to Cart

            </Link>

            {/* Delivery */}

            <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500">

              <i className="fa-solid fa-truck mt-0.5 text-blue-600" />

              <span>

                Currently delivering across Simri Bakhtiyarpur.

              </span>

            </div>

          </aside>

        </form>

      </section>

    </main>

  );

}

export default Checkout;