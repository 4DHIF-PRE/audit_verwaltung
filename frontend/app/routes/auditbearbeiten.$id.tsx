import { useParams, useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";

export default function AuditBearbeiten() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    au_idx: id,
    au_audit_date: "",
    au_number_of_days: 0,
    au_leadauditor_idx: "",
    au_leadauditee_idx: "",
    au_auditstatus: "",
    au_place: "",
    au_theme: "",
    au_type: "",
  });

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const response = await fetch(`http://localhost:3000/audit/${id}`);
        if (!response.ok) throw new Error("Failed to fetch audit data");
        const data = await response.json();
        setFormData({
          au_idx: id,
          au_audit_date: data.au_audit_date,
          au_number_of_days: data.au_number_of_days,
          au_leadauditor_idx: data.au_leadauditor_idx,
          au_leadauditee_idx: data.au_leadauditee_idx,
          au_auditstatus: data.au_auditstatus,
          au_place: data.au_place,
          au_theme: data.au_theme,
          au_type: data.au_type,
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
      const updatedFormData = {
        ...formData,
        au_audit_date: formData.au_audit_date.split("T")[0],
      };

      const response = await fetch(`http://localhost:3000/audit/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFormData),
      });

      if (!response.ok) throw new Error("Failed to save audit");

      // Fehlernachricht zurücksetzen
      setError(null);

      // Weiterleitung zur Audit-Seite
      navigate("/auditpage");
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col w-full h-screen p-4 bg-white space-y-6 dark:bg-gray-900">
      <Navbar />
      <h1 className="text-2xl font-bold text-center">Audit bearbeiten - ID {id}</h1>
      <h1>
        <strong>{formData.au_theme}</strong>
      </h1>

      {/* Fehlernachricht */}
      {error && (
        <div className="bg-red-500 text-white p-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* Formularfelder */}
      <div className="space-y-4">
        {/* Datum und Anzahl Tage */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block font-bold">Datum</label>
            <input
              type="date"
              value={formData.au_audit_date ? formData.au_audit_date.split("T")[0] : ""}
              onChange={(e) => handleInputChange("au_audit_date", e.target.value)}
              className="w-full border p-2 rounded text-black"
            />
          </div>
          <div className="flex-1">
            <label className="block font-bold">Anzahl Tage</label>
            <input
              type="number"
              value={formData.au_number_of_days}
              onChange={(e) => handleInputChange("au_number_of_days", e.target.value)}
              className="w-full border p-2 rounded text-black"
            />
          </div>
        </div>

        {/* Lead Auditor und Auditee */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block font-bold">Lead Auditor ID</label>
            <input
              type="text"
              value={formData.au_leadauditor_idx}
              onChange={(e) => handleInputChange("au_leadauditor_idx", e.target.value)}
              className="w-full border p-2 rounded text-black"
            />
          </div>
          <div className="flex-1">
            <label className="block font-bold">Lead Auditee ID</label>
            <input
              type="text"
              value={formData.au_leadauditee_idx}
              onChange={(e) => handleInputChange("au_leadauditee_idx", e.target.value)}
              className="w-full border p-2 rounded text-black"
            />
          </div>
        </div>

        {/* Ort, Thema, Typ und Status */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block font-bold">Ort</label>
            <input
              type="text"
              value={formData.au_place}
              onChange={(e) => handleInputChange("au_place", e.target.value)}
              className="w-full border p-2 rounded text-black"
            />
          </div>
          <div className="flex-1">
            <label className="block font-bold">Thema</label>
            <input
              type="text"
              value={formData.au_theme}
              onChange={(e) => handleInputChange("au_theme", e.target.value)}
              className="w-full border p-2 rounded text-black"
            />
          </div>
          <div className="flex-1">
            <label className="block font-bold">Typ</label>
            <input
              type="text"
              value={formData.au_type}
              onChange={(e) => handleInputChange("au_type", e.target.value)}
              className="w-full border p-2 rounded text-black"
            />
          </div>
          <div className="flex-1">
            <label className="block font-bold">Status</label>
            <input
              type="text"
              value={formData.au_auditstatus}
              onChange={(e) => handleInputChange("au_auditstatus", e.target.value)}
              className="w-full border p-2 rounded text-black"
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