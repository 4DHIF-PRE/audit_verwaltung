import { useParams } from "@remix-run/react";
import { useState } from "react";

export default function AuditPage() {
  const { id } = useParams(); 

  const allLaws = ["Law 12", 
    "Law 122", 
    "Law 33", 
    "Law 343",
    "Law 53", 
    "Law 364", 
    "Law 473", 
    "Law 483", 
    "Law 493", 
    "Law 1210"];

  const [searchText, setSearchText] = useState(""); 
  const [selectedLaw, setSelectedLaw] = useState<string | null>(null); 
  const [fields, setFields] = useState({
    audited: "",
    applicable: "",
    finding: "",
    auditId: "", 
  });

  const filteredLaws = allLaws.filter((law) =>
    law.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleFieldChange = (field: string, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col w-full h-screen p-4 bg-white space-y-6">
      {/* Header */}
      <div className="text-center font-bold text-2xl">
        Audit Page - ID: {id}
      </div>

      {/* Search Section */}
      <div className="flex justify-center">
        <input
          type="text"
          placeholder="Search Laws..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="p-2 border border-gray-400 rounded-md w-1/2"
        />
      </div>

      {/* Table Section */}
      <div className="border border-gray-400 rounded-md w-full max-h-64 overflow-y-auto">
  {filteredLaws.map((law, index) => (
    <div
      key={index}
      className="flex items-center justify-between border-b border-gray-300 p-2"
    >
      {/* Anzeige der "Law" */}
      <div className="font-bold text-gray-700">{law}</div>

      {/* Checkbox für jede Law */}
      <input
        type="checkbox"
        checked={selectedLaw === law}
        onChange={() => setSelectedLaw(law)}
        className="w-5 h-5"
      />
    </div>
  ))}
</div>

      {/* Textfields mit Überschriften */}
      <div className="flex justify-center space-x-6">
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">Audited</label>
          <input
            type="text"
            value={fields.audited}
            onChange={(e) => handleFieldChange("audited", e.target.value)}
            className="p-2 border border-gray-400 rounded-md w-48"
            placeholder="Enter Audited"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">Applicable</label>
          <input
            type="text"
            value={fields.applicable}
            onChange={(e) => handleFieldChange("applicable", e.target.value)}
            className="p-2 border border-gray-400 rounded-md w-48"
            placeholder="Enter Applicable"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">Finding Level</label>
          <input
            type="text"
            value={fields.finding}
            onChange={(e) => handleFieldChange("finding", e.target.value)}
            className="p-2 border border-gray-400 rounded-md w-48"
            placeholder="Enter Finding Level"
          />
        </div>
      </div>

      {/* Audit ID Textfield */}
      <div className="flex justify-center">
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">Audit ID</label>
          <input
            type="text"
            value={fields.auditId}
            onChange={(e) => handleFieldChange("auditId", e.target.value)}
            className="p-2 border border-gray-400 rounded-md w-48"
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