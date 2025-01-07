import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { useState } from "react";
import { Navbar } from "../components/Navbar";

interface Law {
  la_idx: number;
  la_law: string;
  la_typ: string;
  la_description: string;
  la_text: string;
  la_valid_from: string;
  la_valid_until: string;
}

// Loader-Funktion
export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params; // `id` aus URL-Parametern
  const response = await fetch("http://localhost:3000/law");
  if (!response.ok) {
    throw new Response("Failed to load laws", { status: 500 });
  }
  const laws: Law[] = await response.json();

  return json({ auditId: id, laws });
};

export default function AuditPage() {
  const { auditId, laws } = useLoaderData<{ auditId: string; laws: Law[] }>(); // Loader-Daten verwenden
  const [searchText, setSearchText] = useState("");
  const [selectedLaw, setSelectedLaw] = useState<string | null>(null);
  const [fields, setFields] = useState({
    audited: false,
    applicable: false,
  });

  const [selectedType, setSelectedType] = useState<string>("");

  const filteredLaws = laws.filter((law) => {
    const lawText = (law.la_text).toLowerCase();
    const searchTextLower = searchText.toLowerCase().trim();

    const matchesSearch = lawText.includes(searchTextLower);
    const matchesType = selectedType === "" || law.la_typ === selectedType;

    return matchesSearch && matchesType;
  });

  const handleFieldChange = (field: string, value: string | boolean) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col w-full h-screen p-4 bg-white space-y-6 dark:bg-gray-900 dark:text-white">
      {/* Render the Navbar */}
      <Navbar />

      {/* Header */}
      <div className="text-center font-bold text-2xl">
        Question Page {auditId}
      </div>

      {/* Search Section */}
      <div className="flex justify-center">
        <input
          type="text"
          placeholder="Search Laws..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="p-2 border border-gray-400 rounded-md w-1/2 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Filter by Law Type */}
      <div className="flex justify-center mt-4">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="p-2 border border-gray-400 rounded-md w-1/2 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Types</option>
          <option value="r">r</option>
          <option value="amc">amc</option>
          <option value="gm">gm</option>
        </select>
      </div>

      {/* Gesetze anzeigen */}
      <div className="border border-gray-400 rounded-md w-full max-h-64 overflow-y-auto dark:border-gray-600">
        {filteredLaws.map((law) => (
          <div
            key={law.la_idx}
            className="flex items-center justify-between border-b border-gray-300 p-2 dark:border-gray-600"
          >
            <div className="font-bold text-gray-700 dark:text-white">
              {law.la_text}
            </div>
            <input
              type="checkbox"
              checked={selectedLaw === law.la_idx.toString()}
              onChange={() => setSelectedLaw(law.la_idx.toString())}
              className="w-5 h-5"
            />
          </div>
        ))}
      </div>

      {/* Checkboxes für Audited und Applicable */}
      <div className="flex justify-center space-x-6">
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1 dark:text-gray-300">Audited</label>
          <input
            type="checkbox"
            checked={fields.audited}
            onChange={(e) => handleFieldChange("audited", e.target.checked)}
            className="w-5 h-5"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1 dark:text-gray-300">Applicable</label>
          <input
            type="checkbox"
            checked={fields.applicable}
            onChange={(e) => handleFieldChange("applicable", e.target.checked)}
            className="w-5 h-5"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <button
          className="px-6 py-2 text-white font-bold rounded-md"
          style={{ backgroundColor: "#9166cc" }}
          onClick={() =>
            alert(
              `Saved Data: \nSelected Law: ${selectedLaw}\nAudited: ${fields.audited}\nApplicable: ${fields.applicable}\nAudit ID: ${auditId}`
            )
          }
        >
          Save button
        </button>
      </div>
    </div>
  );
}
