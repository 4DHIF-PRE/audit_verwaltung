import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Navbar } from "~/components/Navbar";

export default function Setup() {
  const [findings, setFindings] = useState([]);

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

  return (
    <div>
      <Navbar />
      <div className="max-w-350px px-10 mt-3">
        <h1 className="text-2xl font-bold">Findings</h1>
        <ul>
          {findings.length > 0 ? (
            findings.map((finding) => (
              <Card className="w-[350px]">
                <CardHeader className="m-2 text-2xl">
                  <CardTitle><p><strong>ID:</strong> {finding.f_id}</p></CardTitle>
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
      </div >
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