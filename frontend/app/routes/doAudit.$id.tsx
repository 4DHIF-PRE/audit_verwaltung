import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import AuditFilter from "../components/g4/Filter";
import Question from "../components/g4/Question";
import { useParams } from "@remix-run/react";

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
  au_auditstatus: string;
  au_place: string;
  au_theme: string;
  au_typ: string;
}

export default function App() {
  const { id } = useParams();
  const [audit, setAudit] = useState<AuditInt>();
  const [questions, setQuestions] = useState<QuestionInt[]>([]);
  const [questionsfiltern, setQuestionsfiltern] = useState<QuestionInt[]>([]);
  const [loading, setLoading] = useState(true);

  // Load audit data and corresponding questions
  useEffect(() => {
    const loadAuditData = async () => {
      setLoading(true);

      try {
        // Fetch audit data from the API (replace URL with your API endpoint)
        const auditResponse = await fetch(`http://localhost:3000/audit/${id}`);
        const currentAudit = await auditResponse.json();
        setAudit(currentAudit);

        // Fetch corresponding questions for the audit (replace URL with your API endpoint)
        const questionsResponse = await fetch(`http://localhost:3000/audit/questions/${id}`);//${currentAudit?.au_idx}
        const auditQuestions = await questionsResponse.json();
        setQuestions(auditQuestions);
        setQuestionsfiltern(auditQuestions)
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAuditData();
  }, []);

  const handleSave = async () => {
    window.location.href = `/gruppe5`;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <div className="sticky top-0 z-20">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-grow h-full">
        {/* Sticky Filter */}
        <div className="sticky top-[4rem] bg-white dark:bg-black z-10 shadow-md p-4">
          <AuditFilter  />
        </div>

        {/* Scrollable Questions */}
        <main className="flex-grow overflow-y-auto p-10 bg-white dark:bg-black">
          <div className="mt-5 px-10">
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

        {/* Sticky Save Button */}
        <div className="sticky bottom-0 bg-white dark:bg-black z-10 shadow-md p-4">
          <button
            id="saveAudit"
            type="button"
            onClick={handleSave}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium rounded-md shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 pt-2 pb-2"
          >
            Audit speichern
          </button>
        </div>
      </div>
    </div>
  );
}
