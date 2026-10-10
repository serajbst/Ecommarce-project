import { useEffect, useState } from "react";

const BANNERS_API =
  "http://localhost/ashrafbazar/backend/api/banners/index.php";

const BACKEND_BASE =
  "http://localhost/ashrafbazar/backend";

function getImageUrl(image) {
  if (!image) return "";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  if (image.startsWith("/")) {
    return `${BACKEND_BASE}${image}`;
  }

  return `${BACKEND_BASE}/uploads/banners/${image}`;
}

function HeroSlider() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Fetch Banners
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let isMounted = true;

    const fetchBanners = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(BANNERS_API);

        if (!response.ok) {
          throw new Error("Unable to fetch banners.");
        }

        const json = await response.json();

        if (
          !json ||
          json.success === false ||
          !Array.isArray(json.data?.banners)
        ) {
          throw new Error("Invalid banner response.");
        }

        if (isMounted) {
          setBanners(json.data.banners);
          setCurrent(0);
        }
      } catch (err) {
        console.error("HeroSlider Error:", err);

        if (isMounted) {
          setError(true);
          setBanners([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBanners();

    return () => {
      isMounted = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Auto Slide
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (banners.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [banners.length]);

  /*
  |--------------------------------------------------------------------------
  | Previous Slide
  |--------------------------------------------------------------------------
  */

  const previousSlide = () => {
    if (banners.length === 0) return;

    setCurrent((prev) =>
      prev === 0
        ? banners.length - 1
        : prev - 1
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Next Slide
  |--------------------------------------------------------------------------
  */

  const nextSlide = () => {
    if (banners.length === 0) return;

    setCurrent(
      (prev) => (prev + 1) % banners.length
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <section className="w-full">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-slate-100 sm:rounded-3xl">
          <div className="flex h-[220px] w-full items-center justify-center sm:h-[330px] lg:h-[430px]">
            <i className="fa-solid fa-spinner fa-spin text-2xl text-slate-400" />
          </div>
        </div>
      </section>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | No Banners
  |--------------------------------------------------------------------------
  */

  if (error || banners.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-slate-100 sm:rounded-3xl">

        {/* Slides */}
        <div
          className="flex w-full transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${current * 100}%)`,
          }}
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="relative min-w-full"
            >
              {/* Banner Image */}
              <div className="flex h-[220px] w-full items-center justify-center overflow-hidden bg-slate-100 sm:h-[330px] lg:h-[430px]">
                <img
                  src={getImageUrl(
                    banner.image_url || banner.image
                  )}
                  alt={`AshrafBazar Banner ${banner.id}`}
                  className="block h-full w-full object-contain"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Previous */}
        {banners.length > 1 && (
          <button
            type="button"
            onClick={previousSlide}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white sm:flex"
          >
            <i className="fa-solid fa-chevron-left text-sm" />
          </button>
        )}

        {/* Next */}
        {banners.length > 1 && (
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white sm:flex"
          >
            <i className="fa-solid fa-chevron-right text-sm" />
          </button>
        )}

        {/* Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Go to banner ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  current === index
                    ? "w-7 bg-white"
                    : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}

export default HeroSlider;