import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import GoalPage from "./pages/GoalPage.jsx";
import NewGoalPage from "./pages/NewGoalPage.jsx";

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          Goal Tracker
        </Link>
        <Link to="/new" className="btn btn-primary">
          + New goal
        </Link>
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
