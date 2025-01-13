import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { Navbar } from "../components/Navbar";

interface Law {
  la_idx: number;
  la_law: string;
  la_typ: string;
  la_description: string;
  la_text: string;
  la_valid_from: string;
  la_valid_until: string;
}

interface Question {
  qu_idx: number;
  qu_audit_idx: string;
  qu_law_idx: string; 
  qu_audited: boolean;  
  qu_applicable: boolean;
  qu_finding_level: number;
}

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;
  const response = await fetch("http://localhost:3000/law");
  if (!response.ok) {
    throw new Response("Failed to load laws", { status: 500 });
  }
  const laws: Law[] = await response.json();

  const questionsResponse = await fetch("http://localhost:3000/questions");
  if (!questionsResponse.ok) {
    throw new Response("Failed to load questions", { status: 500 });
  }
  const questions: Question[] = await questionsResponse.json();

  const usedIds = new Set(questions.map((question) => question.qu_idx));
  let nextId = 0;
  while (usedIds.has(nextId)) {
    nextId++;
  }

  return json({ auditId: id, laws, nextQuestionId: nextId });
};

export default function AuditPage() {
  const { auditId, laws, nextQuestionId } = useLoaderData<{
    auditId: string;
    laws: Law[];
    nextQuestionId: number;
  }>();
  const [searchText, setSearchText] = useState("");
  const [selectedLaws, setSelectedLaws] = useState<string[]>([]);
  const [fields, setFields] = useState({
    audited: false,
    applicable: false,
  });

  const [selectedType, setSelectedType] = useState<string>("");
  const navigate = useNavigate();

  const filteredLaws = laws.filter((law) => {
    const lawText = law.la_text.toLowerCase();
    const searchTextLower = searchText.toLowerCase().trim();

    const matchesSearch = lawText.includes(searchTextLower);
    const matchesType = selectedType === "" || law.la_typ === selectedType;

    return matchesSearch && matchesType;
  });

  const handleCheckboxChange = (lawId: string) => {
    setSelectedLaws((prevSelected) =>
      prevSelected.includes(lawId)
        ? prevSelected.filter((id) => id !== lawId)
        : [...prevSelected, lawId]
    );
  };

  const handleSave = async () => {
    if (selectedLaws.length === 0) {
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:3000/questions`);
      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Failed to load existing questions: ${errorResponse.message}`);
      }
  
      const existingQuestions: Question[] = await response.json();
      const existingLawIds = new Set(
        existingQuestions
          .filter((question) => question.qu_audit_idx === auditId)
          .map((question) => question.qu_law_idx.toString())
      );
  
      const newLaws = selectedLaws.filter(
        (lawId) => !existingLawIds.has(lawId)
      );
  
      if (newLaws.length === 0) {
        alert("These laws are already added for this audit.");
        return;
      }
  
      const newQuestions = newLaws.map((lawId) => ({
        qu_audit_idx: auditId,
        qu_law_idx: lawId,
        qu_audited: fields.audited,
        qu_applicable: fields.applicable,
        qu_finding_level: 0,
      }));
  
      const saveResponse = await fetch("http://localhost:3000/questions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newQuestions),
      });
  
      if (!saveResponse.ok) {
        const errorResponse = await saveResponse.json();
        throw new Error(`Failed to save new questions: ${errorResponse.message}`);
      }
  
      const auditQuestions = existingQuestions.filter(
        (question) => question.qu_audit_idx === auditId
      );

      if(auditQuestions.length === 0){
        const updateResponse = await fetch(`http://localhost:3000/audit/${auditId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ au_auditstatus: "begonnen" }),
        });
  
        if (!updateResponse.ok) {
          const errorResponse = await updateResponse.json();
          throw new Error(`Failed to update audit status: ${errorResponse.message}`);
        }
      }
      navigate("/auditpage");
  
    } catch (error) {
      console.error("Error saving questions:", error);
      // @ts-ignore
      alert(`An error occurred while saving the questions: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col w-full h-screen p-4 bg-white space-y-6 dark:bg-gray-900 dark:text-white">
      <Navbar />
      <div className="text-center font-bold text-2xl">
        Question Page {auditId}
      </div>
      <div className="flex justify-center">
        <input
          type="text"
          placeholder="Search Laws..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="p-2 border border-gray-400 rounded-md w-1/2 dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div className="flex justify-center mt-4">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="p-2 border border-gray-400 rounded-md w-1/2 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Types</option>
          <option value="r">r</option>
          <option value="amc">amc</option>
          <option value="gm">gm</option>
        </select>
      </div>
      <div className="border border-gray-400 rounded-md w-full max-h-64 overflow-y-auto dark:border-gray-600">
        {filteredLaws.map((law) => (
          <div
            key={law.la_idx}
            className="flex items-center justify-between border-b border-gray-300 p-2 dark:border-gray-600"
          >
            <div className="font-bold text-gray-700 dark:text-white">
              {law.la_text}
            </div>
            <input
              type="checkbox"
              checked={selectedLaws.includes(law.la_idx.toString())}
              onChange={() => handleCheckboxChange(law.la_idx.toString())}
              className="w-5 h-5"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <button
          className="px-6 py-2 text-white bg-purple-500 font-bold rounded-md"
          onClick={handleSave}
          disabled={selectedLaws.length === 0}
        >
          Save
        </button>
      </div>
    </div>
  );
}
