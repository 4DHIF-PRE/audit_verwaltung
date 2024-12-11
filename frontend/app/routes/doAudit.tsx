import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import AuditFilter from "../components/g4/Filter";
import Question from "../components/g4/Question";

//Interfaces
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

// Mock data
import mockAudits from "../../testdata/g4/audit.json";
import mockQuestions from "../../testdata/g4/questions.json";

export default function App() {
  const [audit, setAudit] = useState<AuditInt>();
  const [questions, setQuestions] = useState<QuestionInt[]>([]);
  const [loading, setLoading] = useState(true);

  // Load audit data and corresponding questions
  useEffect(() => {
    const loadAuditData = async () => {
      setLoading(true);

      const currentAudit = mockAudits.find((audit) => audit.au_idx === 101);
      setAudit(currentAudit);

      const auditQuestions = mockQuestions.filter(
        (question) => question.qu_audit_idx === currentAudit?.au_idx
      );
      setQuestions(auditQuestions);

      setLoading(false);
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
    </div>
  );
}
