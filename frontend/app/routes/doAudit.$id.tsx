import { useState, useEffect, useRef } from "react";
import { Navbar } from "../components/Navbar";
import AuditFilter from "../components/g4/Filter";
import Question from "../components/g4/Question";
import { useParams } from "@remix-run/react";


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
export interface AuditInt {
  au_idx: number;
  au_audit_date: string;
  au_number_of_days: number;
  au_leadauditor_idx: number;
  au_leadauditee_idx: number;
  au_auditstatus: string;
  au_place: string;
  au_theme: string;
  au_typ: string;
}


export default function App() {
  const { id } = useParams();
  const [audit, setAudit] = useState<AuditInt>();
  
  const [loading, setLoading] = useState(true);
  const fetchedOnceRef = useRef(false);
   const [questions, setQuestions] = useState<QuestionInt[]>([]);
   const [questionsfiltern, setQuestionsfiltern] = useState<QuestionInt[]>([]);
   const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
   const [isSaveDisabled, setIsSaveDisabled] = useState(true);

  
  
 
  // Load audit data and corresponding questions
  useEffect(() => {
    const loadAuditData = async () => {
      if (fetchedOnceRef.current) return; 

    fetchedOnceRef.current = true;
      setLoading(true);
      console.log("loading");

      try {
        const auditResponse = await fetch(`http://localhost:3000/audit/${id}`);
        const currentAudit = await auditResponse.json();
        setAudit(currentAudit);

        const questionsResponse = await fetch(`http://localhost:3000/audit/questions/${id}`);//${currentAudit?.au_idx}
        const auditQuestions = await questionsResponse.json();
        setQuestions(auditQuestions);
        setQuestionsfiltern(auditQuestions)
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAuditData();
  },  [id]);

  useEffect(() => {
    checkCompletion();
  }, [questions, isSaveDisabled]); 
  

  const handleSave = async () => {

    questionRefs.current.forEach((questionDiv, index) => {
      const button = questionDiv.querySelector<HTMLSelectElement>("#saveQuestion");
      button.click();
    })

  const response = await fetch(`http://localhost:3000/audit/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ au_auditstatus: "findings_offen" })
    });
    window.location.href = `/gruppe5`;

   

    

  };


 
  const checkCompletion = async ()=>{
    let passt = false;

    console.log("wird das gemacht?")

    questions.forEach((question,index)=>{

        console.log(question)

        if(question.qu_audited===0)
        {
          passt=true;
        }

    });

    setIsSaveDisabled(passt); //hirntumor: isdisabled = true heisst ja es ist disabled, man kann ihn clicken wenn es false ist 

  }
    


  

  if (loading&&!fetchedOnceRef) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <div className="sticky top-0 z-20">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-grow h-full">
        {/* Sticky Filter */}
        <div className="sticky mt-6 bg-white dark:bg-black z-10 shadow-md p-4">
          <AuditFilter  SetQuestions={setQuestions} questionsFiltern={questionsfiltern}/>
        </div>

        {/* Scrollable Questions */}
        <main className="flex-grow overflow-y-auto pl-10 pr-10 bg-white dark:bg-black">
          <div className="px-10">
            {questions.length > 0 ? (
              questions.map((question, index) => (
                <div key={question.qu_idx} ref={(el) => (questionRefs.current[index] = el)}>
                  <Question question={question} onSaved={checkCompletion}/>
                </div>
              ))
              
            ) : (
              <div>No questions found for this audit.</div>
            )}
          </div>
        </main>

        {/* Sticky Save Button */}
        <div className="sticky bottom-0 bg-white dark:bg-black z-10 shadow-md p-4">
          <button
            id="saveAudit"
            type="button"
            disabled = {isSaveDisabled}
            onClick={handleSave}
            className={`w-full font-medium rounded-md shadow focus:outline-none focus:ring-2 focus:ring-offset-2 pt-2 pb-2 transition-colors duration-200 
              ${isSaveDisabled ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500"}`}>
            Audit abschließen
          </button>
        </div>
      </div>
    </div>
  );
}
