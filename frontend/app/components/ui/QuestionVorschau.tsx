import { useEffect, useState } from "react";
import { QuestionInt } from "../../types/QuestionInt";

interface Props {
  auditId: number;
  questions: QuestionInt[];
}

export default function QuestionVorschau({ auditId, questions }: Props) {
  const [updatedQuestions, setUpdatedQuestions] = useState<QuestionInt[]>(questions);

  const filteredQuestions = updatedQuestions.filter((q) => q.qu_audit_idx === auditId);

  const deleteQuestion = async (questionId: number) => {
    const controller = new AbortController();

    try {
      const response = await fetch(`http://localhost:3000/questions/${questionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = "An error occurred while deleting the question.";

        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          errorMessage = data.message || errorMessage;
        } else {
          errorMessage = await response.text();
        }

        throw new Error(errorMessage);
      }

      setUpdatedQuestions((prevQuestions) =>
        prevQuestions.filter((q) => q.qu_idx !== questionId)
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("Delete request aborted");
      } else {
        console.error("Error deleting question:", error);
        alert((error as Error).message || "An unexpected error occurred.");
      }
    }
  };

  // Update the state when the questions prop changes
  useEffect(() => {
    setUpdatedQuestions(questions);
  }, [questions]);

  return (
      <div className="flex-1 ml-6 p-4 rounded-md">
        {auditId === 0 ? (
            <p className="text-sm sm:text-base">Wähle ein Audit aus, um Fragen zu sehen.</p>
        ) : filteredQuestions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table-auto w-full text-sm sm:text-base">
                <thead className="text-left">
                <tr>
                  <th>Gesetzestext NR</th>
                  <th>Auditiert</th>
                  <th>Anwendbar</th>
                  <th>Finding Stufe</th>
                  <th>Möglichkeiten</th>
                </tr>
                </thead>
                <tbody>
                {filteredQuestions.map((q) => (
                    <tr key={q.qu_idx} className="border-t">
                      <td>{q.qu_law_idx}</td>
                      <td>{q.qu_audited ? "Ja" : "Nein"}</td>
                      <td>{q.qu_applicable ? "Ja" : "Nein"}</td>
                      <td>{q.qu_finding_level ?? "N/A"}</td>
                      <td>
                        <button
                            className="text-red-500 hover:text-red-700"
                            onClick={() => deleteQuestion(q.qu_idx)}
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        ) : (
            <p className="text-sm sm:text-base">Keine Fragen für dieses Audit gefunden.</p>
        )}
      </div>
  );
}