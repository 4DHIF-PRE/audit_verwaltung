import { useState } from "react";

export default function AuditPage() {
  const [audits, setAudits] = useState<string[]>(Array(4).fill(""));
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col w-full h-screen p-4 bg-white space-y-6">

      {/* Search Section */}
      <div className="flex justify-center">
        <button className="px-6 py-2 text-white font-bold rounded-md" style={{ backgroundColor: "#9166cc" }}>
          Search
        </button>
      </div>

      {/* Table Section */}
      <div className="border border-gray-400 rounded-md w-full">
        {audits.map((_, index) => (
          <div key={index} className="flex items-center border-b border-gray-300">
            <input
              type="text"
              className="flex-1 p-2 border-r border-gray-300"
              placeholder={`Row ${index + 1}`}
            />
            <button
              className="w-10 h-10 m-2 border rounded-md"
              style={{ backgroundColor: "#fff", borderColor: "#ccc" }}
            ></button>
          </div>
        ))}
      </div>

      {/* Textfields */}
      <div className="flex justify-center space-x-6">
        <input
          type="text"
          placeholder="Textfield"
          className="p-2 border border-gray-400 rounded-md w-1/4"
        />
        <input
          type="text"
          placeholder="Textfield"
          className="p-2 border border-gray-400 rounded-md w-1/4"
        />
        <input
          type="text"
          placeholder="Textfield"
          className="p-2 border border-gray-400 rounded-md w-1/4"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <button
          className="px-6 py-2 text-white font-bold rounded-md"
          style={{ backgroundColor: "#9166cc" }}
        >
          Save button
        </button>
      </div>
    </div>
  );
}