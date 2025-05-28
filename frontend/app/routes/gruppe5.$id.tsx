import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "@remix-run/react";
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Navbar } from '~/components/Navbar';
import { Footer } from '~/components/Footer';

export default function Setup() {
  const { id } = useParams();
  const [findings, setFindings] = useState([]);
  const [audits, setAudits] = useState([]);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [comment, setComment] = useState("");
  const [workonComments, setWorkonComments] = useState([]);
  const [statusFilter, setStatusFilter] = useState({
    offen: true,
    richtig: true,
    kritisch: true
  });
  const [error, setError] = useState(null);
  let own_user_name = "Loading";
  const navigate = useNavigate();

  let index_success = 0;

  useEffect(() => {
    async function getownuser() {
      own_user_name = await getUserName(document.cookie);
    }
    getownuser();
    async function fetchFindings() {
      const response = await showAllFindings(id);
      if (response.status === 404) {
        setError("Finding nicht gefunden");
        setFindings([]);
      } else if (!response.ok) {
        setError("Fehler beim Laden der Findings");
        setFindings([]);
      } else {
        const data = await response.json();
        setFindings(data);
        setError(null);
      }
    }
    fetchFindings();
    // console.log(own_user_name);
    // console.log(document.cookie);
  }, [id]);

  useEffect(() => {
    async function fetchAudit() {
      if (findings.length > 0) {
        const selectedFinding = findings[0];

        const response = await getAudit(selectedFinding.f_au_audit_idx);
        const data = await response.json();

        const auditData = Array(findings.length).fill(data);
        setAudits(auditData);
      }
    }
    fetchAudit();
  }, [findings]);

  const fetchWorkonComments = async () => {
    if (selectedFinding) {
      try {
        const data = await getWorkonComments(selectedFinding.f_id);
        setWorkonComments(Array.isArray(data) ? data : [data]);
      } catch (error) {
        console.error("Fehler beim Laden der Work-on-Kommentare:", error);
      }
    }
  };

  useEffect(() => {
    fetchWorkonComments();
  }, [selectedFinding]);

  const handleSelectFinding = (finding) => {
    if (selectedFinding && selectedFinding.f_id === finding.f_id) {
      setSelectedFinding(null);
      setWorkonComments([]);
    } else {
      setSelectedFinding(finding);
      setShowMore(false);
    }
  };

  const selectedAudit = selectedFinding
    ? audits.find((audit) => Number(audit.au_idx) === Number(selectedFinding.f_au_audit_idx))
    : null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'offen':
        return 'bg-gray-200';
      case 'richtig':
        index_success++;
        return 'bg-green-200';
      case 'kritisch':
        return 'bg-red-200';
      default:
        return 'bg-gray-100';
    }
  };

  const getBorderColor = (status) => {
    switch (status) {
      case 'offen':
        return 'border-gray-400';
      case 'richtig':
        return 'border-green-400';
      case 'kritisch':
        return 'border-red-400';
      default:
        return 'border-gray-300';
    }
  };

  const getStatusDescription = (documented, implemented) => {
    switch (documented) {
      case 0:
        if (implemented == 0) {
          return 'kritisch';
        }
        return 'offen';
      case 1:
        if (implemented == 0) {
          return 'offen';
        }
        console.log(index_success);
        if (index_success == findings.length) {
          // Abschliessen
          document.getElementById("findings_beenden").classList.remove("hidden");
        }
        return 'richtig';
    }
  }

  const getTimeFormatted = (time_data) => {
    const date_time = new Date(time_data);
    return (date_time.getDate() + "." + (Number.parseInt(date_time.getMonth()) + 1) + "." + date_time.getFullYear() + " " + date_time.toLocaleTimeString());
  }

  const handleCommentChange = (e) => {
    setComment(e.target.value, own_user_name);
  };

  const handleAbschliessen = async () => {
    try {
      await endAudit(audits[0].au_idx);
      navigate("/auditPage");
    } catch (error) {
      console.error("Fehler beim Abschließen:", error);
      setError("Abschließen fehlgeschlagen");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFinding) return;

    setWorkonComments([...workonComments, { fw_kommentar: comment }]);

    try {
      const response = await postWorkonComment(selectedFinding.f_id, [{ comment }]);
      handleRefreshComments();
      if (!response.ok) {
        console.error('Fehler beim Absenden des Kommentars:', response.status);
      }
    } catch (error) {
      console.error('Fehler beim Absenden des Kommentars:', error);
    }
    setComment("");
  };

  const handleRefreshComments = () => {
    fetchWorkonComments();
  };

  const handleFilterChange = (e) => {
    const { name, checked } = e.target;
    setStatusFilter((prevFilter) => ({
      ...prevFilter,
      [name]: checked,
    }));
  };

  const filteredFindings = Array.isArray(findings)
    ? findings.filter((finding) => statusFilter[getStatusDescription(finding.f_documented, finding.f_implemented)])
    : [];

  return (
    <div className="flex flex-col h-screen dark:bg-black">
      <Navbar />

      <div className="flex-grow flex overflow-hidden px-10 mt-10 pt-5">
        <div className="w-full max-w-md mt-2 flex-shrink-0 h-full flex flex-col">
          <h1 className="text-2xl font-bold mb-4">Findings</h1>

          <button
            type="button"
            className="mt-2 mb-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 hidden"
            id="findings_beenden"
            onClick={handleAbschliessen}
          >
            Abschließen
          </button>

          {error && <div className="text-red-500 mb-4">{error}</div>}

          <div className="mb-4 p-4 border rounded bg-gray-50 dark:bg-gray-800">
            <h2 className="text-lg font-semibold mb-2 text-black dark:text-white">Status filtern:</h2>
            <div className="flex space-x-4">
              {['offen', 'richtig', 'kritisch'].map((status) => (
                <label key={status} className="flex items-center text-black dark:text-gray-300">
                  <input
                    type="checkbox"
                    name={status}
                    checked={statusFilter[status]}
                    onChange={handleFilterChange}
                    className="mr-2 form-checkbox h-5 w-5 text-blue-600 dark:bg-gray-700 dark:border-gray-600"
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto">
            <ul className="space-y-4">
              {filteredFindings.length > 0 ? (
                filteredFindings.map((finding) => (
                  <Card
                    className={`w-full p-4 cursor-pointer border-l-8 dark:text-black ${getStatusColor(getStatusDescription(finding.f_documented, finding.f_implemented))}`}
                    key={finding.f_id}
                    onClick={() => handleSelectFinding(finding)}
                  >
                    <CardHeader className="text-lg">
                      <CardTitle>
                        <p><strong>ID:</strong> {finding.f_id}</p>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p><strong>Erstelldatum:</strong> {getTimeFormatted(finding.f_creation_date)}</p>
                      <p><strong>Status:</strong> {getStatusDescription(finding.f_documented, finding.f_implemented)}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p>Keine Findings verfügbar</p>
              )}
            </ul>
          </div>
          <br></br>
        </div>


        <div className="w-[70%] ml-10 m-2 flex flex-col overflow-y-auto max-h-[80vh] pr-2">
          {selectedFinding && (
            <Card
              className={`p-6 rounded-lg shadow-md w-full h-auto border-4 mb-4 ${getBorderColor(getStatusDescription(selectedFinding.f_documented, selectedFinding.f_implemented))}`}
            >
              <h2 className="text-3xl font-bold mb-4">Details zu Finding ID: {selectedFinding.f_id}</h2>

              <p className="text-lg mb-2"><strong>Kommentar: </strong>
                {selectedFinding.f_comment && selectedFinding.f_comment.length > 0 ? (
                  selectedFinding.f_comment
                ) : (
                  <span> Kein Kommentar vorhanden.</span>
                )}
              </p>

              {showMore && (
                <div>
                  <p className="text-lg mb-2"><strong>Erstelldatum:</strong> {getTimeFormatted(selectedFinding.f_creation_date)}</p>
                  <p className="text-lg mb-2"><strong>Status:</strong> {getStatusDescription(selectedFinding.f_documented, selectedFinding.f_implemented)}</p>
                  <p className="text-lg mb-2"><strong>Level:</strong> {selectedFinding.f_level}</p>
                  <div className="text-lg mb-2">
                    <strong>Audit:</strong>
                    <div>
                      {selectedAudit ? (
                        <div className="mt-2">
                          <p className="text-sm"><strong>Thema: </strong> {selectedAudit.au_theme}</p>
                          <p className="text-sm"><strong>Datum: </strong> {getTimeFormatted(selectedAudit.au_audit_date)}</p>
                          <p className="text-sm"><strong>Status: </strong> {selectedAudit.au_auditstatus}</p>
                        </div>
                      ) : (
                        <p>Kein Audit mit der ID {selectedFinding.f_au_audit_idx} gefunden.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowMore(!showMore)}
                className="text-blue-500 hover:text-blue-700 mt-4 py-2 px-4 rounded-lg"
              >
                {showMore ? "Weniger anzeigen" : "Mehr anzeigen"}
              </button>
            </Card>

          )}

          {selectedFinding && (
            <Card className="p-6 w-full h-auto rounded-lg shadow-md border-2 mb-4 flex-1 flex flex-col">
              <div className="flex justify-between mb-4">
                <h2 className="text-2xl font-semibold">Work-on-Kommentare</h2>
                <button
                  onClick={handleRefreshComments}
                  className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
                >
                  Refresh
                </button>
              </div>

              <div className="h-40 overflow-y-auto border p-2 rounded">
                {workonComments.length > 0 ? (
                  workonComments.map((comment, index) => (
                    <p key={index} className="text-md mb-2">
                      <a className="text-xs mb-2 text-gray-600/85">
                        {"(" + (comment.fw_user?.u_firstname || own_user_name) + "): "}
                      </a>
                      {comment.fw_kommentar}
                      <a className='text-xs text-gray-500/80'>
                        {" " + getTimeFormatted(comment.fw_datum)}
                      </a>
                    </p>
                  ))
                ) : (
                  <p>Keine Kommentare verfügbar.</p>
                )}
              </div>

              <form onSubmit={handleCommentSubmit} className="mt-4">
                <textarea
                  value={comment}
                  onChange={handleCommentChange}
                  className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
                  placeholder="Kommentar hinzufügen..."
                />
                <button
                  type="submit"
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Kommentar hinzufügen
                </button>
              </form>

            </Card>

          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

// funktioniert jetzt einwandfrei
export async function postWorkonComment(id, commentData) {
  // console.log(document.cookie);
  const response = await fetch(`http://localhost:3000/findings/workon/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: document.cookie || "",
    },
    credentials: "include",
    body: JSON.stringify(commentData),
  });
  return response;
}

export async function getWorkonComments(id) {
  // await new Promise(r => setTimeout(r, 1000));
  const response = await fetch(`http://localhost:3000/findings/workon/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  let response_clean = await response.json();
  for (let i = 0; i < response_clean.length; i++) {
    // console.log(response_clean[i]);
    let userid = response_clean[i].fw_user;
    response_clean[i].fw_user = await getUserName(userid);
    // console.log(response_clean[i]);
  }
  return response_clean;
}


export async function showAllFindings(id) {
  const response = await fetch(`http://localhost:3000/findings/getall/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
}

export async function getAudit(id) {
  const response = await fetch(`http://localhost:3000/audit/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
}

export async function getUserName(id) {
  const response = await fetch(`http://localhost:3000/username/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}

export async function endAudit(id) {
  const response = await fetch(`http://localhost:3000/audit/beenden/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}