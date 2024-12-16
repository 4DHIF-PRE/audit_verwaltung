import { useState, useEffect } from "react";
// Mock data
import mockFindings from "../../mockdata/findings.json";
import mockQuestions from "../../mockdata/questions.json";
import mockLaws from "../../mockdata/laws.json";
import { QuestionInt } from "../types/QuestionInt";

export default function Question({ question }: { question: QuestionInt }) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [auditorComment, setAuditorComment] = useState("");
  const [findingComment, setFindingComment] = useState("");
  const [law, setLaw] = useState({ law: "", type: "", text: "" });
  const [loading, setLoading] = useState(true);

  // Load mock data based on the passed question
  useEffect(() => {
    const loadMockData = async () => {
      setLoading(true);

      const finding = mockFindings.find(
        (f) => f.f_qu_question_idx === question.qu_idx
      );

      const lawDetails = mockLaws.find((l) => l.la_idx === question.qu_law_idx);

      console.log(question)
      if (lawDetails) {
        setLaw({
          law: lawDetails.la_law,
          type: lawDetails.la_typ,
          text: lawDetails.la_text,
        });
        if (finding) {
          setSelectedStatus(finding.f_level.toString());
          setAuditorComment(finding.f_auditor_comment);
          setFindingComment(finding.f_finding_comment);
        }
      } else {
        setSelectedStatus("");
        setAuditorComment("");
        setFindingComment("");
      }
      setLoading(false);
    };

    loadMockData();
  }, [question]);

  // Save the finding data
  const handleSave = () => {
    const updatedFinding = {
      status: selectedStatus,
      auditorComment,
      findingComment,
    };
    console.log("Saving Finding:", updatedFinding);
    // await fetch(`/api/findings/${findingId}`, { method: 'PUT', body: JSON.stringify(updatedFinding) })
  };

  // Hintergrund
  let bgColorClass = "bg-gray-100 dark:bg-gray-800";
  if (selectedStatus === "1") {
    bgColorClass = "bg-green-100 dark:bg-green-800";
  } else if (selectedStatus === "3") {
    bgColorClass = "bg-red-100 dark:bg-red-800";
  } else if (selectedStatus === "2") {
    bgColorClass = "bg-yellow-100 dark:bg-yellow-800";
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`p-6 ${bgColorClass} rounded-lg shadow-md`}>
      <h1 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        {law.law} #{law.type}
      </h1>
      <h5 className="text-m font-semibold mb-4 text-gray-800 dark:text-gray-200">
        {law.text}
      </h5>

      <form className="max-w-sm mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Status
        </label>
        <select
          id="status"
          onChange={(e) => setSelectedStatus(e.target.value)}
          value={selectedStatus}
          className="border rounded-lg p-2.5 text-gray-700 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="0">Frage bewerten</option>
          <option value="1">Keine Findings</option>
          <option value="2">Nur dokumentiert</option>
          <option value="3">Kritisches Finding</option>
        </select>
      </form>

      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Auditor Kommentar
        </label>
        <textarea
          id="auditorComment"
          value={auditorComment}
          onChange={(e) => setAuditorComment(e.target.value)}
          className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Write your thoughts here..."
        ></textarea>
      </div>

      {(selectedStatus === "2" || selectedStatus === "3") && (
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Finding Kommentar
          </label>
          <textarea
            id="findingComment"
            value={findingComment}
            onChange={(e) => setFindingComment(e.target.value)}
            className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Write your thoughts here..."
          ></textarea>
        </div>
      )}
    </div>
  );
}
