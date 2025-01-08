import { useState, useEffect } from "react";

// Interfaces
export interface QuestionInt {
  qu_idx: number;
  qu_audit_idx: number;
  qu_law_idx: number;
  qu_audited: boolean;
  qu_applicable: boolean;
  qu_finding_level: number;
}

export default function Question({ question }: { question: QuestionInt }) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [auditorComment, setAuditorComment] = useState("");
  const [findingComment, setFindingComment] = useState("");
  const [law, setLaw] = useState({ law: "", type: "", text: "" });
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        // Fetch the findings data from the API
        const findingResponse = await fetch(`http://localhost:3000/api/audit/findings/${question.qu_idx}`);//${question.qu_idx}
        const findings = await findingResponse.json();

        // Log the findings to inspect the data structure
        console.log(findings);

        if (findings && findings.length > 0) {
          const finding = findings[0]; // Get the first finding

          // Fetch the laws data from the API
          const lawResponse = await fetch(`http://localhost:3000/law/${question.qu_law_idx}`); //${question.qu_law_idx}
          const lawDetails = await lawResponse.json();

          // Update state with fetched data
          if (lawDetails) {
            setLaw({
              law: lawDetails.la_law,
              type: lawDetails.la_typ,
              text: lawDetails.la_text,
            });
          }

          // Set finding details (with additional null/undefined checks)
          if (finding.f_level !== undefined) {
            setSelectedStatus(finding.f_level.toString());
          }
          setAuditorComment(finding.f_comment || ""); // Use nullish coalescing to handle null values
          setFindingComment(finding.f_finding_comment || "");
        } else {
          console.log("No findings available.");
          // Handle case when no findings are returned
          setSelectedStatus("");
          setAuditorComment("");
          setFindingComment("");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [question]);

  const handleSave = () => {
    const updatedFinding = {
      status: selectedStatus,
      auditorComment,
      findingComment,
      files,
    };
    console.log("Saving Finding:", updatedFinding);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    setFiles((prevFiles) => [
      ...prevFiles,
      ...Array.from(droppedFiles),
    ]);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (files) {
      setFiles((prevFiles) => [
        ...prevFiles,
        ...Array.from(files),
      ]);
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles(files.filter((file) => file !== fileToRemove));
  };

  // Background color logic
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

      {/* File Upload Section */}
      <div
        className="flex items-center justify-center w-full mb-4"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <label
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              SVG, PNG, JPG, or GIF (MAX. 800x400px)
            </p>
          </div>
          <input
            id="dropzone-file"
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* File Display Section */}
      <div className="space-y-4">
        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md">
            <span className="text-gray-900 dark:text-white">{file.name}</span>
            <button
              onClick={() => handleRemoveFile(file)}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded-md focus:outline-none"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        id="saveQuestion"
        type="button"
        onClick={handleSave}
        className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-md shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 pt-2 pb-2 pl-5 pr-5 mt-4"
      >
        Speichern
      </button>
    </div>
  );
}
