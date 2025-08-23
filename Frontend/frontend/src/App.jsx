import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import "./index.css";

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <Home />
    </div>
  );
}
