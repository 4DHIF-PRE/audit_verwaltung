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
  const [selectedFinding, setSelectedFinding] = useState(null); 

  useEffect(() => {
    async function fetchFindings() {
      const response = await showAllFindings();
      if (response.status == 404) {
        console.log("404 - Not Found");
      } else {
        const data = await response.json();
        setFindings(data);
      }
    }
    fetchFindings();
  }, []);

  const handleSelectFinding = (finding) => {
    if (selectedFinding && selectedFinding.f_id === finding.f_id) {
      
      setSelectedFinding(null);
    } else {
      
      setSelectedFinding(finding);
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
                  className="w-[350px] mb-4 cursor-pointer"
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
          <br/>
          <br/>
          {selectedFinding && (
            <Card className="p-6 rounded-lg shadow-md w-full h-auto">
              <h2 className="text-3xl font-bold mb-4">Details zu Finding ID: {selectedFinding.f_id}</h2>
              <p className="text-lg mb-2"><strong>Erstelldatum:</strong> {selectedFinding.f_creation_date}</p>
              <p className="text-lg mb-2"><strong>Status:</strong> {selectedFinding.f_status}</p>
              <p className="text-lg mb-2"><strong>Level:</strong> {selectedFinding.f_level}</p>
              <p className="text-lg mb-2"><strong>Audit:</strong> {selectedFinding.f_au_audit_idx}</p>
              <p className="text-lg mb-2"><strong>Frage:</strong> {selectedFinding.f_qu_question_idx}</p>
              <p className="text-lg mb-2"><strong>Kommentar:</strong> {selectedFinding.f_comment}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
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