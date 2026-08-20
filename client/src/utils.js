const DOMAIN_ICONS = {
  work: "\u{1F4BC}",
  health: "\u{1F3C3}",
  writing: "✍️",
  family: "\u{1F46A}",
  personal: "✨",
  finance: "\u{1F4B0}",
  learning: "\u{1F4DA}",
};

export function domainIcon(domain) {
  const key = (domain || "").trim().toLowerCase();
  return DOMAIN_ICONS[key] || "\u{1F3AF}";
}

export const TIER_LABELS = {
  "short-term": "Short-term",
  "medium-term": "Medium-term",
  "long-term": "Long-term",
};

export const TIER_ORDER = ["short-term", "medium-term", "long-term"];

export function frequencyLabel(ft) {
  if (!ft) return "";
  switch (ft.type) {
    case "daily":
      return "Daily";
    case "per_period":
      return `${ft.count}x / ${ft.period}`;
    case "until":
      return `Until ${ft.target}`;
    case "unlimited":
    default:
      return "Unlimited";
  }
}

export function progressText(goal) {
  const p = goal.computed.progress;
  switch (p.kind) {
    case "daily":
      return p.periodCount >= p.periodTarget ? "Done today" : "Not done today";
    case "per_period":
      return `${p.periodCount}/${p.periodTarget} this ${p.period}`;
    case "until":
      return `${p.total}/${p.target}${p.done ? " ✓" : ""}`;
    case "unlimited":
    default:
      return `${p.total} logged`;
  }
}

export function streakText(goal) {
  const p = goal.computed.progress;
  if (p.kind === "daily" || p.kind === "per_period") {
    if (p.streakCurrent === 0 && p.streakLongest === 0) return null;
    return `\u{1F525} ${p.streakCurrent} current · ${p.streakLongest} best`;
  }
  return null;
}

export function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function toDateInputValue(iso) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}
