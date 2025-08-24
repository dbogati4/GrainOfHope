import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import About from "./pages/About";
import Calculator from "./pages/Calculator";
import News from "./pages/News"; 
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
  }

  return (
    <div className="app">
      <Sidebar />
      {Page}
    </div>
  );
}
