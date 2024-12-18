import { useParams,useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { AuditDetails } from "~/types/AuditDetails";

export default function AuditBearbeiten() {
  const { id } = useParams(); // Die Audit-ID aus der URL
  const navigate = useNavigate();
  const [audit, setAudit] = useState<AuditDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    au_audit_date: "",
    au_number_of_days: 0,
    au_place: "",
    au_theme: "",
    au_typ: "",
    au_auditstatus: "",
  });

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const response = await fetch(`http://localhost:3000/audit/${id}`);
        if (!response.ok) throw new Error("Failed to fetch audit data");
        const data: AuditDetails = await response.json();
        setAudit(data);
        setFormData({
          au_audit_date: data.au_audit_date,
          au_number_of_days: data.au_number_of_days,
          au_place: data.au_place,
          au_theme: data.au_theme,
          au_typ: data.au_typ,
          au_auditstatus: data.au_auditstatus,
        });
      } catch (error: any) {
        setError(error.message);
      } 
    };

    fetchAudit();
  }, [id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:3000/audit/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to save audit");

      alert("Audit erfolgreich gespeichert!");
      navigate("/auditpage"); // Zurück zur Hauptseite
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col w-full h-screen p-4 bg-white space-y-6 dark:bg-gray-900 dark:text-white">
      <Navbar />
      <h1 className="text-2xl font-bold text-center">Audit bearbeiten - ID {id}</h1>
      <h1><strong>{formData.au_theme}</strong></h1>

   {/* Formularfelder */}
<div className="space-y-4">
  {/* Datum und Anzahl Tage nebeneinander */}
  <div className="flex space-x-4">
    <div className="flex-1">
      <label className="block font-bold">Datum</label>
      <input
        type="date"
        value={formData.au_audit_date ? formData.au_audit_date.split("T")[0] : ""} // ISO-Datum sicherstellennChange={(e) => handleInputChange("au_audit_date", e.target.value)}
        className="w-full border p-2 rounded"
      />
    </div>
    <div className="flex-1">
      <label className="block font-bold">Anzahl Tage</label>
      <input
        type="number"
        value={formData.au_number_of_days}
        onChange={(e) => handleInputChange("au_number_of_days", e.target.value)}
        className="w-full border p-2 rounded"
      />
    </div>
  </div>

  {/* Ort, Thema, Typ und Status nebeneinander */}
  <div className="flex space-x-4">
    <div className="flex-1">
      <label className="block font-bold">Ort</label>
      <input
        type="text"
        value={formData.au_place}
        onChange={(e) => handleInputChange("au_place", e.target.value)}
        className="w-full border p-2 rounded"
      />
    </div>
    <div className="flex-1">
      <label className="block font-bold">Thema</label>
      <input
        type="text"
        value={formData.au_theme}
        onChange={(e) => handleInputChange("au_theme", e.target.value)}
        className="w-full border p-2 rounded"
      />
    </div>
    <div className="flex-1">
      <label className="block font-bold">Typ</label>
      <input
        type="text"
        value={formData.au_typ}
        onChange={(e) => handleInputChange("au_typ", e.target.value)}
        className="w-full border p-2 rounded"
      />
    </div>
    <div className="flex-1">
      <label className="block font-bold">Status</label>
      <input
        type="text"
        value={formData.au_auditstatus}
        onChange={(e) => handleInputChange("au_auditstatus", e.target.value)}
        className="w-full border p-2 rounded"
      />
    </div>
  </div>

  {/* Save Button */}
  <button
    onClick={handleSave}
    className="w-full py-2 bg-blue-500 text-white rounded-md font-bold"
  >
    Speichern
  </button>
</div>
</div>
  );
}
