export default function setup() {
  main();
  return (
    <div className="350px px-10 mt-3">
      <h1 className="text-2xl text-bold">Findings</h1>
    </div>
  );
}

export async function main() {
  var response = await showAllFindings();
  if (response.status == 404) {
    console.log("404");
  }
  else {
    console.log("Hier");
  }
  console.log(response);
}

export async function showAllFindings() {
  var response = await fetch('http://localhost:3000/findings/getall', {
    method: 'POST',
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