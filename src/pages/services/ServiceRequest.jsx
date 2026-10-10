import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL =
  "http://localhost/ashrafbazar/backend/api/services/index.php";

async function parseApiResponse(response) {
  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Raw server response:", text);
    throw new Error(
      `Server returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message || `Request failed with status ${response.status}.`
    );
  }

  return data;
}

function ServiceRequest() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await parseApiResponse(response);

      setServices(Array.isArray(data?.data?.services) ? data.data.services : []);
    } catch (err) {
      console.error("Services fetch error:", err);
      setError(err.message || "Unable to load services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const getWhatsAppUrl = (number) => {
    const cleanNumber = String(number || "").replace(/\D/g, "");

    if (!cleanNumber) {
      return "#";
    }

    // Backend stores Indian 10-digit numbers.
    return `https://wa.me/91${cleanNumber}`;
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              aria-label="Back to home"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </Link>

            <div>
              <h1 className="font-heading text-xl font-extrabold text-slate-900 sm:text-2xl">
                Our Services
              </h1>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Contact us directly for electrical and home services
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Intro */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-5 text-white shadow-lg sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <i className="fa-solid fa-screwdriver-wrench text-xl"></i>
            </div>

            <div>
              <h2 className="font-heading text-lg font-extrabold sm:text-xl">
                Home & Electrical Services
              </h2>

              <p className="mt-1.5 text-xs leading-5 text-blue-100 sm:text-sm">
                Choose a service below and contact our service team directly
                through phone or WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <i className="fa-solid fa-spinner fa-spin text-xl"></i>
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Loading services...
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <i className="fa-solid fa-triangle-exclamation text-xl"></i>
            </div>

            <h2 className="mt-4 text-base font-extrabold text-slate-900">
              Unable to load services
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchServices}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              <i className="fa-solid fa-rotate-right"></i>
              Try Again
            </button>
          </div>
        )}

        {/* No Services */}
        {!loading && !error && services.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <i className="fa-solid fa-screwdriver-wrench text-2xl"></i>
            </div>

            <h2 className="mt-4 text-lg font-extrabold text-slate-900">
              No Services Available
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Our services will be available here soon.
            </p>
          </div>
        )}

        {/* Services */}
        {!loading && !error && services.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">
            {services.map((service) => {
              const phone = String(service.phone || "").trim();
              const whatsappUrl = getWhatsAppUrl(service.whatsapp);

              return (
                <article
                  key={service.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  {/* Image */}
                  <div className="relative h-36 overflow-hidden bg-slate-100 sm:h-44">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.name || "Service"}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <i className="fa-solid fa-screwdriver-wrench text-3xl"></i>
                      </div>
                    )}

                    <div className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[9px] font-bold text-emerald-600 shadow-sm sm:text-[10px]">
                      <i className="fa-solid fa-circle-check mr-1"></i>
                      Available
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4">
                    <h3 className="line-clamp-2 text-sm font-extrabold leading-5 text-slate-900 sm:text-base">
                      {service.name}
                    </h3>

                    <p className="mt-1.5 line-clamp-3 min-h-[48px] text-[11px] leading-4 text-slate-500 sm:text-xs sm:leading-5">
                      {service.description}
                    </p>

                    {/* Phone */}
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="mt-3 flex items-center gap-2 text-[11px] font-bold text-slate-700 transition hover:text-blue-600 sm:text-xs"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <i className="fa-solid fa-phone text-[10px]"></i>
                        </span>

                        <span className="truncate">{phone}</span>
                      </a>
                    )}

                    {/* Buttons */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {phone ? (
                        <a
                          href={`tel:${phone}`}
                          className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2 text-[10px] font-bold text-white transition hover:bg-blue-700 sm:h-10 sm:text-xs"
                        >
                          <i className="fa-solid fa-phone"></i>
                          Call
                        </a>
                      ) : (
                        <span className="flex h-9 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-400 sm:h-10 sm:text-xs">
                          No Phone
                        </span>
                      )}

                      {service.whatsapp ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-2 text-[10px] font-bold text-white transition hover:bg-emerald-600 sm:h-10 sm:text-xs"
                        >
                          <i className="fa-brands fa-whatsapp text-sm"></i>
                          WhatsApp
                        </a>
                      ) : (
                        <span className="flex h-9 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-400 sm:h-10 sm:text-xs">
                          No WhatsApp
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

       
      </div>
    </main>
  );
}

export default ServiceRequest;