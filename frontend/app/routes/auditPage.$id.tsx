import { useState } from "react";
import { Link } from "@remix-run/react";

export default function AuditPage() {
  const [audits, setAudits] = useState<string[]>(Array(50).fill("").map((_, i) => `Audit ${i + 1}`)); // Beispiel: 50 Audits
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const auditsPerPage = 10;
  const totalPages = Math.ceil(audits.length / auditsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Berechnung der angezeigten Audits basierend auf der aktuellen Seite
  const displayedAudits = audits.slice(
    (currentPage - 1) * auditsPerPage,
    currentPage * auditsPerPage
  );

  return (
    <div className="flex flex-col w-full h-screen p-4 bg-white">

      <div className="flex-1 bg-white">
      <header className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <img src="/img/images.png" alt="Logo" className="w-10 h-10" />
          <nav className="flex space-x-4">
            <Link to="/audit-hinzufuegen" className="text-lg font-semibold" style={{ color: "#333" }}>
              Audit Hinzufügen
            </Link>
            <Link to="/audit" className="text-lg font-semibold" style={{ color: "#333" }}>
              Audit
            </Link>
            <Link to="/findings" className="text-lg font-semibold" style={{ color: "#333" }}>
              Findings
            </Link>
          </nav>
        </div>
        <div className="flex space-x-4">
          <Link to="/signup" className="text-lg font-semibold" style={{ color: "#333" }}>
            Sign up
          </Link>
          <Link to="/login" className="text-lg font-semibold" style={{ color: "#333" }}>
            Login
          </Link>
        </div>
      </header>

      <div className="flex flex-row flex-1 mt-6">
        {/* Left Section with Container */}
        <div className="flex flex-col w-1/3 space-y-4 relative">
          <div className="flex flex-col h-full">
            {/* Neuer Audit Button */}
            <button className="px-4 py-2 text-white rounded-md mb-4" style={{ backgroundColor: "#9166cc" }}>
              Neuer Audit
            </button>

            {/* Search Input */}
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                placeholder="Name eines Audits"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md"
                style={{ backgroundColor: "#fafafa", borderColor: "#ccc", color: "#333" }}
              />
              <button className="p-2 bg-gray-100 rounded-md" style={{ backgroundColor: "#fff", color: "#333" }}>
                <span role="img" aria-label="search">🔍</span>
              </button>
            </div>

            {/* Audits List */}
            <div className="flex-1 overflow-auto border border-gray-300 rounded-md mb-4">
              {displayedAudits.map((audit, index) => (
                <div
                  key={index}
                  className="p-4 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                  style={{ backgroundColor: "#fff", color: "#333" }}
                >
                  {audit}
                </div>
              ))}
            </div>

            {/* Buttons Container */}
            <div className="p-4" style={{ backgroundColor: "#f5f5f5", borderTop: "1px solid #ccc" }}>
              <div className="flex justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md ${currentPage === 1 ? 'bg-gray-300' : 'bg-gray-200'}`}
                  style={{ backgroundColor: "#dcdcdc", color: "#333" }}
                >
                  Zurück
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-md ${currentPage === totalPages ? 'bg-gray-300' : 'bg-gray-200'}`}
                  style={{ backgroundColor: "#dcdcdc", color: "#333" }}
                >
                  Weiter
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex-1 ml-6 bg-gray-200 flex items-center justify-center" style={{ backgroundColor: "#dcdcdc" }}>
          <span className="text-xl" style={{ color: "#666" }}>Audit Design</span>
        </div>
      </div>
      </div>
      
    </div>
  );
}