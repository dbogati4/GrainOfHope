export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">Grain of Hope</div>
      <nav>
        <a className="active" href="#">Home</a>
        <a href="#/calculator">Calculator</a>
        <a href="#/chatbot">Chatbot</a>
        <a href="#/about">About</a>
        <a href="#/contact">Contact Us</a>
      </nav>
      <footer>
        <small>© {new Date().getFullYear()} Grain of Hope</small>
      </footer>
    </aside>
  );
}
