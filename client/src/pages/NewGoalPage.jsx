import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import GoalForm from "../components/GoalForm.jsx";

export default function NewGoalPage() {
  const navigate = useNavigate();
  const [allGoals, setAllGoals] = useState([]);

  useEffect(() => {
    api.listGoals().then(setAllGoals);
  }, []);

  async function handleSubmit(data) {
    const goal = await api.createGoal(data);
    navigate(`/goals/${goal.id}`);
  }

  return (
    <div className="page">
      <h1>New goal</h1>
      <GoalForm otherGoals={allGoals} onSubmit={handleSubmit} onCancel={() => navigate(-1)} submitLabel="Create goal" />
    </div>
  );
}
