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
  const [selectedLaw, setSelectedLaw] = useState<string | null>(null);
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

  const handleSave = async () => {
    if (!selectedLaw) {
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qu_audit_idx: auditId,
          qu_law_idx: selectedLaw,
          qu_audited: fields.audited,
          qu_applicable: fields.applicable,
          qu_finding_level: 0,
          qu_idx: nextQuestionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error saving question");
      }

      navigate("/auditpage"); // <-- Hier korrekt aufrufen
    } catch (error) {
      console.error("Save question failed:", error);
    }
  };

  return (
    <div className="flex flex-col w-full h-screen p-4 bg-white space-y-6 dark:bg-gray-900 dark:text-white">
      {/* Render the Navbar */}
      <Navbar />

      {/* Header */}
      <div className="text-center font-bold text-2xl">
        Question Page {auditId}
      </div>

      {/* Search Section */}
      <div className="flex justify-center">
        <input
          type="text"
          placeholder="Search Laws..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="p-2 border border-gray-400 rounded-md w-1/2 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Filter by Law Type */}
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

      {/* Gesetze anzeigen */}
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
              checked={selectedLaw === law.la_idx.toString()}
              onChange={() => setSelectedLaw(law.la_idx.toString())}
              className="w-5 h-5"
            />
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <button
          className="px-6 py-2 text-white font-bold rounded-md"
          style={{ backgroundColor: "#9166cc" }}
          onClick={handleSave}
          disabled={!selectedLaw}
        >
          Save
        </button>
      </div>
    </div>
  );
}