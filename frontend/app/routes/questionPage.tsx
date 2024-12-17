import { useParams } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";

interface Law {
  la_idx: number;
  la_law: string;
  la_description: string;
}

export default function AuditPage() {
  const { id } = useParams();
  const [searchText, setSearchText] = useState("");
  const [selectedLaw, setSelectedLaw] = useState<string | null>(null);
  const [laws, setLaws] = useState<Law[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState({
    audited: "",
    applicable: "",
    finding: "",
    auditId: "",
  });

  useEffect(() => {
    const fetchLaws = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/laws"); 
        if (!response.ok) {
          throw new Error("Failed to fetch laws");
        }
        const data = await response.json();
        setLaws(data); 
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message); 
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLaws();
  }, []);

  const filteredLaws = laws.filter((law) =>
    (law.la_law + " " + law.la_description)
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  const handleFieldChange = (field: string, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col w-full h-screen p-4 bg-white space-y-6 dark:bg-gray-900 dark:text-white">
      {/* Render the Navbar */}
      <Navbar />

      {/* Header */}
      <div className="text-center font-bold text-2xl">
        Question Page {id}
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

      {/* Fehler oder Ladeanzeige */}
      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}

      {/* Gesetze anzeigen */}
      {!loading && !error && (
        <div className="border border-gray-400 rounded-md w-full max-h-64 overflow-y-auto dark:border-gray-600">
          {filteredLaws.map((law) => (
            <div
              key={law.la_idx}
              className="flex items-center justify-between border-b border-gray-300 p-2 dark:border-gray-600"
            >
              {/* Anzeige von Gesetz und Beschreibung */}
              <div className="font-bold text-gray-700 dark:text-white">
                {law.la_law} {law.la_description}
              </div>

              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedLaw === law.la_idx.toString()}
                onChange={() => setSelectedLaw(law.la_idx.toString())}
                className="w-5 h-5"
              />
            </div>
          ))}
        </div>
      )}

      {/* Textfelder */}
      <div className="flex justify-center space-x-6">
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1 dark:text-gray-300">Audited</label>
          <input
            type="text"
            value={fields.audited}
            onChange={(e) => handleFieldChange("audited", e.target.value)}
            className="p-2 border border-gray-400 rounded-md w-48 dark:bg-gray-700 dark:text-white"
            placeholder="Enter Audited"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1 dark:text-gray-300">Applicable</label>
          <input
            type="text"
            value={fields.applicable}
            onChange={(e) => handleFieldChange("applicable", e.target.value)}
            className="p-2 border border-gray-400 rounded-md w-48 dark:bg-gray-700 dark:text-white"
            placeholder="Enter Applicable"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1 dark:text-gray-300">Finding Level</label>
          <input
            type="text"
            value={fields.finding}
            onChange={(e) => handleFieldChange("finding", e.target.value)}
            className="p-2 border border-gray-400 rounded-md w-48 dark:bg-gray-700 dark:text-white"
            placeholder="Enter Finding Level"
          />
        </div>
      </div>

      {/* Audit ID */}
      <div className="flex justify-center">
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1 dark:text-gray-300">Audit ID</label>
          <input
            type="text"
            value={fields.auditId}
            onChange={(e) => handleFieldChange("auditId", e.target.value)}
            className="p-2 border border-gray-400 rounded-md w-48 dark:bg-gray-700 dark:text-white"
            placeholder="Enter Audit ID"
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
              `Saved Data: \nSelected Law: ${selectedLaw}\nAudited: ${fields.audited}\nApplicable: ${fields.applicable}\nFinding: ${fields.finding}\nAudit ID: ${fields.auditId}`
            )
          }
        >
          Save button
        </button>
      </div>
    </div>
  );
}