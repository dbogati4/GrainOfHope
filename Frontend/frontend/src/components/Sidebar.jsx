// src/components/Sidebar.jsx
import { useEffect, useState } from "react";

export default function Sidebar() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const is = (h) => (hash === h ? "active" : "");

  return (
    <aside className="sidebar">
      <div className="brand">Grain of Hope</div>
      <nav>
        <a className={is("#/") || is("")} href="#/">Home</a>
        <a className={is("#/calculator")} href="#/calculator">Calculator</a>
        {/* <a className={is("#/chatbot")} href="#/chatbot">Chatbot</a> */}
        <a className={is("#/about")} href="#/about">About</a>
        <a className={is("#/knowledge-quiz")} href="#/knowledge-quiz">Hunger Knowledge Quiz</a>
        <a className={is("#/news")} href="#/news">World Hunger News</a>
        <a className={is("#/mythbusting")} href="#/mythbusting">Myth Busting</a>
      </nav>
      <footer>
        <small>© {new Date().getFullYear()} Grain of Hope</small>
      </footer>
    </aside>
  );
}
