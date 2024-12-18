import { useEffect, useState } from "react";
import { QuestionInt } from "../../types/QuestionInt";


interface Props {
  auditId: number; 
  questions: QuestionInt[];
}

export default function QuestionVorschau({ auditId, questions }: Props) {
    return (
      <div className="flex-1 ml-6 bg-gray-200 p-4 rounded-md">
        {
        auditId === 0 ? (
          <p>Wähle ein Audit aus, um Fragen zu sehen.</p>
        ) : questions.length > 0 ? (
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
            <tbody>{questions.map((q) => (
              <tr key={q.qu_idx}>
                <td>{q.qu_idx}</td>
                <td>{q.qu_law_idx}</td>
                <td>{q.qu_audited ? "Yes" : "No"}</td>
                <td>{q.qu_applicable ? "Yes" : "No"}</td>
                <td>{q.qu_finding_level ?? "N/A"}</td>
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
