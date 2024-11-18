export default function Question() {
  const color = "gray"; // "gray", "green", "red", "yellow"

  let bgColorClass = "bg-gray-100 dark:bg-gray-800";
  if (color === "green") {
    bgColorClass = "bg-green-100 dark:bg-green-800";
  } else if (color === "red") {
    bgColorClass = "bg-red-100 dark:bg-red-800";
  } else if (color === "yellow") {
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
          className="border rounded-lg p-2.5 text-gray-700 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option selected>Frage bewerten</option>
          <option value="todo">Keine Findings</option>
          <option value="todo">Nur dokumentiert</option>
          <option value="todo">Kritisches Finding</option>
        </select>
      </form>

      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Audior Comment
        </label>
        <textarea id="message" className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Write your thoughts here..."></textarea>
      </div>

      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Finding Comment //if fehlt
        </label>
        <textarea id="message" className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Write your thoughts here..."></textarea>
      </div>
    </div>
  );
}
