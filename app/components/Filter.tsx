import React from "react";

export default function AuditFilter() {
  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Angezeigte Audits filtern</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="law" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gesetz</label>
          <input
            type="text"
            id="law"
            placeholder="Gesetz eingeben"
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-gray-200"
          />
        </div>

        <div>
          <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kunde/Firma</label>
          <input
            type="text"
            id="client"
            placeholder="Firma eingeben"
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-gray-200"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Datum</label>
          <input
            type="date"
            id="date"
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-gray-200"
          />
        </div>

        <div>
          <label htmlFor="auditNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Auditnummer</label>
          <input
            type="text"
            id="auditNumber"
            placeholder="Nummer eingeben"
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-gray-200"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Suchen
        </button>
      </div>
    </div>
  );
}