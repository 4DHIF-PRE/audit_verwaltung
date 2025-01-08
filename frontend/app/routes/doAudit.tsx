import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import AuditFilter from "../components/g4/Filter";
import Question from "../components/g4/Question";

// Interfaces
export interface QuestionInt {
  qu_idx: number;
  qu_audit_idx: number;
  qu_law_idx: number;
  qu_audited: boolean;
  qu_applicable: boolean;
  qu_finding_level: number;
}
export interface AuditInt {
  au_idx: number;
  au_audit_date: string;
  au_number_of_days: number;
  au_leadauditor_idx: number;
  au_leadauditee_idx: number;
  au_auditstatus: string;
  au_place: string;
  au_theme: string;
  au_typ: string;
}

export default function App() {
  const [audit, setAudit] = useState<AuditInt>();
  const [questions, setQuestions] = useState<QuestionInt[]>([]);
  const [loading, setLoading] = useState(true);

  // Load audit data and corresponding questions
  useEffect(() => {
    const loadAuditData = async () => {
      setLoading(true);

      try {
        // Fetch audit data from the API (replace URL with your API endpoint)
        const auditResponse = await fetch("http://localhost:3000/audit/15");
        const currentAudit = await auditResponse.json();
        setAudit(currentAudit);

        // Fetch corresponding questions for the audit (replace URL with your API endpoint)
        const questionsResponse = await fetch(`http://localhost:3000/audit/questions/15`);//${currentAudit?.au_idx}
        const auditQuestions = await questionsResponse.json();
        setQuestions(auditQuestions);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAuditData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex-grow p-10 bg-white dark:bg-black">
        <AuditFilter />
        <div className="mt-5 px-10">
          {/* Render questions */}
          {questions.length > 0 ? (
            questions.map((question) => (
              <div className="mt-3" key={question.qu_idx}>
                <Question question={question} />
              </div>
            ))
          ) : (
            <div>No questions found for this audit.</div>
          )}
        </div>
      </main>

      <button
        id="saveAudit"
        type="button"
        onClick={() => window.location.href = `/gruppe5`}
        className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-md shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 pt-2 pb-2 pl-5 pr-5"
      >
        Audit speichern
      </button>
    </div>
  );
}