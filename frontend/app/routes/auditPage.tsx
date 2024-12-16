import {useEffect, useState} from "react";
import {Navbar} from "~/components/Navbar";
import AuditVorschau from "~/components/ui/AuditVorschau";
import Searchbar from "../components/Searchbar";
import { AuditDetails } from "../types/AuditDetails";

export default function AuditPage() {
  const [audits, setAudits] = useState<AuditDetails[]>([]); // Anfangs leeres Array
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAudit, setSelectedAudit] = useState<number>(0);

  const auditsPerPage = 5;
  const totalPages = Math.ceil(audits.length / auditsPerPage);


  // Fetch-Daten beim Mounten der Komponente laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/audit", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Network response was not ok");

        const data: AuditDetails[] = await response.json();
        setAudits(data);
      } catch (error) {
        console.error("Error fetching audits:", error);
      }
    };

    fetchData();
  }, []); // Läuft nur einmal nach dem Initial-Render

  const filteredAudits = audits.filter((audit) =>
    audit.au_theme.toLowerCase().includes(search.toLowerCase())
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Angezeigte Audits für die aktuelle Seite berechnen
  const displayedAudits = filteredAudits.slice(
      (currentPage - 1) * auditsPerPage,
      currentPage * auditsPerPage
  );

  return (
      <div className="flex flex-col w-full h-screen bg-white">
        <Navbar />
        <div className="flex-1 p-4 bg-white dark:bg-black">
          <div className="flex flex-row flex-1 mt-6">
            {/* Left Section */}
            <div className="flex flex-col w-1/3 space-y-4 relative">
              <div className="flex flex-col h-full">
                {/* Neuer Audit Button */}
                <button
                    className="px-4 py-2 text-white rounded-md mb-4"
                    style={{ backgroundColor: "#9166cc" }}
                >
                  Neuer Audit
                </button>

                <Searchbar value={search} onChange={(value) => setSearch(value)} />


                <div className="flex-1 overflow-auto border border-gray-300 rounded-md mb-4">
                  {displayedAudits.map((audit, index) => (
                      <div
                          key={audit.au_idx}
                          className="p-4 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                          style={{ backgroundColor: "#fff", color: "#333" }}

                          onClick={()=>setSelectedAudit(audit.au_idx)}
                      >
                        Audit {audit.au_idx} - {audit.au_theme}
                      </div>
                  ))}
                </div>

                {/* Buttons Container */}
                <div className="p-4 bg-white dark:bg-black">
                  <div className="flex justify-between dark:bg-black">
                    <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-md ${
                            currentPage === 1 ? "bg-gray-300" : "bg-gray-200"}`}>
                      Zurück
                    </button>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages}
                        className={`px-4 py-2 rounded-md ${
                            currentPage >= totalPages ? "bg-gray-300" : "bg-gray-200"}`}>
                      Weiter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <AuditVorschau audit={selectedAudit} allAudits={audits}/>
          </div>
        </div>
      </div>
  );
}