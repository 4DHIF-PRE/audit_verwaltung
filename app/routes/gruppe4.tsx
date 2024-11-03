import Navbar from "app/components/Navbar";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Audit App</title>
      </head>
      <body className="flex flex-col h-screen"> 
        <Navbar />
        <div className="flex-grow p-10 bg-white dark:bg-black">
          
        </div>
      </body>
    </html>
  );
}