import { useState } from "react";

export default function Question() {
  const [selectedStatus, setSelectedStatus] = useState("");

  let bgColorClass = "bg-gray-100 dark:bg-gray-800";
  if (selectedStatus === "1") {
    bgColorClass = "bg-green-100 dark:bg-green-800";
  } else if (selectedStatus === "3") {
    bgColorClass = "bg-red-100 dark:bg-red-800";
  } else if (selectedStatus === "2") {
    bgColorClass = "bg-yellow-100 dark:bg-yellow-800";
  }

  return (
    <div className={`p-6 ${bgColorClass} rounded-lg shadow-md`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        Fragen Titel
      </h2>
      <form className="max-w-sm mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Status
        </label>
        <select
          id="status"
          onChange={(e) => setSelectedStatus(e.target.value)}
          value={selectedStatus}
          className="border rounded-lg p-2.5 text-gray-700 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="0" selected>Frage bewerten</option>
          <option value="1">Keine Findings</option>
          <option value="2">Nur dokumentiert</option>
          <option value="3">Kritisches Finding</option>
        </select>
      </form>

      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Audior Kommentar
        </label>
        <textarea id="message" className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Write your thoughts here..."></textarea>
      </div>
      {selectedStatus === "2" || selectedStatus === "3" ? (
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Finding Kommentar
        </label>
        <textarea id="message" className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Write your thoughts here..."></textarea>
      </div>
           ) : null}
    </div>
  );
}
