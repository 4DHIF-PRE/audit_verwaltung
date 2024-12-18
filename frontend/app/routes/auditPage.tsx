import {useEffect, useState} from "react";
import {Navbar} from "~/components/Navbar";
import AuditVorschau from "~/components/ui/AuditVorschau";
import Searchbar from "../components/Searchbar";
import { AuditDetails } from "../types/AuditDetails";
import QuestionVorschau from "../components/ui/QuestionVorschau";
import { QuestionInt } from "../types/QuestionInt";

export default function AuditPage() {
  const [audits, setAudits] = useState<AuditDetails[]>([]);
  const [questions, setQuestions] = useState<QuestionInt[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAudit, setSelectedAudit] = useState<number>(0);

  const auditsPerPage = 5;
  const totalPages = Math.ceil(audits.length / auditsPerPage);

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
  }, []);

  useEffect(() => {
    if (selectedAudit === 0) {
      setQuestions([]);
      return;
    }

    const fetchQuestions = async () => {
      try {
        const response = await fetch(`http://localhost:3000/questions?auditId=${selectedAudit}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Network response was not ok");

        const data: QuestionInt[] = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    fetchQuestions();
  }, [selectedAudit]);

  // Filter für ID und Thema
  const filteredAudits = audits.filter(
    (audit) =>
      audit.au_theme.toLowerCase().includes(search.toLowerCase()) ||
      audit.au_idx.toString().includes(search)
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

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
              {/* Suchleiste */}
              <Searchbar value={search} onChange={(value) => setSearch(value)} />

              <div className="flex-1 overflow-auto border border-gray-300 rounded-md mb-4">
                {displayedAudits.map((audit) => (
                  <div
                    key={audit.au_idx}
                    className="p-4 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                    style={{ backgroundColor: "#fff", color: "#333" }}
                    onClick={() => setSelectedAudit(audit.au_idx)}
                  >
                    Audit {audit.au_idx} - {audit.au_theme}
                  </div>
                ))}
              </div>

              {/* Pagination Buttons */}
              <div className="p-4 bg-white dark:bg-black">
                <div className="flex justify-between dark:bg-black">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === 1 ? "bg-gray-300" : "bg-gray-200"
                    }`}
                  >
                    Zurück
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    className={`px-4 py-2 rounded-md ${
                      currentPage >= totalPages ? "bg-gray-300" : "bg-gray-200"
                    }`}
                  >
                    Weiter
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="w-full h-full flex flex-col items-center justify-center p-6">
            <div className="w-3/4 max-w-screen-lg h-3/4 bg-gray-200 p-6 rounded-md flex flex-col items-center justify-start">
              <AuditVorschau audit={selectedAudit} allAudits={audits} />
              <QuestionVorschau auditId={selectedAudit} questions={questions} />

              {/* Buttons unter dem grauen Fenster */}
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => window.location.href = `/questionPage`}
                  className="px-4 py-2 text-white bg-purple-500 rounded-md"
                >
                  Neuer Audit
                </button>
                <button
                  onClick={() => window.location.href = `/auditbearbeiten/${selectedAudit}`}
                  className="px-4 py-2 text-white bg-blue-500 rounded-md"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => window.location.href = `/doaudit`}
                  className="px-4 py-2 text-white bg-green-500 rounded-md"
                >
                  Durchführen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
