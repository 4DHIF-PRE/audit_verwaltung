import { Building2, Mail, MapPin } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-gray-100 py-4 mt-auto dark:bg-gray-900">
            <div className="container mx-auto px-4">
                <div className="block md:hidden text-center text-2xl text-gray-600 dark:text-gray-300">
                    👁️🫦👁️
                </div>

                <div className="hidden md:flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        <span className="text-gray-600 dark:text-gray-300 font-semibold">
                            Auditverwaltung, 4DHIF GmbH, Copyright © 2025
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <MapPin className="w-5 h-5" />
                            <span>Spengergasse 20, 1050 Wien</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <Mail className="w-5 h-5" />
                            <a
                                href="mailto:vogl@spengergasse.at"
                                className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            >
                                vogl@spengergasse.at
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
