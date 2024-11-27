import React, { useState } from "react";
import { Link } from "@remix-run/react";
import { FaMoon, FaSun } from "react-icons/fa";

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <nav className="flex fixed w-full items-center justify-between px-6 py-3 bg-white text-gray-900 dark:bg-black dark:text-gray-100 shadow-md">
      <div className="flex items-center space-x-3">
        <img src="/spengergasselogo.png" alt="Logo" className="h-12 w-auto" />
        <h1 className="text-lg font-light">Fragen filtern</h1>
      </div>

      <div className="flex items-center space-x-5">
        <div className="flex space-x-8 text-base">
          <button
            onClick={toggleDarkMode}
            className="text-lg focus:outline-none"
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <Link
            to="/logout"
            className="hover:text-red-500 justify-end font-bold"
          >
            Logout
          </Link>
        </div>
      </div>
    </nav>
  );
}

