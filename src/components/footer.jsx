import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaPhoneAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold">
              <span className="text-orange-500">Ashraf</span>Chak
            </h2>

            <p className="text-gray-400 mt-3 text-sm leading-6">
              Your Local Store, Now Online.
              Quality products with convenient local delivery
              in Simri Bakhtiyarpur.
            </p>

            <div className="flex gap-3 mt-5">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 transition"
              >
                <FaFacebookF />
              </a>

              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 transition"
              >
                <FaInstagram />
              </a>

              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-green-500 transition"
              >
                <FaWhatsapp />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>

            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/" className="hover:text-orange-500">
                  Home
                </Link>
              </li>

              <li>
                <Link to="/shop" className="hover:text-orange-500">
                  Shop
                </Link>
              </li>

              <li>
                <Link to="/services" className="hover:text-orange-500">
                  Services
                </Link>
              </li>

              <li>
                <Link to="/contact" className="hover:text-orange-500">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Care</h3>

            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/orders" className="hover:text-orange-500">
                  My Orders
                </Link>
              </li>

              <li>
                <Link to="/cart" className="hover:text-orange-500">
                  Cart
                </Link>
              </li>

              <li>
                <Link to="/privacy-policy" className="hover:text-orange-500">
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link to="/terms" className="hover:text-orange-500">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>

            <div className="space-y-4 text-sm text-gray-400">

              <div className="flex gap-3">
                <FaMapMarkerAlt className="text-orange-500 mt-1" />
                <span>
                  Asharf Chak, SBPUR<br />
                  Saharsa, Bihar
                </span>
              </div>

              <div className="flex gap-3 items-center">
                <FaPhoneAlt className="text-orange-500" />
                <a
                  href="tel:+918114582614"
                  className="hover:text-orange-500"
                >
                  +91 8114582614
                </a>
              </div>

              <div className="flex gap-3 items-center">
                <FaWhatsapp className="text-green-500" />
                <a
                  href="https://wa.me/918114582614"
                  className="hover:text-green-500"
                >
                  WhatsApp Us
                </a>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-5 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} AshrafChak. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;