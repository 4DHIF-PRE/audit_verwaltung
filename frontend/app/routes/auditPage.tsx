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
import { Modal } from "~/components/ui/modal";
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
const [users, setUsers] = useState<(UserDetails & { selectedRole?: number })[]>([]);
  const [audits, setAudits] = useState<AuditDetails[]>([]);
  const [findings, setFindings] = useState<FindingDetails[]>([]);
  const [auditstatus, setAuditstatus] = useState<string>("");
  const [selectedAudit, setSelectedAudit] = useState<number>(0);
  const [isLeadAuditor, setIsLeadAuditor] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [auditZugewiesen, setAuditZugewiesen] = useState<UserDetails[]>([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [questions, setQuestions] = useState<QuestionInt[]>([]);
  const [firstName, setFirstName] = useState<string>();
  const [lastName, setLastName] = useState<string>();
  const [role, setRole] = useState<number>();
  const [canCreateAudit, setCanCreateAudit] = useState(false);
  const [isAuditor, setIsAuditor] = useState<boolean>(false);
  const selectedAuditData = audits.find((a) => a.au_idx === selectedAudit);
  const StatusBadge = ({ status }) => {
    const getStatusColor = () => {
      switch (status.toLowerCase()) {
        case "geplant": return "bg-blue-100 text-blue-800";
        case "in bearbeitung": return "bg-yellow-100 text-yellow-800";
        case "abgeschlossen": return "bg-green-100 text-green-800";
        case "storniert": return "bg-red-100 text-red-800";
        default: return "bg-gray-100 text-gray-800";
      }
    };
  
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
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
        console.error("Fehler beim Erstellen des Audits:", error.message);
        alert("Fehler beim Erstellen des Audits: " + error.message);
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

      if (selectedAudit === auditId) {
        setSelectedAudit(0);
      }

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

    if(user?.roles.some(roles => roles.r_id === 2 && roles.audit === audit.au_idx)) {
      setIsAuditor(true)
    } else {
      setIsAuditor(false);
    }

    const zugewieseneUserIDs = roles
        .filter((role) => role.audit === audit.au_idx)
        .map((role) => role.ru_u_userId);

    // Passende Userdetails filtern und ru_r_id hinzufügen
    const zugewieseneUserDetails = users
        .filter((u) => zugewieseneUserIDs.includes(u.u_userId))
        .map((u) => {
          const role = roles.find((r) => r.ru_u_userId === u.u_userId && r.audit === audit.au_idx);
          return {
            ...u,
            ru_r_id: role ? role.ru_r_id : null, // Füge die ru_r_id hinzu
          };
        });

    setAuditZugewiesen(zugewieseneUserDetails);
  };

 
const handleMehrereZuweisen = async (auditId: number) => {
  const toAssign = users.filter(
    (u) =>
      u.selectedRole !== undefined &&
      u.selectedRole !== null &&
      u.selectedRole !== "" &&
      !auditZugewiesen.some((assigned) => assigned.u_userId === u.u_userId)
  );

  if (toAssign.length === 0) {
    alert("Bitte wählen Sie mindestens einen Benutzer mit einer Rolle aus.");
    return;
  }

  try {
    const assignRequests = toAssign.map((user) =>
      fetch("http://localhost:3000/assignRole", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: user.u_firstname,
          lastName: user.u_lastname,
          roleId: user.selectedRole,
          auditId: auditId,
        }),
      }).then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.message || `Fehler bei ${user.u_firstname}`);
          });
        }
        return res.json();
      })
    );

    await Promise.all(assignRequests);

    // Aktualisiere die Anzeige
    const newlyAssigned = toAssign.map((u) => ({
      ...u,
      ru_r_id: u.selectedRole,
    }));

    setAuditZugewiesen((prev) => [...prev, ...newlyAssigned]);

    alert("Benutzer erfolgreich zugewiesen.");
    setModalOpen(false);
  } catch (error: any) {
    console.error("Fehler beim Zuweisen:", error);
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

const filteredUnassignedUsers = users
  .filter((user) =>
    `${user.u_firstname} ${user.u_lastname}`.toLowerCase().includes(searchText.toLowerCase())
  )
  .filter(
    (user) =>
      !auditZugewiesen.some(
        (assigned) => assigned.u_userId === user.u_userId
      )
  );



  const changeStatus = async (auditId: number) => {
    const audit = audits.find((a) => a.au_idx === auditId);
    if (!audit) {
      console.error("Audit not found");
      return;
    }

    if (audit.au_auditstatus === "bereit") {
      try {
        const getQuestionsfromAudit = await fetch(`http://localhost:3000/audit/questions/${auditId}`,
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
            f_comment: "",
            f_finding_comment: "",
            f_implemented: 0,
            f_documented: 0,
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

  /** Exportiert alle Audits mit ihren Findings als PDF, indem es die Findings pro Audit nachlädt */
const exportAllAuditsAndFindingsToPDF = async () => {
  if (audits.length === 0) {
    alert("Keine Audits vorhanden.");
    return;
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  let pageCount = 1;

  for (let ai = 0; ai < audits.length; ai++) {
    const audit = audits[ai];

  if (y + 30 > pageHeight) {    
      doc.addPage();                 
      y = 20;                        
      pageCount++;                   
    }

    // 1) Findings live nachladen
    let relevantFindings: any[] = [];
    try {
      const resp = await fetch(
        `http://localhost:3000/findings/getall/${audit.au_idx}`,
        { method: "GET", credentials: "include" }
      );
      if (resp.ok) relevantFindings = await resp.json();
    } catch (e) {
      console.error("Fehler beim Laden der Findings für Audit", audit.au_idx, e);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(audit.au_theme, pageWidth / 2, y, { align: "center" });
    y += 7;

    // Trennlinie unter der Überschrift
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(15, y, pageWidth - 15, y);
    y += 8;

    doc.setFillColor(230, 230, 230);
    doc.rect(15, y, pageWidth - 30, 8, "F"); // gefülltes Rechteck
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Findings", 17, y + 5);
    y += 12;

    if (relevantFindings.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("Keine Findings vorhanden.", 17, y);
      y += 10;
    } else {
      for (let fi = 0; fi < relevantFindings.length; fi++) {
        const f = relevantFindings[fi];

        if (y > 270) {
          doc.addPage();
          pageCount++;
          y = 20;
        }

        doc.setFillColor(245, 245, 245);
        doc.rect(15, y - 2, pageWidth - 30, 16, "F");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const indent = 17;
        doc.setTextColor(0, 0, 0);
        doc.text(`${fi + 1}. ID: ${f.f_id}`, indent, y + 3);
        if (f.f_level && f.f_level > 0) {
          doc.text(`Level: ${f.f_level}`, indent + 40, y + 3);
        }
        doc.text(`Law: ${f.f_qu_question_idx.qu_law_law}`, indent + 80, y + 3);
        doc.text(
          `Kommentar: ${f.f_comment || "–"}`,
          indent,
          y + 8
        );

        y += 18;
      }
    }
    y+=12;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Seite ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  doc.save(`AlleAudits&Findings.pdf`);
};


  // Gefilterte Audits
  const displayedAudits = filteredAudits;

  return (
    <div className="flex flex-col w-full h-screen bg-white">
      <Navbar />
      <div className="flex-1 p-4 bg-white dark:bg-black mt-9">
        <div>
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
                  className="flex-1 overflow-y-auto border border-gray-300 dark:bg-gray-800 
                  rounded-md mb-4 max-h-[calc(6*4.8rem)] sm:max-h-[calc(6*4.8rem)]"
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
                              selectedAudit === null
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
                <div
                    className="w-full max-w-screen-lg h-full bg-gray-200 dark:bg-gray-900  p-6 rounded-md flex flex-col justify-start">
                 
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                      {selectedAuditData?.au_theme || "Audit nicht gefunden"}
                    </h2>
                    <StatusBadge status={selectedAuditData?.au_auditstatus || "unbekannt"} />
                  </div>

                  <AuditVorschau audit={selectedAudit} allAudits={audits} allUsers={users} />

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-b-lg">
                    <QuestionVorschau
  auditId={selectedAudit}
  questions={questions}
  auditStatus={selectedAuditData?.au_auditstatus || null}
/>

                    {isLeadAuditor && selectedAudit && (
                      <div className="my-4 flex justify-center">
                        <button
                          className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
                          onClick={() => setModalOpen(true)}
                        >
                          Personen hinzufügen
                        </button>
                      </div>
                    )}

                    <Modal isOpen={modalOpen} className="w-[600px] h-[520px] fixed rounded-md bg-white p-6 overflow-hidden">
                      <h2 className="text-lg font-bold mb-4">Benutzer zuweisen</h2>
                      <input
                        type="text"
                        placeholder="Suche Benutzer..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full p-2 border border-gray-400 rounded-md mb-4 text-black"
                      />
                      <div className="h-[320px] overflow-y-auto border border-gray-300 rounded-md mb-4 divide-y dark:border-gray-600">
                       {filteredUnassignedUsers.length === 0 ? (
  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
    Keine Benutzer gefunden
  </div>
) : (
  filteredUnassignedUsers.map((userItem) => (
    <div
      key={userItem.u_userId}
      className="flex items-center justify-between px-4 py-2"
    >
      <span className="dark:text-white">
        {userItem.u_firstname} {userItem.u_lastname}
      </span>
      <select
        className="p-1 border rounded text-black"
        value={userItem.selectedRole || ""}
        onChange={(e) => {
          const updatedUsers = users.map((u) =>
            u.u_userId === userItem.u_userId
              ? { ...u, selectedRole: Number(e.target.value) }
              : u
          );
          setUsers(updatedUsers);
        }}
      >
        <option value="">Rolle wählen</option>
        <option value="2">Auditor</option>
        <option value="3">Auditee</option>
        <option value="4">Gast</option>
        <option value="5">Reporter</option>
        <option value="6">Manual-Writer</option>
      </select>
    </div>
  ))
)}
                      </div>

                      <div className="flex justify-between">
                        <button
                          onClick={() => handleMehrereZuweisen(selectedAudit)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setModalOpen(false)}
                          className="px-4 py-2 bg-gray-300 text-black hover:bg-gray-400 rounded"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </Modal>
           
                  {/* Zugewiesene User anzeigen */}
                  {auditZugewiesen.length > 0 && (
                      <div className="my-4 text-center">
                        <h3 className="font-bold mb-2">Zugewiesene User:</h3>
                        <div className="max-h-20 overflow-y-auto">
                        <ul className="list-disc list-inside">
                          {auditZugewiesen.map((assignedUser) => (
                              <li key={assignedUser.u_userId} className="relative list-none">
                                <div className="text-center w-full">
                                  {assignedUser.u_firstname} {assignedUser.u_lastname}:{' '}
                                  {{
                                    1: 'Admin',
                                    3: 'Auditee',
                                    2: 'Auditor',
                                    4: 'Gast',
                                    6: 'Manual-Writer',
                                    5: 'Reporter',
                                  }[assignedUser.ru_r_id] || ''}
                                </div>
                              </li>

                          ))}
                        </ul>
                        </div>
                      </div>
                  )}

                    {/* Buttons unter der Fragenliste */}
                    <div className="flex justify-center space-x-4 mt-4">
                      {isAuditor && (auditstatus === "geplant" || auditstatus === "bereit") && (
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

                    {isLeadAuditor && selectedAudit && (
                        <button
                            onClick={() => (window.location.href = `/auditbearbeiten/${selectedAudit}`)}
                            className="px-4 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600"
                        >
                          Bearbeiten
                        </button>
                    )}

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
                  </div>


                </div>


            ) : null}

            {selectedAudit ? (
                <div>
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
      </div>
      <Footer/>
    </div>
  );
}
