import { useState, useEffect } from "react";
import Navbar from "app/components/Navbar";
import AuditFilter from "app/components/Filter";
import Question from "app/components/Question";
import { QuestionInt } from "../types/QuestionInt";
import { AuditInt } from "../types/AuditInt";

// Mock data
import mockAudits from "../../mockdata/audit.json";
import mockQuestions from "../../mockdata/questions.json";

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
