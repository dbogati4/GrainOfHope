import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import About from "./pages/About";
import Calculator from "./pages/Calculator";
import News from "./pages/News";            // make sure filename/case matches on disk
import mythbusting from "./pages/mythbusting"; 
// import KnowledgeQuiz from "./pages/KnowledgeQuiz"; // ← Uncomment if/when you add this page
import "./index.css";

export default function App() {
  const [route, setRoute] = useState(window.location.hash || "#/");

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  let Page = <Home />;

  if (route.startsWith("#/about")) {
    Page = <About />;
  } else if (route.startsWith("#/calculator")) {
    Page = <Calculator />;
  } else if (route.startsWith("#/news")) {
    Page = <News />;
  } else if (route.startsWith("#/mythbusting")) {
    // JSX needs a Capitalized component variable:
    const MythBustingPage = mythbusting;
    Page = <MythBustingPage />;
  } else if (route.startsWith("#/knowledge-quiz")) {
    // If you have a Knowledge Quiz page, render it here.
    // Page = <KnowledgeQuiz />;
    // Temporary friendly placeholder so the hash works even before the page exists:
    Page = (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Knowledge Quiz</h2>
        <p>Add your quiz page at <code>src/pages/KnowledgeQuiz.jsx</code> and uncomment the import and line above.</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar />
      {Page}
    </div>
  );
}
