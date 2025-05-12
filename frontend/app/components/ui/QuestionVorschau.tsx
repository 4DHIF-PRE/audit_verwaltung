import { useEffect, useState } from "react";
import { QuestionInt } from "../../types/QuestionInt";
import { Law } from "../../types/Law"; // definiere diesen Typ separat

interface Props {
  auditId: number;
  questions: QuestionInt[];
}

export default function QuestionVorschau({ auditId, questions }: Props) {
  const [updatedQuestions, setUpdatedQuestions] = useState<QuestionInt[]>(questions);
  const [auditStatus, setAuditStatus] = useState<string | null>(null);
  const [lawMap, setLawMap] = useState<Record<number, Law>>({});

  useEffect(() => {
    const fetchAuditStatus = async () => {
      try {
        const response = await fetch(`http://localhost:3000/audit/${auditId}`);
        const data = await response.json();
        if (data?.au_auditstatus) {
          setAuditStatus(data.au_auditstatus);
        }
      } catch (error) {
        console.error("Error fetching audit status:", error);
      }
    };

    if (auditId) {
      fetchAuditStatus();
    }
  }, [auditId]);

  useEffect(() => {
    setUpdatedQuestions(questions);
  }, [questions]);

  useEffect(() => {
    const fetchLaws = async () => {
      const uniqueLawIds = [...new Set(questions.map((q) => q.qu_law_idx))];
      const newLawMap: Record<number, Law> = {};

      for (const id of uniqueLawIds) {
        try {
          const response = await fetch(`http://localhost:3000/law/${id}`);
          const data = await response.json();
          if (data?.la_idx) {
            newLawMap[id] = data;
          }
        } catch (err) {
          console.error("Fehler beim Laden des Gesetzes", err);
        }
      }

      setLawMap(newLawMap);
    };

    if (questions.length > 0) {
      fetchLaws();
    }
  }, [questions]);

  const filteredQuestions = updatedQuestions.filter((q) => q.qu_audit_idx === auditId);

  const deleteQuestion = async (questionId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/questions/${questionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = "Fehler beim Löschen der Frage.";

        if (contentType?.includes("application/json")) {
          const errData = await response.json();
          errorMessage = errData.message || errorMessage;
        } else {
          errorMessage = await response.text();
        }

        throw new Error(errorMessage);
      }

      setUpdatedQuestions((prev) =>
        prev.filter((q) => q.qu_idx !== questionId)
      );
    } catch (err) {
      console.error("Error deleting question:", err);
      alert((err as Error).message || "Unbekannter Fehler.");
    }
  };

  return (
    <div className="flex-1 ml-6 p-4 rounded-md mb-16">
      {auditId === 0 ? (
        <p className="text-sm sm:text-base">
          Wähle ein Audit aus, um Fragen zu sehen.
        </p>
      ) : filteredQuestions.length > 0 ? (
        <div className="max-h-[300px] overflow-y-auto">
          <table className="table-auto w-full text-sm sm:text-base">
            <thead className="sticky top-0 z-10 bg-white dark:bg-gray-800 text-center">
              <tr>
                <th className="px-4 py-2">Gesetzestext NR</th>
                <th className="px-4 py-2">Auditiert</th>
                {auditStatus === "bereit" && (
                  <th className="px-4 py-2">Anwendbar</th>
                )}
                {(auditStatus === "begonnen" || auditStatus === "fertig") && (
                  <th className="px-4 py-2">Gesetzesinhalt</th>
                )}
                {auditStatus === "bereit" && (
                  <th className="px-4 py-2">Aktionen</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q) => {
                const law = lawMap[q.qu_law_idx];

                return (
                  <tr key={q.qu_idx} className="border-t text-center align-middle">
                    <td className="px-4 py-2 align-middle">{q.qu_law_idx}</td>
                    <td className="px-4 py-2 align-middle">{q.qu_audited ? "Ja" : "Nein"}</td>
                    {auditStatus === "bereit" && (
                      <td className="px-4 py-2 align-middle">{q.qu_applicable ? "Ja" : "Nein"}</td>
                    )}
                    {(auditStatus === "begonnen" || auditStatus === "fertig") && (
                      <td className="px-4 py-2 align-middle">
                        <div>{law?.la_text}</div>
                      </td>
                    )}
                    {auditStatus === "bereit" && (
                      <td className="px-4 py-2 align-middle">
                        <button
                          aria-label="Question löschen"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => deleteQuestion(q.qu_idx)}
                        >
                          ❌
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm sm:text-base">
          Keine Fragen für dieses Audit gefunden.
        </p>
      )}
    </div>
  );
}