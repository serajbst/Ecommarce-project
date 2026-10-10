import { useState } from "react";

function Settings() {
  const [activeTab, setActiveTab] = useState("general");

  const [settings, setSettings] = useState({
    shopName: "AshrafBazar",
    tagline: "Aapki Local Online Dukaan",
    phone: "8011789772",
    whatsapp: "8011789772",
    email: "support@ashrafbazar.shop",
    address: "Simri Bakhtiyarpur, Saharsa, Bihar",
    pinCode: "852127",

    deliveryEnabled: true,
    codEnabled: true,
    onlinePaymentEnabled: false,
    freeDeliveryEnabled: false,
    freeDeliveryMinimum: "999",
    defaultDeliveryCharge: "40",
    minimumOrderAmount: "199",

    openingTime: "09:00",
    closingTime: "20:00",
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: false,
  });

  const [saving, setSaving] = useState(false);

  const updateSetting = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    setSaving(true);

    setTimeout(() => {
      setSaving(false);
      alert("Settings saved successfully.");
    }, 600);
  };

  const tabs = [
    {
      id: "general",
      label: "General",
      icon: "fa-store",
    },
    {
      id: "delivery",
      label: "Delivery",
      icon: "fa-truck",
    },
    {
      id: "payments",
      label: "Payments",
      icon: "fa-credit-card",
    },
    {
      id: "hours",
      label: "Business Hours",
      icon: "fa-clock",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-extrabold text-slate-900">
          Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your AshrafBazar store settings.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">

        {/* Sidebar */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">

          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <i className={`fa-solid ${tab.icon} w-5 text-center`}></i>
              {tab.label}
            </button>
          ))}

        </div>

        {/* Content */}
        <form onSubmit={handleSave}>

          {/* General */}
          {activeTab === "general" && (
            <div className="space-y-6">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="mb-5">
                  <h2 className="font-heading font-extrabold text-slate-900">
                    Store Information
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Basic information displayed to customers.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Store Name
                    </label>

                    <input
                      type="text"
                      value={settings.shopName}
                      onChange={(e) =>
                        updateSetting("shopName", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Tagline
                    </label>

                    <input
                      type="text"
                      value={settings.tagline}
                      onChange={(e) =>
                        updateSetting("tagline", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone Number
                    </label>

                    <input
                      type="tel"
                      value={settings.phone}
                      onChange={(e) =>
                        updateSetting("phone", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      WhatsApp Number
                    </label>

                    <input
                      type="tel"
                      value={settings.whatsapp}
                      onChange={(e) =>
                        updateSetting("whatsapp", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) =>
                        updateSetting("email", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Store Address
                    </label>

                    <textarea
                      rows="3"
                      value={settings.address}
                      onChange={(e) =>
                        updateSetting("address", e.target.value)
                      }
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      PIN Code
                    </label>

                    <input
                      type="text"
                      value={settings.pinCode}
                      onChange={(e) =>
                        updateSetting("pinCode", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* Delivery */}
          {activeTab === "delivery" && (
            <div className="space-y-6">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="mb-5">
                  <h2 className="font-heading font-extrabold text-slate-900">
                    Delivery Settings
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Configure local delivery rules.
                  </p>
                </div>

                <div className="space-y-4">

                  <Toggle
                    label="Enable Local Delivery"
                    description="Allow customers to receive products at their address."
                    checked={settings.deliveryEnabled}
                    onChange={(value) =>
                      updateSetting("deliveryEnabled", value)
                    }
                  />

                  <Toggle
                    label="Free Delivery"
                    description="Enable free delivery above a minimum order value."
                    checked={settings.freeDeliveryEnabled}
                    onChange={(value) =>
                      updateSetting("freeDeliveryEnabled", value)
                    }
                  />

                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-3">

                  <Input
                    label="Default Delivery Charge"
                    value={settings.defaultDeliveryCharge}
                    prefix="₹"
                    onChange={(value) =>
                      updateSetting("defaultDeliveryCharge", value)
                    }
                  />

                  <Input
                    label="Minimum Order Amount"
                    value={settings.minimumOrderAmount}
                    prefix="₹"
                    onChange={(value) =>
                      updateSetting("minimumOrderAmount", value)
                    }
                  />

                  <Input
                    label="Free Delivery Above"
                    value={settings.freeDeliveryMinimum}
                    prefix="₹"
                    onChange={(value) =>
                      updateSetting("freeDeliveryMinimum", value)
                    }
                  />

                </div>

              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

                <div className="flex gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
                    <i className="fa-solid fa-location-dot"></i>
                  </div>

                  <div>
                    <h3 className="font-bold text-blue-900">
                      Delivery Areas
                    </h3>

                    <p className="mt-1 text-sm text-blue-700">
                      Individual delivery charges and PIN codes can be
                      configured from Delivery Areas.
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* Payments */}
          {activeTab === "payments" && (
            <div className="space-y-6">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="mb-5">
                  <h2 className="font-heading font-extrabold text-slate-900">
                    Payment Methods
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Choose which payment methods customers can use.
                  </p>
                </div>

                <div className="space-y-4">

                  <Toggle
                    label="Cash on Delivery"
                    description="Allow customers to pay when their order is delivered."
                    checked={settings.codEnabled}
                    onChange={(value) =>
                      updateSetting("codEnabled", value)
                    }
                  />

                  <Toggle
                    label="Online Payment"
                    description="Accept online payments through a payment gateway."
                    checked={settings.onlinePaymentEnabled}
                    onChange={(value) =>
                      updateSetting(
                        "onlinePaymentEnabled",
                        value
                      )
                    }
                  />

                </div>

              </div>

              {!settings.onlinePaymentEnabled && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

                  <div className="flex gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600">
                      <i className="fa-solid fa-circle-info"></i>
                    </div>

                    <div>
                      <h3 className="font-bold text-amber-900">
                        Online payment is disabled
                      </h3>

                      <p className="mt-1 text-sm text-amber-700">
                        Payment gateway integration can be configured
                        when Razorpay, PhonePe or another gateway is
                        connected.
                      </p>
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* Hours */}
          {activeTab === "hours" && (
            <div className="space-y-6">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="mb-5">
                  <h2 className="font-heading font-extrabold text-slate-900">
                    Business Hours
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Set the hours when your local store is available.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Opening Time
                    </label>

                    <input
                      type="time"
                      value={settings.openingTime}
                      onChange={(e) =>
                        updateSetting(
                          "openingTime",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Closing Time
                    </label>

                    <input
                      type="time"
                      value={settings.closingTime}
                      onChange={(e) =>
                        updateSetting(
                          "closingTime",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                </div>

                <div className="mt-6 space-y-3">

                  {[
                    ["monday", "Monday"],
                    ["tuesday", "Tuesday"],
                    ["wednesday", "Wednesday"],
                    ["thursday", "Thursday"],
                    ["friday", "Friday"],
                    ["saturday", "Saturday"],
                    ["sunday", "Sunday"],
                  ].map(([key, label]) => (
                    <Toggle
                      key={key}
                      label={label}
                      description={
                        settings[key]
                          ? "Store is open"
                          : "Store is closed"
                      }
                      checked={settings[key]}
                      onChange={(value) =>
                        updateSetting(key, value)
                      }
                    />
                  ))}

                </div>

              </div>

            </div>
          )}

          {/* Save */}
          <div className="mt-6 flex justify-end">

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner mr-2 animate-spin"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk mr-2"></i>
                  Save Settings
                </>
              )}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

/* Toggle */
function Toggle({
  label,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">

      <div>
        <p className="text-sm font-bold text-slate-800">
          {label}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>

    </div>
  );
}

/* Input */
function Input({
  label,
  value,
  prefix,
  onChange,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            {prefix}
          </span>
        )}

        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl border border-slate-200 py-3 pr-4 text-sm outline-none focus:border-blue-500 ${
            prefix ? "pl-9" : "pl-4"
          }`}
        />
      </div>
    </div>
  );
}

export default Settings;