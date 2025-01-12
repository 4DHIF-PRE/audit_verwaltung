import { useEffect, useState } from "react";
import { Navbar } from "~/components/Navbar";
import AuditVorschau from "~/components/ui/AuditVorschau";
import Searchbar from "../components/Searchbar";
import { AuditDetails } from "../types/AuditDetails";
import QuestionVorschau from "../components/ui/QuestionVorschau";
import { QuestionInt } from "../types/QuestionInt";
import { RolesUser } from "../types/RolesUser";
import {json, LoaderFunction} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";





export const loader: LoaderFunction = async ({ request }) => {

  const cookie = request.headers.get("cookie");
  const controller = new AbortController();
  request.signal.addEventListener("abort", () => controller.abort());


  const userRes = await fetch("http://localhost:3000/users/querySessionowner", {
    method: "GET",
    headers: { "Content-Type": "application/json", Cookie: cookie || "",},
    credentials: "include",
    signal: controller.signal,
  });


  if (!userRes.ok) {
    throw new Response("User nicht eingeloggt oder keine Rechte.", { status: 401 });
  }
  const userData = await userRes.json();


  const rolesRes = await fetch("http://localhost:3000/rolesuser", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
  });
  let rolesData: RolesUser[] = [];
  if (rolesRes.ok) {
    rolesData = await rolesRes.json();
  }


  const auditRes = await fetch("http://localhost:3000/audit", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
  });
  let auditsData: AuditDetails[] = [];
  if (auditRes.ok) {
    auditsData = await auditRes.json();
  }

  console.log(userData);




  const auditsForUser = userData.roles
      .map(role => role.audit);  // Get only the associated audit IDs

  const filteredAudits = auditsData.filter(audit => auditsForUser.includes(audit.au_idx));

  console.log(filteredAudits);
  return json({
    user: userData,
    roles: rolesData,
    audits: filteredAudits,

  });
};




