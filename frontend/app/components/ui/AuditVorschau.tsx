import { useEffect, useState } from "react";
import { AuditDetails } from "~/types/AuditDetails";

interface Props {
  audit: number;
  allAudits: AuditDetails[];
}

export default function AuditVorschau({ audit, allAudits }: Props) {
  const [selectedAuditDetails, setSelectedAuditDetails] = useState<AuditDetails | null>(null);

  useEffect(() => {
    if (audit === 0) {
      setSelectedAuditDetails(null);
    } else {
      const foundAudit = allAudits.find((a) => a.au_idx === audit);
      setSelectedAuditDetails(foundAudit || null);
    }
  }, [audit, allAudits]);

  return (
    <div className="flex-1 ml-6 p-4 rounded-md center">
      {selectedAuditDetails ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {selectedAuditDetails.au_idx} - {selectedAuditDetails.au_theme}
          </h2>
          <p>
            <strong>ID:</strong> {selectedAuditDetails.au_idx}
          </p>
          <p>
            <strong>Datum:</strong> {new Date(selectedAuditDetails.au_audit_date).toLocaleDateString()}
          </p>
          <p>
            <strong>Leadauditee ID:</strong> {selectedAuditDetails.au_leadauditee_idx}
          </p>
          <p>
            <strong>Status:</strong> {selectedAuditDetails.au_auditstatus}
          </p>
          <p>
            <strong>Ort:</strong> {selectedAuditDetails.au_place}
          </p>
          <p>
            <strong>Thema:</strong> {selectedAuditDetails.au_theme}
          </p>
          <p>
            <strong>Typ:</strong> {selectedAuditDetails.au_typ}
          </p>
        </div>
      ) : (
        <span className="text-xl" style={{ color: "#666" }}>
          Select Audit
        </span>
      )}
    </div>
  );
}
