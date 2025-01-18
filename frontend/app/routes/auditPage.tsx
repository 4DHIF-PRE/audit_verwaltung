import { useEffect, useState } from "react";
import { Navbar } from "~/components/Navbar";
import AuditVorschau from "~/components/ui/AuditVorschau";
import Searchbar from "../components/Searchbar";
import { AuditDetails } from "../types/AuditDetails";
import { FindingDetails } from "../types/FindingDetails";
import QuestionVorschau from "../components/ui/QuestionVorschau";
import { QuestionInt } from "../types/QuestionInt";
import { RolesUser } from "../types/RolesUser";
import { UserDetails } from "../types/UserDetails";
import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import jsPDF from "jspdf";


export const loader: LoaderFunction = async ({ request }) => {

  const cookie = request.headers.get("cookie");
  const controller = new AbortController();
  request.signal.addEventListener("abort", () => controller.abort());
  const userRes = await fetch("http://localhost:3000/users/querySessionowner", {
    method: "GET",
    headers: { "Content-Type": "application/json", Cookie: cookie || "", },
    credentials: "include",
    signal: controller.signal,
  });

  if (!userRes.ok) {
    throw new Response("User nicht eingeloggt oder keine Rechte.", { status: 401 });
  }
  let userData: UserDetails = await userRes.json();

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

  const findingsRes = await fetch("http://localhost:3000/findings", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
  });
  let findingsData = [];
  if (findingsRes.ok) {
    findingsData = await findingsRes.json();
  }
  

  const auditsForUser = userData.roles
    .map(role => role.audit);

  const filteredAudits = auditsData.filter(audit => auditsForUser.includes(audit.au_idx));
  console.log(filteredAudits);
  return json({
    user: userData,
    roles: rolesData,
    audits: filteredAudits,
    findings: findingsData,
  });
};


