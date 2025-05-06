import {useState, useEffect, useRef} from "react";

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

export default function Question({question, onChange}: { question: QuestionInt }) {
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedLevel, setSelectedLevel] = useState(0);
    const [auditorComment, setAuditorComment] = useState("");
    const [findingComment, setFindingComment] = useState("");

    const [law, setLaw] = useState({law: "", type: "", text: ""});
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState<string[]>([]); // Store filenames as strings
    const [fileData, setFileData] = useState<{ name: string; content: string }[]>([]);
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
                    question.qu_law_law = lawDetails.la_law;
                    question.qu_law_text = lawDetails.la_text;

                    if (finding.f_status !== undefined) {
                        setSelectedStatus(finding.f_status.toString());
                    }
                    setSelectedLevel(finding.f_level || 0);
                    setAuditorComment(finding.f_comment || "");
                    setFindingComment(finding.f_finding_comment || "");

                } else {
                    console.log("No finding available.");
                    setSelectedStatus("");
                    setAuditorComment("");
                    setFindingComment("");
                    setSelectedLevel(0);
                }

                if (finding) {
                    const attachmentsResponse = await fetch(
                        `http://localhost:3000/api/finding/attachments/${finding.f_id}/filenames`
                    );
                    const attachments = await attachmentsResponse.json();

                    const filenames = attachments.fileName.map(
                        (file: { fa_filename: string }) => file.fa_filename
                    );
                    console.log(filenames);
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

            const result = await fetch("...PUT für Finding...");
            if (result.ok) {
                alert("Finding erfolgreich gespeichert!");
            } else {
                alert("Fehler beim Speichern des Findings!");
            }
        } catch (error) {
            console.error("Fehler beim Speichern:", error);
            alert("Fehler beim Speichern des Findings.");
        } finally {
            document.getElementById("saveQuestion").style.visibility = "visible";
        }
    };


    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);

        for (const file of droppedFiles) {
            try {
                const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);

                const formBodyParts = [
                    `--${boundary}`,
                    `Content-Disposition: form-data; name="file"; filename="${file.name}"`,
                    `Content-Type: ${file.type || "application/octet-stream"}`,
                    ``,
                ];

                const formFooter = `\r\n--${boundary}--\r\n`;

                const fileBuffer = await file.arrayBuffer();
                const bodyPrefix = new TextEncoder().encode(formBodyParts.join("\r\n") + "\r\n");
                const bodySuffix = new TextEncoder().encode(formFooter);

                const fullBody = new Uint8Array(bodyPrefix.length + fileBuffer.byteLength + bodySuffix.length);
                fullBody.set(bodyPrefix, 0);
                fullBody.set(new Uint8Array(fileBuffer), bodyPrefix.length);
                fullBody.set(bodySuffix, bodyPrefix.length + fileBuffer.byteLength);

                const response = await fetch(
                    `http://localhost:3000/api/finding/attachments/${findingId}/${encodeURIComponent(file.name)}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": `multipart/form-data; boundary=${boundary}`,
                        },
                        body: fullBody,
                    }
                );

                if (!response.ok) {
                    const err = await response.json();
                    console.error("Fehler beim Hochladen:", err);
                    alert("Fehler beim Hochladen der Datei");
                    continue;
                }

                setFiles((prevFiles) => [...prevFiles, file.name]);
            } catch (error) {
                console.error("Fehler beim Verarbeiten der Datei:", error);
                alert("Fehler beim Verarbeiten oder Hochladen der Datei");
            }
        }
    };


    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = event.target.files;
        if (!fileList || fileList.length === 0) return;

        const selectedFiles = Array.from(fileList);

        for (const file of selectedFiles) {
            try {
                const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);

                const formBodyParts = [
                    `--${boundary}`,
                    `Content-Disposition: form-data; name="file"; filename="${file.name}"`,
                    `Content-Type: ${file.type || "application/octet-stream"}`,
                    ``,
                ];

                const formFooter = `\r\n--${boundary}--\r\n`;

                const fileBuffer = await file.arrayBuffer();
                const bodyPrefix = new TextEncoder().encode(formBodyParts.join("\r\n") + "\r\n");
                const bodySuffix = new TextEncoder().encode(formFooter);

                const fullBody = new Uint8Array(bodyPrefix.length + fileBuffer.byteLength + bodySuffix.length);
                fullBody.set(bodyPrefix, 0);
                fullBody.set(new Uint8Array(fileBuffer), bodyPrefix.length);
                fullBody.set(bodySuffix, bodyPrefix.length + fileBuffer.byteLength);

                const response = await fetch(
                    `http://localhost:3000/api/finding/attachments/${findingId}/${encodeURIComponent(file.name)}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": `multipart/form-data; boundary=${boundary}`,
                        },
                        body: fullBody,
                    }
                );

                if (!response.ok) {
                    alert(`Fehler beim Hochladen von ${file.name}`);
                    continue;
                }

                setFiles((prev) => [...prev, file.name]);
            } catch (error) {
                console.error("Upload-Fehler:", error);
                alert("Fehler beim Verarbeiten oder Hochladen der Datei.");
            }
        }

        event.target.value = "";
    };


    const handleRemoveFile = async (fileToRemove: string) => {
        const removeButton = document.getElementById(`removeFile-${fileToRemove}`);
        try {

            if (removeButton) {
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

                        if (typeof fileReturned !== 'undefined' && fileReturned != null) {
                            // fileReturned shouldn't be null or undefined if the file you're trying to delete is in the database.
                            /* By design, the first file that was found with a matching file name will be removed.
                            */
                            const deleteResult = await fetch(`http://localhost:3000/api/finding/attachments/${fileReturned.fa_id}/delete`)
                            if (deleteResult.ok) alert("File removed successfully!")
                        }
                    }
                }
            } else console.log("File delete aborted.");
        } catch (error) {
            console.log(error);
        } finally {
            if (removeButton) removeButton.disabled = false;
        }
    };


    const handleDownload = async (fileName: string, findingId: number) => {
        try {
            const listResponse = await fetch(`http://localhost:3000/api/finding/attachments/${findingId}/filenames`);
            const json = await listResponse.json();
            const fileList = json.fileName;

            const match = fileList.find((f) => f.fa_filename === fileName);
            if (!match || !match.fa_id) {
                alert("Anhang nicht gefunden.");
                return;
            }

            const response = await fetch(`http://localhost:3000/api/finding/attachments/${match.fa_id}`);

            if (!response.ok) {
                throw new Error("Datei konnte nicht geladen werden.");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download-Fehler:", err);
            alert("Beim Download der Datei ist ein Fehler aufgetreten.");
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
        <div className={`p-6 ${bgColorClass} rounded-lg mt-1 shadow-md`}>
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
                    <div className="container flex gap-4">
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

                        <form>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                Level
                            </label>
                            <select
                                id="level"
                                onChange={(e) => {
                                    setSelectedLevel(parseInt(e.target.value));
                                    onChange();
                                }}
                                value={selectedLevel}
                                className="border rounded-lg p-2.5 text-gray-700 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="0">Kein Level ausgewählt</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </select>
                        </form>
                    </div>

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
                        <label
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
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
                                        onClick={() => handleDownload(file, findingId)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded-md focus:outline-none"
                                    >
                                        Download
                                    </button>

                                    <button
                                        id={`removeFile-${file}`}
                                        type="button"
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
