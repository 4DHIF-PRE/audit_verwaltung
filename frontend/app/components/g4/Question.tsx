import { useState, useEffect, useRef } from "react";

// Interfaces
export interface QuestionInt {
  qu_idx: number;
  qu_audit_idx: number;
  qu_law_idx: number;
  qu_law_text: string;
  qu_law_law: string;
  qu_audited: boolean;
  qu_applicable: boolean;
  qu_finding_level: number;
}

export interface FileInt {
  fa_id: number;
  fa_file: File;
}

interface QuestionProps {
  question: QuestionInt;
  onChange: () => void;
}

export default function Question({ question, onChange }: { question: QuestionInt }) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [auditorComment, setAuditorComment] = useState("");
  const [findingComment, setFindingComment] = useState("");

  const [law, setLaw] = useState({ law: "", type: "", text: "" });
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<string[]>([]); // Store filenames as strings
  const [fileData, setFileData] = useState<File[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [findingId, setFindingId] = useState(-1);
  const fetchedOnceRef = useRef(false);


  // Load data from API
  useEffect(() => {
    if (fetchedOnceRef.current) return; 

    fetchedOnceRef.current = true;
    const loadData = async () => {
      setLoading(true);
      console.log("onload");
      try {
        // Fetch the findings data from the API (assuming only one finding is returned)
        const findingResponse = await fetch(
          `http://localhost:3000/api/questions/${question.qu_idx}/finding`
        );
        const finding = await findingResponse.json(); // Expecting a single finding object

        // Log the findings to inspect the data structure

        if (finding) {
          // Fetch the laws data from the API
          setFindingId(finding.f_id);
          const lawResponse = await fetch(
            `http://localhost:3000/law/${question.qu_law_idx}`
          );
          const lawDetails = await lawResponse.json();

          // Update state with fetched data
          if (lawDetails) {
            setLaw({
              law: lawDetails.la_law,
              type: lawDetails.la_typ,
              text: lawDetails.la_text,
            });
          }
          question.qu_law_law=lawDetails.la_law;
          question.qu_law_text=lawDetails.la_text;


          if (finding.f_status !== undefined) {
            setSelectedStatus(finding.f_status.toString());
          }
          setAuditorComment(finding.f_comment || "");
          setFindingComment(finding.f_finding_comment || "");
        } else {
          console.log("No finding available.");
          setSelectedStatus("");
          setAuditorComment("");
          setFindingComment("");
        }
        if (finding) {
          const attachmentsResponse = await fetch(
            `http://localhost:3000/api/finding/attachments/${finding.f_id}/filenames`
          );
          const attachments = await attachmentsResponse.json();
          //console.log("attach");
          //console.log(attachments);

          /*if (attachments.fileName) {
          const filesReturned = attachments.fileName.map(
            (fileObj: { fa_file: { data: number[] }; fa_filename: string }) => {
              const bufferData = new Uint8Array(fileObj.fa_file.data); // Convert data array to Uint8Array
              const blob = new Blob([bufferData]); // Create a Blob
              const filetoAdd = new File([blob], fileObj.fa_filename); // Create a File from the Blob
              return filetoAdd;
            }
          );

          setFileData(filesReturned); // Store files in state if you're using React
        } else {
          console.error("Unexpected response format:", attachments);
        }*/

          // Extract filenames from the API response
          const filenames = attachments.fileName.map(
            (file: { fa_filename: string }) => file.fa_filename
          );
          //console.log(filenames);
          setFiles((prevFiles) =>
            Array.from(new Set([...prevFiles, ...filenames]))
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [question]);


  const handleSave = async () => {
    try {
      document.getElementById("saveQuestion").style.visibility = "hidden";
      if (findingId == -1) setFindingId(10);
      console.log(findingId);

      const findingResponse = await fetch(
        `http://localhost:3000/api/questions/${question.qu_idx}/finding`
      );
      const finding = await findingResponse.json();
      const updatedFinding = {
        f_id: finding.f_id,
        f_level: finding.f_level,
        f_auditor_comment: auditorComment.replace(/;/g, ""),
        f_finding_comment: findingComment.replace(/;/g, ""),
        f_creation_date: finding.f_creation_date,
        f_timeInDays: finding.f_timeInDays,
        f_status: selectedStatus,
      };

      const alteredFinding = JSON.parse(
        JSON.stringify(updatedFinding, (key, value) => {
          return typeof value === "string" ? value.replace(/;/g, "") : value;
        })
      );

      const result = await fetch(`http://localhost:3000/audit/finding`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alteredFinding),
      });
      const attachmentsResponse = await fetch(
        `http://localhost:3000/api/finding/attachments/${findingId}/filenames`
      );
      const attachments = await attachmentsResponse.json();
      console.log(attachments);
      const existingFileNames = Array.isArray(attachments.fileName)
        ? attachments.fileName.map((file) => file.fa_filename)
        : [];
      if (existingFileNames.length === 0)
        console.log("List of API files is empty.");

      // Upload new files not already in existingFileNames
      const filesToUpload = fileData.filter(
        (file) => !existingFileNames.includes(file.name)
      );
      // Check if there are any files not already in API to be uploaded.
      // If not, skip invoking the API and evaluate finding save success.
      if (filesToUpload.length !== 0) {
        const formData = new FormData();
        //console.log(filesToUpload)
        for (const file of filesToUpload) {
          formData.append("file", file);

          const uploadResult = await fetch(
            `http://localhost:3000/api/finding/attachments/${findingId}/${encodeURIComponent(
              file.name
            )}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "multipart/form-data",
              },
              body: formData,
            }
          );
        }
        if (result.ok) {
          console.log("Finding saved successfully!");
          alert("Finding saved successfully!");
        }
      }
      // Evaluate result of saving finding when attachment uploads are skipped.
      else if (result.ok)
        alert("Finding saved successfully! No new attachments to save.");
      else {
        console.log("Failed to save finding: ", result);
        alert("Failed to save finding!");
      }
    } catch (error) {
      console.log("Error occured while attempting to save finding: ", error);
    } finally {
      console.log("Finished accessing API.");
      document.getElementById("saveQuestion").style.visibility = "visible";
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;

    // Extract filenames from the dropped files and update state with strings
    const filenames = Array.from(droppedFiles).map((file) =>
      file.name.replace(/;/g, "")
    );
    //filenames.concat(files);
    //console.log(filenames);
    setFiles((prevFiles) => Array.from(new Set([...prevFiles, ...filenames])));
    console.log(files);
    setFileData((prevFiles) =>
      Array.from(new Set([...prevFiles, ...Array.from(droppedFiles)]))
    );
  };

  //maby add a dupicat restriction on name?
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { filesChanged } = event.target;
    console.log(filesChanged);
    if (filesChanged) {
      // Extract filenames from the selected files and update state with strings
      const fileList = Array.from(filesChanged);
      const filenames = Array.from(filesChanged).map((file) =>
        file.name.replace(/;/g, "")
      );
      //filenames.concat(files);
      //console.log(tmp);
      setFiles((prevFiles) =>
        Array.from(new Set([...prevFiles, ...filenames]))
      );
      console.log(files);
      setFileData((prevFiles) =>
        Array.from(new Set([...prevFiles, ...fileList]))
      );
    }
  };

  const handleRemoveFile = async (fileToRemove: string) => {
    const removeButton = document.getElementById(`removeFile-${fileToRemove}`);
    try {
      
      if(removeButton){
        removeButton.disabled = true;
      }
    
      if (confirm(`Remove file ${fileToRemove}? This cannot be undone!`)) {
        setFiles(files.filter((file) => file !== fileToRemove));
       // console.log(files);
        setFileData((prevFiles) =>
          prevFiles.filter((file) => file.name !== fileToRemove)
        );

        if (findingId !== -1) {
          const attachmentsResponse = await fetch(
            `http://localhost:3000/api/finding/attachments/${findingId}/filenames`
          );
          const attachments = await attachmentsResponse.json();
          // console.log(attachments);
          // Get list of existing file names
          const existingFileNames = Array.isArray(attachments.fileName)
            ? attachments.fileName.map((file) => file.fa_filename)
            : [];
          if (existingFileNames.length === 0)
            console.log("List of API files is empty.");
          else {
            const fileReturned = attachments.fileName.find(file => file.fa_filename === fileToRemove)

            if(typeof fileReturned !== 'undefined' && fileReturned != null){
              // fileReturned shouldn't be null or undefined if the file you're trying to delete is in the database. 
              /* By design, the first file that was found with a matching file name will be removed.
              */
              const deleteResult = await fetch(`http://localhost:3000/api/finding/attachments/${fileReturned.fa_id}/delete`)
              if(deleteResult.ok) alert("File removed successfully!")
            }
          }
        }
      } else console.log("File delete aborted.");
    } catch (error) {
      console.log(error);
    } finally {
    if(removeButton) removeButton.disabled = false;
    }
  };

  const handleDownload = async (fileToDownload: string) => {
    const downloadButton = document.getElementById(
      `removeFile-${fileToDownload}`
    );
    if (downloadButton) {
      downloadButton.disabled = true;
    }
    try {
      if (findingId !== -1) {
        const attachmentsResponse = await fetch(
          `http://localhost:3000/api/finding/attachments/${findingId}/filenames`
        );
        const attachments = await attachmentsResponse.json();
        // console.log(attachments);
        // Get list of existing file names
        const existingFileNames = Array.isArray(attachments.fileName)
          ? attachments.fileName.map((file) => file.fa_filename)
          : [];
        if (existingFileNames.length === 0)
          console.log("List of API files is empty.");
        else {
          const fileReturned = attachments.fileName.find(
            (file) => file.fa_filename === fileToDownload
          );

          if (fileReturned) {
            // fileReturned shouldn't be null or undefined if the file you're trying to delete is in the database.
            /* By design, the first file that was found with a matching file name will be downloaded.
             */
            console.log("Preparing to fetch file for download...");
            const fileResult = await fetch(
              `http://localhost:3000/api/finding/attachments/${fileReturned.fa_id}`
            );
            const fileData = await fileResult.json();
            if (
              fileResult.ok &&
              fileData.fileName &&
              fileData.fileName.length > 0
            ) {
              console.log("File retrieved, preparing download...");

              const fileObject = fileData.fileName[0];
              const bufferData = new Uint8Array(fileObject.fa_file.data); // Binary data
              const fullBlob = new Blob([bufferData]); // Create a blob

              const reader = new FileReader();
              reader.onload = function () {
                const arrayBuffer = reader.result as ArrayBuffer;
                const byteArray = new Uint8Array(arrayBuffer);

                // Locate the first instance of "\r\n\r\n" (header-body separator)
                const separator = new TextEncoder().encode("\r\n\r\n");
                let startIndex = -1;

                for (let i = 0; i < byteArray.length - separator.length; i++) {
                  if (
                    separator.every(
                      (byte, index) => byteArray[i + index] === byte
                    )
                  ) {
                    startIndex = i + separator.length;
                    break;
                  }
                }

                if (startIndex !== -1) {
                  console.log("Found header separator at byte:", startIndex);

                  // Extract the actual file content after headers
                  const cleanContent = byteArray.slice(startIndex);

                  // Preserve the original file type (if detected)
                  const detectedType =
                    fileObject.fa_filename.split(".").pop() ||
                    "application/octet-stream";
                  const cleanBlob = new Blob([cleanContent], {
                    type: detectedType,
                  });

                  // Create download link
                  const url = window.URL.createObjectURL(cleanBlob);
                  const downloadLink = document.createElement("a");
                  downloadLink.href = url;
                  downloadLink.download = fileObject.fa_filename;
                  document.body.appendChild(downloadLink);
                  downloadLink.click();

                  // Cleanup
                  document.body.removeChild(downloadLink);
                  window.URL.revokeObjectURL(url);
                } else {
                  console.error(
                    "Could not locate file content in the multipart data."
                  );
                }
              };

              reader.readAsArrayBuffer(fullBlob);
            } else {
              console.error(
                "Failed to retrieve file content or file data structure is unexpected."
              );
            }
          }
          else console.warn("File not found on the server. Are you trying to download a local file?")
        }
      }
    } catch (error) {
      console.error("Error occurred while downloading file:", error);
    } finally {
      if (downloadButton) downloadButton.disabled = false;
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Background color logic
  let bgColorClass = "bg-gray-100 dark:bg-gray-800";
  if (selectedStatus === "richtig") {
    bgColorClass = "bg-green-100 dark:bg-green-800";
  } else if (selectedStatus === "kritisch") {
    bgColorClass = "bg-red-100 dark:bg-red-800";
  } else if (selectedStatus === "dokumentiert") {
    bgColorClass = "bg-yellow-100 dark:bg-yellow-800";
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`p-6 ${bgColorClass} rounded-lg shadow-md`}>
      {/* Gesetz und Typ (immer sichtbar) */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {law.law} #{law.type}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{law.text}</p>
        </div>

        {/* Toggle Button mit Icon */}
        <button
          onClick={toggleCollapse}
          className="flex items-center space-x-2 text-black font-medium rounded-md focus:outline-none pt-2 pb-2 pl-4 pr-4"
        >
          <img
            src="../assets/klappicon.png"
            alt="Collapse Icon"
            className={`w-5 h-5 dark:invert transition-transform ${
              isCollapsed ? "rotate-0" : "rotate-180"
            }`}
          />
        </button>
      </div>

      {!isCollapsed && (
        <>
          <form className="max-w-sm mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Status
            </label>
            <select
              id="status"
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                onChange(); 
              }}
              value={selectedStatus}
              className="border rounded-lg p-2.5 text-gray-700 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="offen">Frage bewerten</option>
              <option value="richtig">Keine Findings</option>
              <option value="dokumentiert">Nur dokumentiert</option>
              <option value="kritisch">Kritisches Finding</option>
            </select>
          </form>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Auditor Kommentar
            </label>
            <textarea
              id="auditorComment"
              value={auditorComment}
              onChange={(e) => {
                setAuditorComment(e.target.value); 
                onChange();
              }}
              className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Write your thoughts here..."
            ></textarea>
          </div>

          {(selectedStatus === "dokumentiert" ||
            selectedStatus === "kritisch") && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Finding Kommentar
              </label>
              <textarea
                id="findingComment"
                value={findingComment}
                onChange={(e) => {
                  setFindingComment(e.target.value); 
                  onChange();
                }}
                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Write your thoughts here..."
              ></textarea>
            </div>
          )}

          <div
            className="flex items-center justify-center w-full mb-4"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
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
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
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

          <div className="space-y-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md"
              >
                <span className="text-gray-900 dark:text-white flex-1 truncate">
                  {file}
                </span>

                <div className="flex space-x-2">
                  <button
                    id={`downloadFile-${file}`}
                    type="button"
                    onClick={() => handleDownload(file)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded-md focus:outline-none"
                  >
                    Download
                  </button>

                  <button
                    id={`removeFile-${file}`}
                    type= "button"
                    onClick={() => handleRemoveFile(file)}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded-md focus:outline-none"
                  >
                    Remove
                  </button>
                </div>
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
        </>
      )}
    </div>
  );
}
