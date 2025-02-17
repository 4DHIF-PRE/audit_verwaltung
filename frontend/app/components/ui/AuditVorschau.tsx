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

    const addDaysToDate = (dateString, days) => {
        const date = new Date(dateString);
        date.setDate(date.getDate() + days);
        return date;
    };

  return (
      <div className="flex-1 ml-6 p-4 rounded-md">
          {selectedAuditDetails ? (
              <div>
                  <h2 className="text-2xl font-bold mb-8 underline">
                      {selectedAuditDetails.au_theme}
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                      {/* Left Column */}
                      <div>
                          <h2 className="text-lg font-bold mb-8">
                              {"Dauer: "}
                              {selectedAuditDetails.au_number_of_days}{" "}
                              {selectedAuditDetails.au_number_of_days === 1 ? "Tag" : "Tage"}
                          </h2>
                          <p>
                              <strong>Startdatum:</strong>{" "}
                              {formatDate(selectedAuditDetails.au_audit_date)}
                          </p>
                          <p>
                              <strong>Enddatum:</strong>{" "}
                              {formatDate(addDaysToDate(selectedAuditDetails.au_audit_date, selectedAuditDetails.au_number_of_days) + "")}
                          </p>
                          <p>
                              <strong>Auditor:</strong>{" "}
                              {getAuditorName(selectedAuditDetails.au_leadauditor_idx)}
                          </p>

                      </div>

                      {/* Right Column */}
                      <div>
                          <h2 className="text-lg font-bold mb-8">
                              <strong>Status:</strong>{" "}
                              {selectedAuditDetails.au_auditstatus.charAt(0).toUpperCase() + selectedAuditDetails.au_auditstatus.slice(1)}
                          </h2>
                          <p>
                              <strong>Ort:</strong> {selectedAuditDetails.au_place}
                          </p>
                          <p>
                              <strong>Thema:</strong> {selectedAuditDetails.au_theme}
                          </p>
                          <p className="mb-8">
                              <strong>Typ:</strong> {selectedAuditDetails.au_typ.charAt(0).toUpperCase() + selectedAuditDetails.au_typ.slice(1)}
                          </p>
                      </div>
                  </div>
              </div>
          ) : (
              <span className="text-xl text-gray-500 dark:text-white">
          Audit auswählen oder erstellen.
        </span>
          )}
    </div>
  );
}