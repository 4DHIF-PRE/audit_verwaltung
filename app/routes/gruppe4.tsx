import Navbar from "app/components/Navbar";
import AuditFilter from "app/components/Filter";
import Question from "app/components/Question";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Audit App</title>
      </head>
      <body className="flex flex-col h-screen">
        <Navbar />
        <main className="flex-grow p-10 bg-white dark:bg-black">
          <AuditFilter />
          <div className="mt-5 px-10">
          <Question />
          </div>
        </main>
      </body>
    </html>
  );
}