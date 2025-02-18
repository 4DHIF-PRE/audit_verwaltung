import { useEffect, useState } from "react";
import { Navbar } from "~/components/Navbar";
import AuditVorschau from "~/components/ui/AuditVorschau";
import Searchbar from "../components/Searchbar";
import { AuditDetails } from "~/types/AuditDetails";
import { FindingDetails } from "~/types/FindingDetails";
import QuestionVorschau from "../components/ui/QuestionVorschau";
import { QuestionInt } from "~/types/QuestionInt";
import { RolesUser } from "~/types/RolesUser";
import { UserDetails } from "~/types/UserDetails";
import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Footer } from "~/components/Footer";
import { Button } from "~/components/ui/button";
import jsPDF from "jspdf";
import { useNavigate } from "react-router-dom";

export const loader: LoaderFunction = async ({ request }) => {
  const cookie = request.headers.get("cookie");
  const controller = new AbortController();
  request.signal.addEventListener("abort", () => controller.abort());
  const userRes = await fetch("http://localhost:3000/users/querySessionowner", {
    method: "GET",
    headers: { "Content-Type": "application/json", Cookie: cookie || "" },
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


  const allUsersRes = await fetch("http://localhost:3000/getalluser", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
  });
  let allUsers: UserDetails[] = [];
  if (allUsersRes.ok) {
    allUsers = await allUsersRes.json();
  }

  // 4) Alle Audits
  const auditRes = await fetch("http://localhost:3000/audit", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
  });
  let auditsData: AuditDetails[] = [];
  if (auditRes.ok) {
    auditsData = await auditRes.json();
  }

  // 5) Alle Findings
  const findingsRes = await fetch("http://localhost:3000/findings/getall", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
  });
  let findingsData: FindingDetails[] = [];
  if (findingsRes.ok) {
    findingsData = await findingsRes.json();
  }

  const auditsForUser = userData.roles.map((role) => role.audit);
  const filteredAudits = auditsData.filter((audit) =>
    auditsForUser.includes(audit.au_idx)
  );

  return json({
    user: userData,         
    roles: rolesData,       
    allUsers,               
    audits: filteredAudits, 
    findings: findingsData,
  });
};

