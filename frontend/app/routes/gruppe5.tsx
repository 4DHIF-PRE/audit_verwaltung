import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Navbar } from "~/components/Navbar";

export default function Setup() {
  const [findings, setFindings] = useState([]);
  const [audits, setAudits] = useState([]);
  const [selectedFinding, setSelectedFinding] = useState(null);

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
        console.log('Lade Audits für Findings:', findings);
        const auditPromises = findings.map(async (element) => {
          const response = await getAudit(element.f_au_audit_idx);
          const data = await response.json();
          console.log('Audit geladen:', data);
          return data;
        });

        const auditData = await Promise.all(auditPromises);
        console.log('Alle Audits:', auditData);
        setAudits(auditData);
      }
    }
    fetchAudits();
  }, [findings]);

  const handleSelectFinding = (finding) => {
    if (selectedFinding && selectedFinding.f_id === finding.f_id) {
      setSelectedFinding(null);
    } else {
      setSelectedFinding(finding);
    }
  };

  const selectedAudit = selectedFinding
    ? audits.find((audit) => Number(audit.au_idx) == Number(selectedFinding.f_au_audit_idx))
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

  return (
    <div>
      <Navbar />
      <div className="flex justify-between px-10 mt-3">
        <div className="max-w-[350px]">
          <h1 className="text-2xl font-bold mb-4">Findings</h1>
          <ul>
            {findings.length > 0 ? (
              findings.map((finding) => (
                <Card
                  className={`w-[350px] mb-4 cursor-pointer border-l-8 ${getStatusColor(finding.f_status)}`}
                  key={finding.f_id}
                  onClick={() => handleSelectFinding(finding)}
                >
                  <CardHeader className="m-2 text-2xl">
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

        <div className="flex-1 ml-10">
          <br />
          <br />
          {selectedFinding && (
            <Card className={`p-6 rounded-lg shadow-md w-full h-auto border-4 ${getBorderColor(selectedFinding.f_status)}`}>
              <h2 className="text-3xl font-bold mb-4">Details zu Finding ID: {selectedFinding.f_id}</h2>
              <p className="text-lg mb-2"><strong>Erstelldatum:</strong> {selectedFinding.f_creation_date}</p>
              <p className="text-lg mb-2"><strong>Status:</strong> {selectedFinding.f_status}</p>
              <p className="text-lg mb-2"><strong>Level:</strong> {selectedFinding.f_level}</p>
              <div className="text-lg mb-2">
                <strong>Audit:</strong>
                <div>
                  {selectedAudit ? (
                    <div>
                      <p><strong>Thema: </strong> {selectedAudit.au_theme}</p>
                      <p><strong>Datum: </strong> {selectedAudit.au_audit_date}</p>
                      <p><strong>Status: </strong> {selectedAudit.au_auditstatus}</p>
                    </div>
                  ) : (
                    <p>Kein Audit mit der ID {selectedFinding.f_au_audit_idx} gefunden.</p>
                  )}
                </div>
              </div>
              <p className="text-lg mb-2"><strong>Kommentar:</strong> {selectedFinding.f_comment}</p>
            </Card>
          )}
        </div>
      </div >
    </div >
  );
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

export async function getAudit(id: number) {
  const response = await fetch(`http://localhost:3000/audit/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response;
}
/*
{questions.length > 0 ? (
            questions.map((question) => (
              <div className="mt-3" key={question.qu_idx}>
                <Question question={question} />
              </div>
            ))
          ) : (
            <div>No questions found for this audit.</div>
          )}
*/
