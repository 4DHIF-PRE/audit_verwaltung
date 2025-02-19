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
    au_auditstatus: "",
    au_place: "",
    au_theme: "",
    au_typ: "",
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
          au_auditstatus: data.au_auditstatus,
          au_place: data.au_place,
          au_theme: data.au_theme,
          au_typ: data.au_typ,
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
    if (
      !formData.au_audit_date ||
      !formData.au_number_of_days ||
      !formData.au_place ||
      !formData.au_theme ||
      !formData.au_typ
    ) {
      setError("Fehler bei der Eingabe.");
      return;
    }
    
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

      navigate("/auditpage", { replace: true });
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col h-screen">
    <Navbar />
    <div className="flex flex-col w-full h-screen p-4 bg-white space-y-6 dark:bg-black mt-10">
      <h1 className="text-2xl font-bold text-center mt-4">
        Audit bearbeiten
      </h1>
      <h1 className="text-2xl">
        <strong>{formData.au_theme}</strong>
      </h1>

          <div className="space-y-6">
              {error && (
                        <div className="text-red-500 text-center font-bold">{error}</div>
              )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold">Datum</label>
                <input
                    type="date"
                    value={formData.au_audit_date ? formData.au_audit_date.split("T")[0] : ""}
                    onChange={(e) => handleInputChange("au_audit_date", e.target.value)}
                    className="w-full border p-2 rounded text-black"
                />
              </div>
              <div>
                <label className="block font-bold">Anzahl Tage</label>
                <input
                    type="number"
                    value={formData.au_number_of_days}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^[0-9]+$/.test(value)) {
                        handleInputChange("au_number_of_days", value);
                      }
                    }}
                    className="w-full border p-2 rounded text-black"
                />
              </div>
            </div>

            {/* Ort, Thema, Typ und Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold">Ort</label>
                <input
                    type="text"
                    value={formData.au_place}
                    onChange={(e) => handleInputChange("au_place", e.target.value)}
                    className="w-full border p-2 rounded text-black"
                />
              </div>
              <div>
                <label className="block font-bold">Thema</label>
                <input
                    type="text"
                    value={formData.au_theme}
                    onChange={(e) => handleInputChange("au_theme", e.target.value)}
                    className="w-full border p-2 rounded text-black"
                />
              </div>
              <div>
                <label className="block font-bold">Typ</label>
                <select
                    value={formData.au_typ}
                    onChange={(e) => handleInputChange("au_typ", e.target.value)}
                    className="w-full border p-2 rounded text-black"
                >
                  <option value="audit">Audit</option>
                  <option value="inspektion">Inspektion</option>
                  <option value="ca">Ca</option>
                  <option value="extern">Extern</option>
                  <option value="sonstig">Sonstig</option>
                </select>
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
      </div>
  );
}