export default function AuditPage() {
  const loaderData = useLoaderData<{ audits: AuditDetails[]; findings: FindingDetails[]; }>();
  const [audits, setAudits] = useState<AuditDetails[]>([]);
  const [findings, setFindings] = useState<FindingDetails[]>([]);
  const [auditstatus, setAuditstatus] = useState<string>("");
  const loaderData2 = useLoaderData<{ user: UserDetails}>();
  const [user, setUser] = useState<UserDetails>();

  const [questions, setQuestions] = useState<QuestionInt[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAudit, setSelectedAudit] = useState<number>(0);
  const [canCreateAudit, setCanCreateAudit] = useState(false);
  const auditsPerPage = 5;
  const totalPages = Math.ceil(audits.length / auditsPerPage);

  useEffect(() => {
    setUser(loaderData2.user); 
  }, [loaderData2]);

  console.log(loaderData2.user)

  useEffect(() => {
    setAudits(loaderData.audits); 
    setFindings(loaderData.findings);
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
  

  const createAudit = async (
    user: UserDetails,
    setAudits: React.Dispatch<React.SetStateAction<AuditDetails[]>>
  ) => {
    const today = new Date().toISOString().split("T")[0];
    const newAudit = {
      au_audit_date: today,
      au_number_of_days: 1,
      au_leadauditor_idx: user.u_userId,
      au_auditstatus: "geplant",
      au_place: "Ort",
      au_theme: "Kein Thema",
      au_typ: "audit",
    };

    console.log(newAudit.au_theme);
    

    try {
      const response = await fetch("http://localhost:3000/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAudit),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Fehler beim Erstellen des Audits: ${JSON.stringify(error)}`);
        return;
      }
  
      const createdAudit = await response.json();

      console.log(user.u_userId + " " + createdAudit.au_idx)
  
      const roleResponse = await fetch("http://localhost:3000/rolesuser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.u_userId,
          auditId: createdAudit.au_idx,
        }),
      });
  
      if (!roleResponse.ok) {
        const error = await roleResponse.json();
        alert(`Fehler beim Hinzufügen der Rolle: ${JSON.stringify(error)}`);
        return;
      }
  
      setAudits((prevAudits) => [...prevAudits, createdAudit]);
    } catch (error) {
      console.error("Fehler beim Erstellen des Audits:", error);
    }
  };

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
      audit.au_theme.toLowerCase().includes(search.toLowerCase()) 
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleAuditClick = (auditId: number) => {
    setSelectedAudit((prev) => (prev === auditId ? 0 : auditId));
    const selectedAuditStatus = audits.find(a => a.au_idx === auditId)?.au_auditstatus || "";
    setAuditstatus(selectedAuditStatus);
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
      
        interface QuestionInt {
          qu_idx: number;
          qu_audit_idx: number;
          qu_law_idx: number;
          qu_audited: number;
          qu_applicable: number;
          qu_finding_level: number;
        }

        const getQuestionsfromAudit = await fetch(`http://localhost:3000/audit/questions/${auditId}`, {
          method: "GET",
        });
        
        const QuestionAudit: QuestionInt[] = await getQuestionsfromAudit.json();
        
        QuestionAudit.forEach(async (element) => {
          const newFinding = {
            f_level: 0,
            f_creation_date: new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0],
            f_timeInDays: 14,
            f_au_audit_idx: auditId,
            f_qu_question_idx: element.qu_idx, 
            f_u_auditor_id: user?.u_userId,
            f_status: "offen",
            f_comment: "",
            f_finding_comment: "",
          };
          console.log("f_u_auditor_id length:", user?.u_userId.length);
          

          console.log("new Finding", newFinding);
          const addfinding = await fetch("http://localhost:3000/audit/finding", {
            method:"POST",
            headers:{
                "Content-Type": "application/json",
            },
            body: JSON.stringify(newFinding),
          });
          if (!addfinding.ok) {
            let errorMessage = 'Unknown error';
            try {
                const errorResponse = await addfinding.json();
                errorMessage = errorResponse.message || errorResponse.error || errorMessage;
            } catch (e) {
                console.error('Error parsing error response:', e);
            }
            throw new Error(`Failed to create finding for question: ${errorMessage}`);
        }
        });

        const response = await fetch(`http://localhost:3000/audit/${auditId}`, {
          method: "PUT",
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

  const exportAllAuditsAndFindingsToPDF = async (audits: any[], findings: any[]) => {
    try {
      if (audits.length === 0) {
        throw new Error("Keine Audits gefunden.");
      }
  
      // PDF-Dokument initialisieren
      const doc = new jsPDF();
      let yPosition = 10;
  
      audits.forEach((audit, auditIndex) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 10;
        }
  
        // Audit-Details hinzufügen
        doc.setFontSize(14);
        doc.text(`Audit ${auditIndex + 1}: ${audit.au_theme}`, 10, yPosition);
        doc.setFontSize(12);
        doc.text(`Datum: ${audit.au_audit_date}`, 10, yPosition + 10);
        doc.text(`Ort: ${audit.au_place}`, 10, yPosition + 20);
        doc.text(`Leitender Auditor: ${audit.au_leadauditor_idx}`, 10, yPosition + 30);
        yPosition += 40;
  
        // Debug: Zeige Audit-ID
        console.log(`Audit-ID: ${audit.au_idx}`);
  
        // Findings für das aktuelle Audit hinzufügen
        const auditFindings = findings.filter(finding => {
          console.log(`Checking Finding: ${finding.f_au_audit_idx} === ${audit.au_idx}`);
          return finding.f_au_audit_idx === audit.au_idx;
        });
  
        if (auditFindings.length > 0) {
          doc.text("Findings:", 10, yPosition);
          yPosition += 10;
  
          auditFindings.forEach((finding, index) => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 10;
            }
  
            doc.text(`${index + 1}. Frage-ID: ${finding.f_qu_question_idx || "Keine"}`, 10, yPosition);
            doc.text(`   Level: ${finding.f_level || "Nicht angegeben"}`, 10, yPosition + 10);
            doc.text(`   Status: ${finding.f_status}`, 10, yPosition + 20);
            doc.text(`   Kommentar: ${finding.f_auditor_comment || "Keine"}`, 10, yPosition + 30);
            doc.text(`   Maßnahme: ${finding.f_finding_comment || "Keine"}`, 10, yPosition + 40);
            doc.text(`   Erstellt am: ${finding.f_creation_date}`, 10, yPosition + 50);
  
            yPosition += 60;
          });
        } else {
          doc.text("Keine Findings für dieses Audit.", 10, yPosition);
          yPosition += 20;
        }
      });
  
      // PDF speichern
      doc.save(`All_Audits_and_Findings.pdf`);
    } catch (error) {
      console.error("Fehler beim Exportieren der Audit-Details:", error);
      alert("Fehler beim Exportieren der Audit-Details.");
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

              {/* Suchleiste und Add Button*/}
              <div className="flex flex-col">
                <Searchbar value={search} onChange={(value) => setSearch(value)} />
                <button
                  className="mb-4 rounded bg-green-100 dark:bg-green-500 border border-gray-300"
                  onClick={() => createAudit(user, setAudits)}
                >
                  Audit erstellen
                </button>
              </div>

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

                      {audit.au_theme}
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
            <div className="w-3/4 max-w-screen-lg h-3/4 bg-gray-200 dark:bg-gray-900 p-6 rounded-md flex flex-col justify-start">
              <AuditVorschau audit={selectedAudit} allAudits={audits} />
              <QuestionVorschau auditId={selectedAudit} questions={questions} />

              {/* Buttons unter dem grauen Fenster */}
              {selectedAudit !== 0 ? (
                <div className="flex justify-center space-x-4 mt-4">
                  {auditstatus === "geplant" || auditstatus === "bereit" ? (
                  <button
                    onClick={() =>
                      selectedAudit &&
                      (window.location.href = `/questionPage/${selectedAudit}`)
                    }
                    className="px-4 py-2 rounded-md text-white bg-purple-500"
                  >
                    Neue Question
                  </button>
                  ) : ""}
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
                  
                    onClick={() => exportAllAuditsAndFindingsToPDF(audits, findings)}
                    className="px-4 py-2 rounded-md text-white bg-green-500"
                  >
                    Export Audit Details as PDF
                  </button>
                  {auditstatus !== "geplant" ? (
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
                ) : ""}
                {auditstatus === "findings_offen" ? (
                <button
                    onClick={() => {
                      if (selectedAudit) {
                        window.location.href = `/gruppe5/${selectedAudit}`;
                      }
                    }}
                    className="px-4 py-2 rounded-md text-white bg-green-500"
                  >
                    Findus
                  </button>) : ""}
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
