import { useState } from "react";
import { toDateInputValue } from "../utils.js";

const DEFAULT_FT = { type: "per_period", count: 3, period: "week" };

function toFormState(goal) {
  return {
    title: goal?.title || "",
    tier: goal?.tier || "short-term",
    domain: goal?.domain || "",
    definition_of_success: goal?.definition_of_success || "",
    qualifying_examples: goal?.qualifying_examples?.join(", ") || "",
    frequency_target: goal?.frequency_target || DEFAULT_FT,
    parent_id: goal?.parent_id || "",
    status: goal?.status || "active",
    next_review_at: toDateInputValue(goal?.next_review_at),
  };
}

export default function GoalForm({ initialGoal, otherGoals = [], onSubmit, onCancel, submitLabel = "Save" }) {
  const [form, setForm] = useState(() => toFormState(initialGoal));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setFtType(type) {
    if (type === "daily" || type === "unlimited") {
      setField("frequency_target", { type });
    } else if (type === "per_period") {
      setField("frequency_target", { type, count: 3, period: "week" });
    } else if (type === "until") {
      setField("frequency_target", { type, target: 1 });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        tier: form.tier,
        domain: form.domain.trim(),
        definition_of_success: form.definition_of_success.trim(),
        qualifying_examples: form.qualifying_examples
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        frequency_target: form.frequency_target,
        parent_id: form.parent_id || null,
        status: form.status,
        next_review_at: form.next_review_at ? new Date(form.next_review_at).toISOString() : null,
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const ft = form.frequency_target;

  return (
    <form className="goal-form" onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}

      <label>
        Title
        <input value={form.title} onChange={(e) => setField("title", e.target.value)} autoFocus />
      </label>

      <div className="form-row">
        <label>
          Tier
          <select value={form.tier} onChange={(e) => setField("tier", e.target.value)}>
            <option value="short-term">Short-term</option>
            <option value="medium-term">Medium-term</option>
            <option value="long-term">Long-term</option>
          </select>
        </label>

        <label>
          Domain
          <input
            value={form.domain}
            onChange={(e) => setField("domain", e.target.value)}
            placeholder="work, health, writing…"
          />
        </label>
      </div>

      <label>
        Definition of success
        <textarea
          value={form.definition_of_success}
          onChange={(e) => setField("definition_of_success", e.target.value)}
          rows={3}
          placeholder="What does fulfilling this goal actually look like?"
        />
      </label>

      <label>
        Qualifying examples (comma-separated, optional)
        <input
          value={form.qualifying_examples}
          onChange={(e) => setField("qualifying_examples", e.target.value)}
          placeholder="walking pad, yoga video, pilates"
        />
      </label>

      <fieldset>
        <legend>Frequency target</legend>
        <select value={ft.type} onChange={(e) => setFtType(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="per_period">N times per week/month</option>
          <option value="unlimited">Unlimited (just log it)</option>
          <option value="until">Until X (cumulative total)</option>
        </select>

        {ft.type === "per_period" && (
          <div className="form-row inline">
            <input
              type="number"
              min="1"
              value={ft.count}
              onChange={(e) => setField("frequency_target", { ...ft, count: Number(e.target.value) })}
            />
            <span>times per</span>
            <select
              value={ft.period}
              onChange={(e) => setField("frequency_target", { ...ft, period: e.target.value })}
            >
              <option value="week">week</option>
              <option value="month">month</option>
            </select>
          </div>
        )}

        {ft.type === "until" && (
          <div className="form-row inline">
            <span>Target total:</span>
            <input
              type="number"
              min="1"
              value={ft.target}
              onChange={(e) => setField("frequency_target", { ...ft, target: Number(e.target.value) })}
            />
          </div>
        )}
      </fieldset>

      <div className="form-row">
        <label>
          Status
          <select value={form.status} onChange={(e) => setField("status", e.target.value)}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="done">Done</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </label>

        <label>
          Next review date (optional)
          <input
            type="date"
            value={form.next_review_at}
            onChange={(e) => setField("next_review_at", e.target.value)}
          />
        </label>
      </div>

      <label>
        Parent goal (optional)
        <select value={form.parent_id} onChange={(e) => setField("parent_id", e.target.value)}>
          <option value="">None</option>
          {otherGoals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </label>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
