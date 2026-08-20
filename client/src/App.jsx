import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import GoalPage from "./pages/GoalPage.jsx";
import NewGoalPage from "./pages/NewGoalPage.jsx";
import { api } from "./api.js";

export default function App() {
  async function handleLogout() {
    await api.logout();
    window.location.reload();
  }

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          Goal Tracker
        </Link>
        <div className="topbar-actions">
          <Link to="/new" className="btn btn-primary">
            + New goal
          </Link>
          <button className="btn-link" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewGoalPage />} />
          <Route path="/goals/:id" element={<GoalPage />} />
        </Routes>
      </main>
    </div>
  );
}