export default function AuditPage() {
 
  const loaderData = useLoaderData<{
    user: UserDetails;
    roles: RolesUser[];
    allUsers: UserDetails[];
    audits: AuditDetails[];
    findings: FindingDetails[];
  }>();

  // States
  const [user, setUser] = useState<UserDetails>();
  const [roles, setRoles] = useState<RolesUser[]>([]);
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [audits, setAudits] = useState<AuditDetails[]>([]);
  const [findings, setFindings] = useState<FindingDetails[]>([]);
  const [auditstatus, setAuditstatus] = useState<string>("");
  const [selectedAudit, setSelectedAudit] = useState<number>(0);
  const [isLeadAuditor, setIsLeadAuditor] = useState<boolean>(false);

  const [auditZugewiesen, setAuditZugewiesen] = useState<UserDetails[]>([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [questions, setQuestions] = useState<QuestionInt[]>([]);
  const [firstName, setFirstName] = useState<string>();
  const [lastName, setLastName] = useState<string>();
  const [role, setRole] = useState<number>();
  const [canCreateAudit, setCanCreateAudit] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setUser(loaderData.user);
    setRoles(loaderData.roles);
    setUsers(loaderData.allUsers);
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
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error fetching questions:", error);
        }
      }
    };

    fetchQuestions();
    return () => controller.abort();
  }, [selectedAudit]);


  const createAudit = (
    user: UserDetails | undefined,
    setAudits: React.Dispatch<React.SetStateAction<AuditDetails[]>>
  ) => {
    if (!user) return;
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

    fetch("http://localhost:3000/audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newAudit),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((error) => {
            alert(`Fehler beim Erstellen des Audits: ${JSON.stringify(error)}`);
            throw new Error("Audit konnte nicht erstellt werden");
          });
        }
        return response.json();
      })
      .then((createdAudit) => {
        // Rolle in rolesuser anlegen
        return fetch("http://localhost:3000/rolesuser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.u_userId,
            auditId: createdAudit.au_idx,
          }),
        }).then(() => createdAudit.au_idx);
      })
      .then((auditId) => {
        setAudits((prevAudits) => [
          ...prevAudits,
          { ...newAudit, au_idx: auditId },
        ]);
        navigate(`/auditbearbeiten/${auditId}`);
      })
      .catch((error) => {
        console.error("Fehler beim Erstellen des Audits:", error);
      });
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

  const handleAuditClick = (audit: AuditDetails) => {
    // Audit auswählen / abwählen
    setSelectedAudit((prev) => (prev === audit.au_idx ? 0 : audit.au_idx));

    const selectedAuditStatus =
      audits.find((a) => a.au_idx === audit.au_idx)?.au_auditstatus || "";
    setAuditstatus(selectedAuditStatus);

    if (audit.au_leadauditor_idx === user?.u_userId) {
      setIsLeadAuditor(true);
    } else {
      setIsLeadAuditor(false);
    }

  
    const zugewieseneUserIDs = roles
      .filter((role) => role.audit === audit.au_idx)
      .map((role) => role.ru_u_userId);

    // Passende Userdetails filtern
    const zugewieseneUserDetails = users.filter((u) =>
      zugewieseneUserIDs.includes(u.u_userId)
    );


    setAuditZugewiesen(zugewieseneUserDetails);
  };

 
  const handleZuweisen = async (audit: number) => {
    try {
      const response = await fetch("http://localhost:3000/assignRole", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          roleId: role,
          auditId: audit,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Fehler beim Zuweisen.");
      }

      alert("Erfolgreich zugewiesen!");
    } catch (error: any) {
      alert(`Fehler: ${error.message}`);
    }
  };


  const filteredAudits = audits.filter((audit) => {
    const auditText = audit.au_theme.toLowerCase();
    const searchTextLower = search.toLowerCase().trim();
    const matchesSearch = auditText.includes(searchTextLower);
    const matchesType = filter === "" || audit.au_auditstatus === filter;
    return matchesSearch && matchesType;
  });


  const changeStatus = async (auditId: number) => {
    const audit = audits.find((a) => a.au_idx === auditId);
    if (!audit) {
      console.error("Audit not found");
      return;
    }

    if (audit.au_auditstatus === "bereit") {
      try {
        // Alle Fragen zu diesem Audit holen
        const getQuestionsfromAudit = await fetch(
          `http://localhost:3000/audit/questions/${auditId}`,
          { method: "GET" }
        );
        const questionAudit: QuestionInt[] = await getQuestionsfromAudit.json();

        for (const element of questionAudit) {
          const newFinding = {
            f_level: 0,
            f_creation_date: new Date()
              .toISOString()
              .replace("T", " ")
              .replace("Z", "")
              .split(".")[0],
            f_timeInDays: 14,
            f_au_audit_idx: auditId,
            f_qu_question_idx: element.qu_idx,
            f_u_auditor_id: user?.u_userId,
            f_status: "offen",
            f_comment: "",
            f_finding_comment: "",
          };

          const addfinding = await fetch("http://localhost:3000/audit/finding", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newFinding),
          });

          if (!addfinding.ok) {
            let errorMessage = "Unknown error";
            try {
              const errorResponse = await addfinding.json();
              errorMessage =
                errorResponse.message || errorResponse.error || errorMessage;
            } catch (e) {
              console.error("Error parsing error response:", e);
            }
            throw new Error(
              `Failed to create finding for question: ${errorMessage}`
            );
          }
        }
 const response = await fetch(`http://localhost:3000/audit/${auditId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ au_auditstatus: "begonnen" }),
        });

        if (!response.ok) {
          throw new Error("Failed to update audit status");
        }

        setAudits((prevAudits) =>
          prevAudits.map((a) =>
            a.au_idx === auditId ? { ...a, au_auditstatus: "begonnen" } : a
          )
        );

        // Weiterleiten zum Durchführen
        window.location.href = `/doAudit/${auditId}`;
      } catch (error) {
        console.error("Error changing audit status:", error);
        alert("Fehler beim Ändern des Audit-Status.");
      }
    } else if (audit.au_auditstatus === "begonnen") {
      // Direkt weiterleiten
      window.location.href = `/doAudit/${auditId}`;
    } else {
      console.log("Auditstatus ist nicht 'bereit' oder 'begonnen'.");
    }
  };

  const exportAllAuditsAndFindingsToPDF = async (
    audits: AuditDetails[],
    findings: FindingDetails[]
  ) => {
    try {
      if (audits.length === 0) {
        throw new Error("Keine Audits gefunden.");
      }

      const doc = new jsPDF();
      let yPosition = 10;

      audits.forEach((audit, auditIndex) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 10;
        }

        const formattedDate = new Date(audit.au_audit_date).toLocaleDateString(
          "de-DE",
          {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }
        );

        // Audit-Details
        doc.setFontSize(14);
        doc.text(`Audit ${auditIndex + 1}: ${audit.au_theme}`, 10, yPosition);
        doc.setFontSize(12);
        doc.text(`Datum: ${formattedDate}`, 10, yPosition + 10);
        doc.text(`Ort: ${audit.au_place}`, 10, yPosition + 20);
        doc.text(
          `Status: ${audit.au_auditstatus || "Unbekannt"}`,
          10,
          yPosition + 30
        );
        doc.text(`Leitender Auditor: ${audit.au_leadauditor_idx}`, 10, yPosition + 40);
        yPosition += 50;

        // Findings filtern
        const auditFindings = findings.filter(
          (finding) => finding.f_au_audit_idx === audit.au_idx
        );

        if (auditFindings.length > 0) {
          doc.text("Findings:", 10, yPosition);
          yPosition += 10;

          auditFindings.forEach((finding, index) => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 10;
            }

            const findingDate = finding.f_creation_date
              ? new Date(finding.f_creation_date).toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })
              : "Keine Angabe";

            doc.setFontSize(10);
            doc.text(`${index + 1}.`, 10, yPosition);
            doc.text(`   Level: ${finding.f_level || "Nicht angegeben"}`, 15, yPosition);
            doc.text(`   Status: ${finding.f_status || "Nicht angegeben"}`, 15, yPosition + 5);
            doc.text(`   Kommentar: ${finding.f_comment || "Keine"}`, 15, yPosition + 10);
            doc.text(`   Maßnahme: ${finding.f_finding_comment || "Keine"}`, 15, yPosition + 15);
            doc.text(`   Erstellt am: ${findingDate}`, 15, yPosition + 20);

            yPosition += 35;
          });
        } else {
          doc.text("Keine Findings für dieses Audit.", 10, yPosition);
          yPosition += 20;
        }
      });

      doc.save(`All_Audits_and_Findings.pdf`);
    } catch (error) {
      console.error("Fehler beim Exportieren der Audit-Details:", error);
      alert("Fehler beim Exportieren der Audit-Details.");
    }
  };

  // Gefilterte Audits
  const displayedAudits = filteredAudits;

  return (
    <div className="flex flex-col w-full h-screen bg-white">
      <Navbar />
      <div className="flex-1 p-4 bg-white dark:bg-black mt-9">
        <div className="flex flex-col lg:flex-row flex-1 mt-6 space-y-6 lg:space-y-0 lg:space-x-6">
          {/* Left Section */}
          <div className="flex flex-col w-full lg:w-1/3 space-y-4 relative">
            <div className="flex flex-col h-[630px]">
              {/* Suchleiste und Add Button */}
              <div className="flex flex-col">
                <Searchbar value={search} onChange={(value) => setSearch(value)} />
                <select
                  className="border p-2 rounded-md mb-4 dark:bg-black"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="">Wählen Sie einen Filter aus</option>
                  <option value="geplant">Geplant</option>
                  <option value="bereit">Bereit</option>
                  <option value="findings_offen">Findings Offen</option>
                  <option value="begonnen">Begonnen</option>
                  <option value="fertig">Fertig</option>
                </select>
                <Button
                  className="mb-4"
                  variant="default"
                  size="lg"
                  onClick={() => createAudit(user, setAudits)}
                >
                  Audit erstellen
                </Button>
              </div>

              <div className="flex flex-col h-full">
                <div
                  className="flex-1 overflow-auto border border-gray-300 dark:bg-gray-800 rounded-md mb-4
    max-h-[50vh] sm:max-h-[calc(100vh-100px)]"
                >
                  {displayedAudits.length > 0 ? (
                    displayedAudits.map((audit) => (
                      <div
                        key={audit.au_idx}
                        className={`flex border-b mt-4 border-gray-200 mx-3 justify-between items-center p-4 rounded-md 
                      ${
                        audit.au_auditstatus === "geplant"
                          ? "bg-blue-100 dark:bg-blue-600 hover:bg-blue-300 dark:hover:bg-blue-700"
                          : audit.au_auditstatus === "bereit"
                          ? "bg-green-100 hover:bg-green-300 dark:bg-green-600 dark:hover:bg-green-700"
                          : audit.au_auditstatus === "begonnen"
                          ? "bg-yellow-100 dark:bg-yellow-600 hover:bg-yellow-200 dark:hover:bg-yellow-700"
                          : audit.au_auditstatus === "findings_offen"
                          ? "bg-red-200 dark:bg-red-600 hover:bg-red-300 dark:hover:bg-red-700"
                          : audit.au_auditstatus === "fertig"
                          ? "bg-gray-100 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700"
                          : ""
                      } 
                      ${selectedAudit === audit.au_idx ? "text-gray-400 dark:text-gray-900" : ""} mb-4 `}
                        onClick={() => handleAuditClick(audit)}
                      >
                        <div>{audit.au_theme}</div>
                        {(audit.au_auditstatus === "bereit" ||
                          audit.au_auditstatus === "geplant") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAudit(audit.au_idx);
                            }}
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-600 dark:text-gray-300">
                      Keine Audits gefunden
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="w-full lg:w-2/3 h-full flex flex-col items-center justify-center p-6">
            {selectedAudit ? (
              <div className="w-full max-w-screen-lg h-full bg-gray-200 dark:bg-gray-900 p-6 rounded-md flex flex-col justify-start">
                <AuditVorschau audit={selectedAudit} allAudits={audits} />
                <QuestionVorschau auditId={selectedAudit} questions={questions} />

                {/* Falls User Lead Auditor ist -> Zuweisen möglich */}
                {isLeadAuditor && selectedAudit && (
                  <div className="mb-4 flex gap-4 items-center">
                    <input
                      type="text"
                      placeholder="Vornamen eingeben..."
                      className="p-2 border rounded-md w-full text-black"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Nachnamen eingeben..."
                      className="p-2 border rounded-md w-full text-black"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                    <select
                      className="p-2 border rounded-md text-black"
                      value={role}
                      onChange={(e) => setRole(Number(e.target.value))}
                    >
                      <option value="2">Auditor</option>
                      <option value="3">Auditee</option>
                      <option value="4">Gast</option>
                      <option value="5">Reporter</option>
                      <option value="6">Manual-Writer</option>
                    </select>
                    <button
                      className="px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => handleZuweisen(selectedAudit)}
                    >
                      Zuweisen
                    </button>
                  </div>
                )}

                {/* Zugewiesene User anzeigen */}
                {auditZugewiesen.length > 0 && (
                  <div className="my-4">
                    <h3 className="font-bold mb-2">Zugewiesene User:</h3>
                    <ul className="list-disc list-inside">
                      {auditZugewiesen.map((assignedUser) => (
                        <li key={assignedUser.u_userId}>
                          {assignedUser.u_firstname} {assignedUser.u_lastname} 
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Buttons unter der Fragenliste */}
                <div className="flex justify-center space-x-4 mt-4">
                  {(auditstatus === "geplant" || auditstatus === "bereit") && (
                    <button
                      onClick={() =>
                        selectedAudit &&
                        (window.location.href = `/questionPage/${selectedAudit}`)
                      }
                      className="px-4 py-2 rounded-md text-white bg-purple-500 hover:bg-purple-600"
                    >
                      Neue Frage
                    </button>
                  )}

                  <button
                    onClick={() =>
                      selectedAudit &&
                      (window.location.href = `/auditbearbeiten/${selectedAudit}`)
                    }
                    className="px-4 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600"
                  >
                    Bearbeiten
                  </button>

                  {auditstatus !== "geplant" && (
                    <button
                      onClick={() => {
                        if (selectedAudit) {
                          changeStatus(selectedAudit);
                        }
                      }}
                      className="px-4 py-2 rounded-md text-white bg-green-500 hover:bg-green-600"
                    >
                      Durchführen
                    </button>
                  )}

                  {auditstatus === "findings_offen" && (
                    <button
                      onClick={() => {
                        if (selectedAudit) {
                          window.location.href = `/gruppe5/${selectedAudit}`;
                        }
                      }}
                      className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      Findings
                    </button>
                  )}
                </div>

                <button
                  onClick={() => exportAllAuditsAndFindingsToPDF(audits, findings)}
                  className="px-4 py-2 rounded-md bg-sky-300 hover:bg-sky-400 dark:bg-sky-500 dark:hover:bg-sky-600 dark:text-white mt-4"
                >
                  Export Audit Details as PDF
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
