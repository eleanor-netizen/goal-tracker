import { Link } from "react-router-dom";
import { domainIcon, progressText, streakText } from "../utils.js";

export default function GoalCard({ goal }) {
  const needsReview = goal.computed.needsReview;
  const streak = streakText(goal);
  const children = goal.computed.children;

  return (
    <Link to={`/goals/${goal.id}`} className={`goal-card${needsReview ? " needs-review" : ""}`}>
      {needsReview && <span className="review-flag">Needs review</span>}
      <div className="goal-card-title">
        <span className="domain-icon">{domainIcon(goal.domain)}</span>
        <span>{goal.title}</span>
      </div>
      <div className="goal-card-progress">{progressText(goal)}</div>
      {streak && <div className="goal-card-streak">{streak}</div>}
      {children.length > 0 && (
        <div className="goal-card-children">
          {children.map((c) => `${c.total} ${c.title.toLowerCase()}`).join(" · ")}
        </div>
      )}
    </Link>
  );
}
