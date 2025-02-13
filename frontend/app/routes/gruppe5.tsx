import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Navbar } from '~/components/Navbar';
import {Footer} from "~/components/Footer";

export default function Setup() {
  const [findings, setFindings] = useState([]);
  const [audits, setAudits] = useState([]);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [comment, setComment] = useState("");
  const [workonComments, setWorkonComments] = useState([]);

  useEffect(() => {
    async function fetchFindings() {
      const response = await showAllFindings();
      if (response.status === 404) {
        console.log("404 - Not Found");
      } else {
        const data = await response.json();
        setFindings(data);
      }
    }
    fetchFindings();
  }, []);

  useEffect(() => {
    async function fetchAudits() {
      if (findings.length > 0) {
        const auditPromises = findings.map(async (element) => {
          const response = await getAudit(element.f_au_audit_idx);
          const data = await response.json();
          return data;
        });

        const auditData = await Promise.all(auditPromises);
        setAudits(auditData);
      }
    }
    fetchAudits();
  }, [findings]);

  const fetchWorkonComments = async () => {
    if (selectedFinding) {
      try {
        const response = await getWorkonComments(selectedFinding.f_id);
        const data = await response.json();
        setWorkonComments(Array.isArray(data) ? data : [data]);
      } catch (error) {
        console.error("Failed to fetch workon comments:", error);
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
      case 'dokumentiert':
        return 'bg-yellow-200';
      case 'richtig':
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
      case 'dokumentiert':
        return 'border-yellow-400';
      case 'richtig':
        return 'border-green-400';
      case 'kritisch':
        return 'border-red-400';
      default:
        return 'border-gray-300';
    }
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFinding) return;

    setWorkonComments([...workonComments, { fw_kommentar: comment }]);

    try {
      const response = await postWorkonComment(selectedFinding.f_id, [{ comment }]);
      if (!response.ok) {
        console.error('Failed to submit comment:', response.status);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }

    setComment("");
  };
  const handleRefreshComments = () => {
    fetchWorkonComments();
  };

  return (
    <div className="flex flex-grow h-screen flex-col dark:bg-black">
      <Navbar />
      <div className="flex justify-between px-10 mt-10 pt-5">
        <div className="w-full max-w-md mt-2">
          <h1 className="text-2xl font-bold mb-4">Findings</h1>
          <div className="overflow-y-auto max-h-[750px] overflow-x-hidden">
            <ul className="space-y-4">
              {findings.length > 0 ? (
                  findings.map((finding) => (
                      <Card
                          className={`w-full p-4 cursor-pointer border-l-8 dark:text-black ${getStatusColor(finding.f_status)}`}
                          key={finding.f_id}
                          onClick={() => handleSelectFinding(finding)}
                      >
                        <CardHeader className="text-lg">
                          <CardTitle>
                            <p><strong>ID:</strong> {finding.f_id}</p>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p><strong>Erstelldatum:</strong> {finding.f_creation_date}</p>
                          <p><strong>Status:</strong> {finding.f_status}</p>
                        </CardContent>
                      </Card>
                  ))
              ) : (
                  <p>Loading or no findings available</p>
              )}
            </ul>
          </div>
        </div>


        <div className="flex-col container mt-2">
          <div className="flex-1 ml-10 m-2">
            {selectedFinding && (
                <Card
                    className={`p-6 rounded-lg shadow-md w-full h-auto border-4 ${getBorderColor(selectedFinding.f_status)}`}>
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
                        <p className="text-lg mb-2"><strong>Erstelldatum:</strong> {selectedFinding.f_creation_date}</p>
                        <p className="text-lg mb-2"><strong>Status:</strong> {selectedFinding.f_status}</p>
                    <p className="text-lg mb-2"><strong>Level:</strong> {selectedFinding.f_level}</p>
                    <div className="text-lg mb-2">
                      <strong>Audit:</strong>
                      <div>
                        {selectedAudit ? (
                          <div className="mt-2">
                            <p className="text-sm"><strong>Thema: </strong> {selectedAudit.au_theme}</p>
                            <p className="text-sm"><strong>Datum: </strong> {selectedAudit.au_audit_date}</p>
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
                  className="text-blue-500 hover:text-blue-700 mt-4 py-2 px-4 rounded bg-transparent border border-blue-500"
                >
                  {showMore ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                </button>
              </Card>
            )}
          </div>

          <div className="flex-1 ml-10 m-2">
            {selectedFinding && (
              <Card className={`p-6 rounded-lg shadow-md w-full h-auto border-4 ${getBorderColor(selectedFinding.f_status)}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold">Kommentare</h2>
                  <button
                    onClick={handleRefreshComments}
                    className="text-blue-500 hover:text-blue-700 py-1 px-3 rounded bg-transparent border border-blue-500"
                  >
                    Kommentare aktualisieren
                  </button>
                </div>

                <div className="comments-section overflow-y-auto max-h-[400px] mb-4 p-4 border rounded bg-gray-50">
                  {workonComments.length > 0 ? (
                    workonComments.map((comment, index) => (
                      <div key={index} className="comment-item mb-2 p-3 rounded-md bg-white shadow">
                        <p className="text-gray-800">{comment.fw_kommentar}</p>
                        {/*<span className="text-sm text-gray-500">
                          {new Date().toLocaleDateString()}
                        </span>*/}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Keine Kommentare vorhanden.</p>
                  )}
                </div>

                <form onSubmit={handleCommentSubmit} className="flex flex-col">
                  <textarea
                    className="w-full p-2 border rounded-md dark:text-black mb-2"
                    placeholder="Kommentar hinzufügen..."
                    value={comment}
                    onChange={handleCommentChange}
                    rows={2}
                  />
                  <button
                    type="submit"
                    className="self-end text-white bg-blue-500 hover:bg-blue-700 py-2 px-4 rounded"
                  >
                    Kommentar senden
                  </button>
                </form>
              </Card>
            )}
          </div>

        </div>
      </div>
      <Footer/>
    </div>
  );
}




export async function postWorkonComment(id, commentData) {
  const response = await fetch(`http://localhost:3000/findings/workon/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commentData),
  });
  return response;
}

export async function getWorkonComments(id) {
  const response = await fetch(`http://localhost:3000/findings/workon/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
}


export async function showAllFindings() {
  const response = await fetch('http://localhost:3000/findings/getall', {
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
