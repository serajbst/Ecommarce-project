import React from "react";
import {
  FaArrowRight,
  FaBullseye,
  FaEye,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";




const About = () => {

  const [showFounder, setShowFounder] = useState(false);

  return (
    <main className="bg-white text-gray-900">

      {/* =====================================================
          SECTION 1 — ABOUT ASHRAFCHAK
      ====================================================== */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-2 sm:gap-8 lg:gap-16">

           {/* LEFT — IMAGE */}
<div className="col-span-2 flex justify-center sm:col-span-1 sm:justify-start">
  <div className="relative w-full">

    {/* Decorative layer */}
    <div className="absolute -right-2 -top-2 h-full w-full rounded-2xl bg-blue-100 sm:-right-4 sm:-top-4 sm:rounded-3xl" />

    {/* Image */}
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 shadow-xl sm:rounded-3xl">
      <img
        src="/images/about/about.jpg"
        alt="AshrafChak"
        className="h-full w-full object-cover"
      />
    </div>

  </div>
</div>


            {/* RIGHT — CONTENT */}
            <div className="min-w-0">

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 sm:text-sm">
                <FaMapMarkerAlt />
                About AshrafChak
              </div>

              <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl lg:text-5xl">
                Your Local Online
                <span className="block text-blue-600">
                   Shopping Platform.
                </span>
              </h1>

              <p className="mt-4 text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                AshrafChak is a local online shopping platform created
                to make everyday shopping simple, convenient and
                accessible for our community.
              </p>

              <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                We aim to bring useful products closer to local
                customers through a simple, modern and convenient
                online shopping experience.
              </p>

             

            </div>

          </div>


 {/* LEFT — CONTENT */}
            <div className="min-w-0">

  <button
    type="button"
    onClick={() => setShowFounder((prev) => !prev)}
    className="text-left text-xs font-bold uppercase tracking-wider text-blue-600 transition-colors hover:text-blue-700 sm:text-sm"
  >
    Meet The Founder
  </button>

  {showFounder && (
    <div className="mt-6 border-l-4 border-blue-600 pl-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
        Founder & Developer
      </p>

      <h3 className="mt-1 text-xl font-extrabold text-gray-900 sm:text-2xl">
        Mohammed Seraj
      </h3>
    </div>
  )}

</div>


        </div>
      </section>


     {/* =====================================================
    SECTION 3 — MISSION & VISION
====================================================== */}
<section className="bg-gray-50 py-12 sm:py-16 lg:py-20">
  <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8">

    <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:gap-10">

      {/* ================= MISSION ================= */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-7 lg:p-10">

        {/* Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600 sm:h-14 sm:w-14 sm:text-2xl lg:h-16 lg:w-16">
          <FaBullseye />
        </div>

        <span className="mt-5 block text-[9px] font-bold uppercase tracking-wider text-blue-600 sm:mt-6 sm:text-xs lg:text-sm">
          Our Mission
        </span>

        <h2 className="mt-2 text-base font-extrabold leading-tight sm:text-xl lg:text-3xl">
          Making everyday shopping easier.
        </h2>

        <p className="mt-2 text-[10px] leading-5 text-gray-600 sm:mt-3 sm:text-sm sm:leading-6 lg:text-base lg:leading-7">
          Our mission is to make everyday shopping simple,
          affordable and convenient for local customers by
          providing useful products and an easy online
          shopping experience.
        </p>

      </div>


      {/* ================= VISION ================= */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-7 lg:p-10">

        {/* Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600 sm:h-14 sm:w-14 sm:text-2xl lg:h-16 lg:w-16">
          <FaEye />
        </div>

        <span className="mt-5 block text-[9px] font-bold uppercase tracking-wider text-blue-600 sm:mt-6 sm:text-xs lg:text-sm">
          Our Vision
        </span>

        <h2 className="mt-2 text-base font-extrabold leading-tight sm:text-xl lg:text-3xl">
          A trusted digital marketplace.
        </h2>

        <p className="mt-2 text-[10px] leading-5 text-gray-600 sm:mt-3 sm:text-sm sm:leading-6 lg:text-base lg:leading-7">
          Our vision is to build a trusted local digital
          marketplace that connects customers with products
          and brings modern online shopping closer to local
          communities.
        </p>

      </div>

    </div>

  </div>
</section>

    </main>
  );
};

export default About;