import { useEffect, useState } from "react";
import { api } from "../api.js";
import GoalCard from "../components/GoalCard.jsx";
import { TIER_LABELS, TIER_ORDER } from "../utils.js";

export default function Home() {
  const [goals, setGoals] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listGoals().then(setGoals).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!goals) return <p className="muted">Loading…</p>;

  const topLevel = goals.filter((g) => !g.parent_id);
  const byTier = TIER_ORDER.map((tier) => ({
    tier,
    goals: topLevel
      .filter((g) => g.tier === tier)
      .sort((a, b) => {
        if (a.computed.needsReview !== b.computed.needsReview) {
          return a.computed.needsReview ? -1 : 1;
        }
        return a.title.localeCompare(b.title);
      }),
  })).filter((section) => section.goals.length > 0);

  if (byTier.length === 0) {
    return (
      <div className="empty-state">
        <p>No goals yet.</p>
      </div>
    );
  }

  return (
    <div>
      {byTier.map((section) => (
        <section key={section.tier} className="tier-section">
          <h2>{TIER_LABELS[section.tier]}</h2>
          <div className="goal-grid">
            {section.goals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
