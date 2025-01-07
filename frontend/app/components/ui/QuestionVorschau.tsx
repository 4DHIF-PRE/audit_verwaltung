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
    try {
      // API-Anfrage an das Backend, um die Frage zu löschen
      const response = await fetch(`/questions/${questionId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setUpdatedQuestions((prevQuestions) =>
          prevQuestions.filter((q) => q.qu_idx !== questionId)  
        );
      } else {
        const data = await response.json();
        alert(`Error deleting question: ${data.message}`);
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("An error occurred while deleting the question.");
    }
  };

  useEffect(() => {
    setUpdatedQuestions(questions);
  }, [questions]); 

  return (
    <div className="flex-1 ml-6 bg-gray-200 p-4 rounded-md">
      {auditId === 0 ? (
        <p>Wähle ein Audit aus, um Fragen zu sehen.</p>
      ) : filteredQuestions.length > 0 ? (
        <table className="table-auto w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Law ID</th>
              <th>Audited</th>
              <th>Applicable</th>
              <th>Finding Level</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.map((q) => (
              <tr key={q.qu_idx}>
                <td>{q.qu_idx}</td>
                <td>{q.qu_law_idx}</td>
                <td>{q.qu_audited ? "Yes" : "No"}</td>
                <td>{q.qu_applicable ? "Yes" : "No"}</td>
                <td>{q.qu_finding_level ?? "N/A"}</td>
                <td>
                  <button onClick={() => deleteQuestion(q.qu_idx)}>❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Keine Fragen für dieses Audit gefunden.</p>
      )}
    </div>
  );
}
