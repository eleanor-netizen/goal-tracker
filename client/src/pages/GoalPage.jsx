import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../api.js";
import GoalForm from "../components/GoalForm.jsx";
import {
  domainIcon,
  frequencyLabel,
  formatDate,
  formatDateTime,
  TIER_LABELS,
} from "../utils.js";

function ProgressBlock({ goal }) {
  const p = goal.computed.progress;

  if (p.kind === "daily") {
    return (
      <div className="stat-block">
        <div className="stat-big">{p.periodCount >= p.periodTarget ? "Done today ✓" : "Not done yet today"}</div>
        <div className="stat-sub">
          🔥 {p.streakCurrent} day streak · {p.streakLongest} best
        </div>
      </div>
    );
  }
  if (p.kind === "per_period") {
    return (
      <div className="stat-block">
        <div className="stat-big">
          {p.periodCount}/{p.periodTarget} this {p.period}
        </div>
        <div className="stat-sub">
          🔥 {p.streakCurrent} {p.period} streak · {p.streakLongest} best
        </div>
      </div>
    );
  }
  if (p.kind === "until") {
    const pct = Math.min(100, Math.round((p.total / p.target) * 100));
    return (
      <div className="stat-block">
        <div className="stat-big">
          {p.total}/{p.target}
          {p.done ? " ✓ complete" : ""}
        </div>
        <div className="bar">
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }
  return (
    <div className="stat-block">
      <div className="stat-big">{p.total} logged</div>
      {p.lastAt && <div className="stat-sub">Last: {formatDate(p.lastAt)}</div>}
    </div>
  );
}

export default function GoalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [allGoals, setAllGoals] = useState([]);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [error, setError] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);

  function reload() {
    api.getGoal(id).then(setGoal).catch((e) => setError(e.message));
  }

  useEffect(() => {
    reload();
    api.listGoals().then(setAllGoals);
    setEditing(false);
  }, [id]);

  async function handleCheckIn() {
    setCheckingIn(true);
    try {
      const updated = await api.checkIn(id, { note: note.trim() });
      setGoal(updated);
      setNote("");
      setShowNoteInput(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleUndo(checkInId) {
    const updated = await api.removeCheckIn(id, checkInId);
    setGoal(updated);
  }

  async function handleUpdate(data) {
    const updated = await api.updateGoal(id, data);
    setGoal(updated);
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${goal.title}"? This can't be undone.`)) return;
    await api.deleteGoal(id);
    navigate("/");
  }

  if (error) return <p className="error">{error}</p>;
  if (!goal) return <p className="muted">Loading…</p>;

  const parent = goal.parent_id ? allGoals.find((g) => g.id === goal.parent_id) : null;
  const otherGoals = allGoals.filter((g) => g.id !== goal.id);
  const recentCheckIns = [...goal.check_ins].reverse().slice(0, 15);

  if (editing) {
    return (
      <div className="page">
        <h1>Edit goal</h1>
        <GoalForm
          initialGoal={goal}
          otherGoals={otherGoals}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel="Save changes"
        />
      </div>
    );
  }

  return (
    <div className="page goal-page">
      <div className="goal-page-header">
        <div>
          <div className="breadcrumbs">
            <Link to="/">Home</Link>
            {parent && (
              <>
                {" / "}
                <Link to={`/goals/${parent.id}`}>{parent.title}</Link>
              </>
            )}
          </div>
          <h1>
            <span className="domain-icon">{domainIcon(goal.domain)}</span> {goal.title}
          </h1>
          <div className="meta-row">
            <span className="tag">{TIER_LABELS[goal.tier]}</span>
            {goal.domain && <span className="tag">{goal.domain}</span>}
            <span className="tag">{frequencyLabel(goal.frequency_target)}</span>
            <span className={`tag status-${goal.status}`}>{goal.status}</span>
            {goal.computed.needsReview && <span className="tag review-flag">Needs review</span>}
          </div>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <ProgressBlock goal={goal} />

      <div className="checkin-block">
        <button className="btn btn-primary btn-large" onClick={handleCheckIn} disabled={checkingIn}>
          {checkingIn ? "Logging…" : "✓ I did the thing"}
        </button>
        {!showNoteInput ? (
          <button className="btn-link" onClick={() => setShowNoteInput(true)}>
            add a note
          </button>
        ) : (
          <input
            className="note-input"
            placeholder={
              goal.qualifying_examples.length
                ? `Which one? (${goal.qualifying_examples.join(", ")})`
                : "Optional note"
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
      </div>

      {goal.definition_of_success && (
        <section className="detail-section">
          <h3>Definition of success</h3>
          <p>{goal.definition_of_success}</p>
        </section>
      )}

      {goal.qualifying_examples.length > 0 && (
        <section className="detail-section">
          <h3>Qualifying examples</h3>
          <ul className="chip-list">
            {goal.qualifying_examples.map((ex) => (
              <li key={ex} className="chip">
                {ex}
              </li>
            ))}
          </ul>
        </section>
      )}

      {goal.computed.children.length > 0 && (
        <section className="detail-section">
          <h3>Linked goals</h3>
          <ul className="children-list">
            {goal.computed.children.map((c) => (
              <li key={c.id}>
                <Link to={`/goals/${c.id}`}>{c.title}</Link>
                <span className="muted"> — {c.total} logged</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="detail-section">
        <h3>Recent check-ins</h3>
        {recentCheckIns.length === 0 ? (
          <p className="muted">No check-ins yet.</p>
        ) : (
          <ul className="checkin-list">
            {recentCheckIns.map((c) => (
              <li key={c.id}>
                <span>{formatDateTime(c.at)}</span>
                {c.note && <span className="checkin-note">{c.note}</span>}
                <button className="btn-link" onClick={() => handleUndo(c.id)}>
                  undo
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="muted small">
        Created {formatDate(goal.created_at)} · Last touched {formatDate(goal.last_touched_at)}
        {goal.next_review_at && <> · Review by {formatDate(goal.next_review_at)}</>}
      </p>
    </div>
  );
}
