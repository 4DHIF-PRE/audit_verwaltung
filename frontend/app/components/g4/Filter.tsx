import React, { useState } from "react";
//import {questions,questionsfiltern} from "../../routes/doAudit.$id"

export default function AuditFilter({ SetQuestions, questionsFiltern }) {
  const [gesetz, setGesetz] = useState("");
  const [auditNumber, setAuditNumber] = useState("");
  
 function Suchen() {
  
  //console.log(questionsFiltern);
  //console.log("Gesetz:", gesetz);
  //console.log("Fragennummer:", auditNumber);
}
  return (
    <div className="flex justify-center items-center h-250 w-150">
      <div className="pt-6 pb-6 px-6 py-6 mx-10 my-10 mt-10 mb-2 bg-gray-100 rounded-lg shadow-md flex flex-1 space-x-4 dark:bg-gray-900">
        <div className="flex-1">
          <label
            htmlFor="auditNumber"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Gesetz
          </label>
          <input
            type="text"
            id="gesetz"
            value={gesetz}
            onChange={(e) => setGesetz(e.target.value)}
            placeholder="Gesetz eingeben"
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-gray-200"
          />
        </div>

        <div className="flex-1">
          <label
            htmlFor="auditNumber"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Fragennummer
          </label>
          <input
          value={auditNumber}
          onChange={(e) => setAuditNumber(e.target.value)}
            onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
              if (!(/[0-9]/.test(event.key) || event.key === "Backspace")) {
                event.preventDefault();
              }
            }}
            type="number"
            id="auditNumber"
            
            placeholder="Nummer eingeben"
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-gray-200"
            min="1"
          />
        </div>

        <div className="flex items-end">
          <button
          onClick={Suchen}
            type="button"
            className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-md shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 pt-2 pb-2 pl-5 pr-5"
          >
            Suchen
          </button>
        </div>
      </div>
    </div>
  );
}

