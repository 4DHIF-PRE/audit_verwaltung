import { AuditDetails } from "~/types/AuditDetails";
import { UserDetails } from "~/types/UserDetails";

interface Props {
  audit: number;
  allAudits: AuditDetails[];
  allUsers: UserDetails[]; 
}

export default function AuditVorschau({ audit, allAudits, allUsers }: Props) {
  const selectedAuditDetails = allAudits.find((a) => a.au_idx === audit) || null;

  const getAuditorName = (auditorId: number | null) => {
    if (!auditorId) return "Unbekannt";
    const user = allUsers.find((u) => u.u_userId === auditorId.toString());
    return user ? `${user.u_firstname} ${user.u_lastname}` : "Unbekannt";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const addDaysToDate = (dateString, days) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date;
  };

  if (!selectedAuditDetails) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span className="text-xl text-gray-500 dark:text-gray-400 font-medium">
          Audit auswählen oder erstellen
        </span>
        <p className="text-gray-400 dark:text-gray-500 mt-2">
          Wählen Sie ein bestehendes Audit aus oder erstellen Sie ein neues
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-t-lg">
      <div className="p-6">
        <div className="dark:bg-gray-800">
          <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg mb-6">
            {/* Zeitraum */}
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Zeitraum</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {formatDate(selectedAuditDetails.au_audit_date)} bis {" "}
                  {formatDate(addDaysToDate(selectedAuditDetails.au_audit_date, selectedAuditDetails.au_number_of_days) + "")}
                  {" "}({selectedAuditDetails.au_number_of_days} {selectedAuditDetails.au_number_of_days === 1 ? "Tag" : "Tage"})
                </p>
              </div>
            </div>

            {/* Ort */}
            <div className="flex items-center mb-4">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ort</p>
                <p className="font-medium text-gray-800 dark:text-white">{selectedAuditDetails.au_place}</p>
              </div>
            </div>

            {/* Auditor */}
            <div className="flex items-center">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Auditor</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {getAuditorName(selectedAuditDetails.au_leadauditor_idx)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
