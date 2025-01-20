import { useState, useEffect } from "react";
import { Form } from "@remix-run/react";
import {LogOut, Moon, Sun} from "lucide-react";

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const currentTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        if (currentTheme) {
            setIsDarkMode(currentTheme === "dark");
        } else {
            setIsDarkMode(prefersDark);
        }

        document.documentElement.classList.toggle("dark", isDarkMode);
    }, [isDarkMode]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleTheme = () => {
        setIsDarkMode((prev) => {
            const newTheme = !prev;
            localStorage.setItem("theme", newTheme ? "dark" : "light");
            return newTheme;
        });
    };

    return (
        <nav className="bg-white fixed w-full border-gray-200 dark:bg-gray-900">
            <div className="mx-auto flex flex-wrap justify-between p-4">
                <a
                    href="/auditpage"
                    className="flex items-center space-x-3 rtl:space-x-reverse"
                >
                    <img
                        src="../assets/spg-logo.png"
                        className="h-8"
                        alt="Spg Logo"
                    />
                    <span className="text-black text-2xl font-semibold whitespace-nowrap dark:text-white">
                        PreAudit
                    </span>
                </a>
                <button
                    type="button"
                    className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                    aria-controls="navbar-default"
                    aria-expanded={isMenuOpen}
                    onClick={toggleMenu}
                >
                    <span className="sr-only">Open main menu</span>
                    <svg
                        className="w-5 h-5"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 17 14"
                    >
                        <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M1 1h15M1 7h15M1 13h15"
                        />
                    </svg>
                </button>
                <div
                    className={`w-full md:block md:w-auto ${isMenuOpen ? "block" : "hidden"}`}
                    id="navbar-default"
                >
                    <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
                        <li>
                            <button
                                onClick={toggleTheme}
                                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-800 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                            >
                                {isDarkMode ? <Moon /> : <Sun />}
                            </button>
                        </li>
                        <li>
                            <Form method="post" action="/logout">
                                <button
                                    type="submit"
                                    className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-red-800 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                                >
                                    <LogOut />
                                </button>
                            </Form>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}
