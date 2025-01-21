import { useEffect, useState } from "react";
import { AuditDetails } from "~/types/AuditDetails";
import { UserDetails } from "~/types/UserDetails";
import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

interface Props {
  audit: number;
  allAudits: AuditDetails[];
}


export default function AuditVorschau({ audit, allAudits }: Props) {
 const [users, setUsers] = useState<UserDetails[]>([]);
  const [selectedAuditDetails, setSelectedAuditDetails] = useState<AuditDetails | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3000/getalluser', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const userData: UserDetails[] = await response.json();
        setUsers(userData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
  
    if (audit === 0) {
      setSelectedAuditDetails(null);
    } else {
      const foundAudit = allAudits.find((a) => a.au_idx === audit);
      setSelectedAuditDetails(foundAudit || null);
    }
  }, [audit, allAudits]);

  const getAuditorName = (auditorId: number | null) => {
    if (!auditorId) return "Unbekannt";
    const user = users.find((u) => u.u_userId === auditorId.toString());
    return user ? `${user.u_firstname} ${user.u_lastname}` : "Unbekannt";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
    //return date.toLocaleDateString();
  };

  return (
    <div className="flex-1 ml-6 p-4 rounded-md left">
      {selectedAuditDetails ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {selectedAuditDetails.au_theme}
          </h2>
          <p>
            <strong>Datum:</strong>{" "}
            {formatDate(selectedAuditDetails.au_audit_date)}
          </p>
          <p>
            <strong>Auditor:</strong>{" "}
              {getAuditorName(selectedAuditDetails.au_leadauditor_idx)}
          </p>
          <p>
            <strong>Status:</strong> {selectedAuditDetails.au_auditstatus.charAt(0).toUpperCase() + selectedAuditDetails.au_auditstatus.slice(1)}
          </p>
          <p>
            <strong>Ort:</strong> {selectedAuditDetails.au_place}
          </p>
          <p>
            <strong>Thema:</strong> {selectedAuditDetails.au_theme}
          </p>
          <p>
            <strong>Typ:</strong> {selectedAuditDetails.au_typ.charAt(0).toUpperCase() + selectedAuditDetails.au_typ.slice(1)}
          </p>
        </div>
      ) : (
        <span className="text-xl text-gray-500 dark:text-white">
          Audit auswählen oder erstellen.
        </span>
      )}
    </div>
  );
}