export default function AuditPage() {
  const loaderData = useLoaderData<{ audits: AuditDetails[] }>();
  const [audits, setAudits] = useState<AuditDetails[]>([]);
  const [questions, setQuestions] = useState<QuestionInt[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAudit, setSelectedAudit] = useState<number>(0);
  const [canCreateAudit, setCanCreateAudit] = useState(false);
  const auditsPerPage = 5;
  const totalPages = Math.ceil(audits.length / auditsPerPage);


  useEffect(() => {
    setAudits(loaderData.audits); // Audits in den State laden
  }, [loaderData]);



  useEffect(() => {
    if (selectedAudit === 0) {
      setQuestions([]);
      return;
    }

    const controller = new AbortController();

    const fetchQuestions = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/questions?auditId=${selectedAudit}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
          }
        );
        if (!response.ok) throw new Error("Network response was not ok");

        const data: QuestionInt[] = await response.json();
        setQuestions(data);
      } catch (error) {
        // @ts-ignore
        if (error.name !== "AbortError") {
          console.error("Error fetching questions:", error);
        }
      }
    };

    fetchQuestions();
    return () => controller.abort();
  }, [selectedAudit]);


  useEffect(() => {
    const controller = new AbortController();
  
    const fetchUserPermission = async () => {
      try {
        const response = await fetch("http://localhost:3000/users/querySessionowner", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          credentials: "include", // Send cookies
        });
  
        if (!response.ok) {
          throw new Error("Failed to fetch user permissions");
        }
  
        const data = await response.json();
        console.log("Jonny ist dm");
        setCanCreateAudit(data.u_erstellberechtigt === true); // Setze Berechtigung
      } catch (error) {
        console.log("Jonny ist dm2");
        // @ts-ignore
        if (error.name !== "AbortError") {
          console.log("Jonny ist dm4");
          console.error("Error fetching user permissions:", error);
        }
        setCanCreateAudit(false); // Standard: Keine Berechtigung
      }
    };
  //daniel walter ist ein furry sigma!!! ich liebe sein linkes bein 
    fetchUserPermission();
  
    return () => controller.abort();
  }, []);
  




  const handleDeleteAudit = async (auditId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/audit/${auditId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Fehler beim Löschen des Audits");

      setAudits((prevAudits) =>
        prevAudits.filter((audit) => audit.au_idx !== auditId)
      );

    } catch (error) {
      console.error("Error deleting audit:", error);
      alert(`Audit ${auditId} konnte nicht gelöscht werden.`);
    }
  };

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

  const handleAuditClick = (auditId: number) => {
    setSelectedAudit((prev) => (prev === auditId ? 0 : auditId));
  };

  const displayedAudits = filteredAudits.slice(
    (currentPage - 1) * auditsPerPage,
    currentPage * auditsPerPage
  );

  const changeStatus = async (auditId: number) => {
    const audit = audits.find(a => a.au_idx === auditId);
  
    if (!audit) {
      console.error("Audit not found");
      return;
    }
  
    if (audit.au_auditstatus === "bereit") {
      try {
        const response = await fetch(`http://localhost:3000/audit/${auditId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ au_auditstatus: "begonnen" })
        });
  
        if (!response.ok) {
          throw new Error("Failed to update audit status");
        }
  
        setAudits(prevAudits =>
          prevAudits.map(a =>
            a.au_idx === auditId ? { ...a, au_auditstatus: "begonnen" } : a
          )
        );
  
        window.location.href = `/doAudit/${auditId}`;
  
      } catch (error) {
        console.error("Error changing audit status:", error);
        alert("Fehler beim Ändern des Audit-Status.");
      }
    } else if (audit.au_auditstatus === "begonnen") {
      window.location.href = `/doAudit/${auditId}`;
    }
    else {
      console.log("Audit status is not 'bereit' or 'begonnen', no update needed.");
    }
  };

  return (
    <div className="flex flex-col w-full h-screen bg-white">
      <Navbar />
      <div className="flex-1 p-4 bg-white dark:bg-black mt-9">
        <div className="flex flex-row flex-1 mt-6">
          {/* Left Section */}
          <div className="flex flex-col w-1/3 space-y-4 relative">
            <div className="flex flex-col h-full">
              {/* Suchleiste */}
              <Searchbar value={search} onChange={(value) => setSearch(value)} />

              <div className="flex-1 overflow-auto border border-gray-300 dark:bg-gray-800 rounded-md mb-4" >
                {displayedAudits.map((audit) => (
                  <div
                    key={audit.au_idx}
                    className={`flex border-b mt-4 border-gray-200 mx-3 justify-between items-center p-4 rounded-md 
                      ${audit.au_auditstatus === "geplant" ? "bg-blue-100 dark:bg-blue-600 hover:bg-blue-300 dark:hover:bg-blue-700" :
                        audit.au_auditstatus === "bereit" ? "bg-green-100 hover:bg-green-300 dark:bg-green-600 dark:hover:bg-green-700" :
                          audit.au_auditstatus === "begonnen" ? "bg-yellow-100 dark:bg-yellow-600 hover:bg-yellow-200 dark:hover:bg-yellow-700" :
                            audit.au_auditstatus === "findings_offen" ? "bg-red-200 dark:bg-red-600 hover:bg-red-300 dark:hover:bg-red-700" :
                              audit.au_auditstatus === "fertig" ? "bg-gray-100 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700" : ""
                      } 
                      ${selectedAudit === audit.au_idx ? "text-gray-400 dark:text-gray-900" : ""}
                      mb-4 `}
                    onClick={() => handleAuditClick(audit.au_idx)}>
                    <div>

                      Audit {audit.au_idx} - {audit.au_theme}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAudit(audit.au_idx);
                      }}
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination Buttons */}
              <div className="p-4 bg-white dark:bg-black">
                <div className="flex justify-between dark:bg-black">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-md ${currentPage === 1 ? "bg-gray-300 dark:bg-gray-900" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                  >
                    Zurück
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    className={`px-4 py-2 rounded-md ${currentPage >= totalPages ? "bg-gray-300 dark:bg-gray-900" : "bg-gray-200 dark:bg-gray-700"
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
            <div className="w-3/4 max-w-screen-lg h-3/4 bg-gray-200 dark:bg-gray-900 p-6 rounded-md flex flex-col items-center justify-start">
              <AuditVorschau audit={selectedAudit} allAudits={audits} />
              <QuestionVorschau auditId={selectedAudit} questions={questions} />

                              {/* Buttons unter dem grauen Fenster */}
                {selectedAudit !== 0 ? (
                  <div className="flex justify-center space-x-4 mt-4">
                    <button
                      onClick={() =>
                        selectedAudit &&
                        (window.location.href = `/questionPage/${selectedAudit}`)
                      }
                      className="px-4 py-2 rounded-md text-white bg-purple-500"
                    >
                      Neue Question
                    </button>
                    <button
                      onClick={() =>
                        selectedAudit &&
                        (window.location.href = `/auditbearbeiten/${selectedAudit}`)
                      }
                      className="px-4 py-2 rounded-md text-white bg-blue-500"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => {
                        if (selectedAudit) {
                          changeStatus(selectedAudit);
                        }
                      }}
                      className="px-4 py-2 rounded-md text-white bg-green-500"
                    >
                      Durchführen
                    </button>
                  </div>
                ) : (
                  canCreateAudit && ( // Button nur anzeigen, wenn der Benutzer erstellberechtigt ist
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => window.location.href = '/neuesAuditErstellen'}
                        className="px-4 py-2 rounded-md text-white bg-red-500"
                      >
                        Neues Audit erstellen
                      </button>
                    </div>
                  )
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
