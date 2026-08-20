import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "goals.json");

function seedGoals() {
  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();

  const exercise = {
    id: randomUUID(),
    title: "Exercise",
    tier: "short-term",
    domain: "health",
    definition_of_success: "Move my body with intention at least 3 times a week.",
    qualifying_examples: ["walking pad", "stroller class", "yoga video", "pilates"],
    frequency_target: { type: "per_period", count: 3, period: "week" },
    parent_id: null,
    status: "active",
    next_review_at: null,
    check_ins: [
      { id: randomUUID(), at: daysAgo(1), note: "yoga video" },
      { id: randomUUID(), at: daysAgo(3), note: "walking pad" },
    ],
    created_at: daysAgo(20),
    last_touched_at: daysAgo(1),
  };

  const journaling = {
    id: randomUUID(),
    title: "Journaling",
    tier: "short-term",
    domain: "personal",
    definition_of_success: "Write down what's on my mind, no minimum length or schedule.",
    qualifying_examples: [],
    frequency_target: { type: "unlimited" },
    parent_id: null,
    status: "active",
    next_review_at: null,
    check_ins: [
      { id: randomUUID(), at: daysAgo(2), note: "" },
      { id: randomUUID(), at: daysAgo(9), note: "" },
    ],
    created_at: daysAgo(30),
    last_touched_at: daysAgo(2),
  };

  const clients = {
    id: randomUUID(),
    title: "Sign 12 clients",
    tier: "medium-term",
    domain: "work",
    definition_of_success: "12 signed contracts this year to hit revenue target.",
    qualifying_examples: [],
    frequency_target: { type: "until", target: 12 },
    parent_id: null,
    status: "active",
    next_review_at: null,
    check_ins: Array.from({ length: 3 }, (_, i) => ({
      id: randomUUID(),
      at: daysAgo(5 + i * 6),
      note: "",
    })),
    created_at: daysAgo(60),
    last_touched_at: daysAgo(5),
  };

  const pitches = {
    id: randomUUID(),
    title: "Send pitches",
    tier: "medium-term",
    domain: "work",
    definition_of_success: "Outreach to prospective clients.",
    qualifying_examples: [],
    frequency_target: { type: "unlimited" },
    parent_id: clients.id,
    status: "active",
    next_review_at: null,
    check_ins: Array.from({ length: 8 }, (_, i) => ({
      id: randomUUID(),
      at: daysAgo(2 + i * 4),
      note: "",
    })),
    created_at: daysAgo(60),
    last_touched_at: daysAgo(2),
  };

  const calls = {
    id: randomUUID(),
    title: "Hold calls",
    tier: "medium-term",
    domain: "work",
    definition_of_success: "Discovery calls with interested prospects.",
    qualifying_examples: [],
    frequency_target: { type: "unlimited" },
    parent_id: clients.id,
    status: "active",
    next_review_at: null,
    check_ins: Array.from({ length: 4 }, (_, i) => ({
      id: randomUUID(),
      at: daysAgo(3 + i * 7),
      note: "",
    })),
    created_at: daysAgo(60),
    last_touched_at: daysAgo(3),
  };

  const appointments = {
    id: randomUUID(),
    title: "Book doctors' appointments",
    tier: "short-term",
    domain: "family",
    definition_of_success: "Everyone in the family is booked in with the appointments they're due for.",
    qualifying_examples: [],
    frequency_target: { type: "until", target: 3 },
    parent_id: null,
    status: "active",
    next_review_at: null,
    check_ins: [],
    created_at: daysAgo(18),
    last_touched_at: daysAgo(18),
  };

  const dentist = {
    id: randomUUID(),
    title: "Book dentist",
    tier: "short-term",
    domain: "family",
    definition_of_success: "Dentist appointment on the calendar.",
    qualifying_examples: [],
    frequency_target: { type: "until", target: 1 },
    parent_id: appointments.id,
    status: "active",
    next_review_at: null,
    check_ins: [{ id: randomUUID(), at: daysAgo(18), note: "" }],
    created_at: daysAgo(18),
    last_touched_at: daysAgo(18),
  };

  const ob = {
    id: randomUUID(),
    title: "Book OB",
    tier: "short-term",
    domain: "family",
    definition_of_success: "OB appointment on the calendar.",
    qualifying_examples: [],
    frequency_target: { type: "until", target: 1 },
    parent_id: appointments.id,
    status: "active",
    next_review_at: null,
    check_ins: [],
    created_at: daysAgo(18),
    last_touched_at: daysAgo(18),
  };

  const novel = {
    id: randomUUID(),
    title: "Finish the novel draft",
    tier: "long-term",
    domain: "writing",
    definition_of_success: "A complete first draft, however rough, that I'd hand to a trusted reader.",
    qualifying_examples: ["writing session", "outlining session", "revision pass"],
    frequency_target: { type: "per_period", count: 2, period: "week" },
    parent_id: null,
    status: "active",
    next_review_at: daysAgo(-3),
    check_ins: [{ id: randomUUID(), at: daysAgo(16), note: "outlining session" }],
    created_at: daysAgo(45),
    last_touched_at: daysAgo(16),
  };

  return [exercise, journaling, clients, pitches, calls, appointments, dentist, ob, novel];
}

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const goals = seedGoals();
    fs.writeFileSync(DATA_FILE, JSON.stringify(goals, null, 2));
    return goals;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

let goals = load();

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(goals, null, 2));
}

export function getAll() {
  return goals;
}

export function getById(id) {
  return goals.find((g) => g.id === id);
}

export function create(data) {
  const now = new Date().toISOString();
  const goal = {
    id: randomUUID(),
    title: data.title,
    tier: data.tier,
    domain: data.domain || "",
    definition_of_success: data.definition_of_success || "",
    qualifying_examples: data.qualifying_examples || [],
    frequency_target: data.frequency_target,
    parent_id: data.parent_id || null,
    status: data.status || "active",
    next_review_at: data.next_review_at || null,
    check_ins: [],
    created_at: now,
    last_touched_at: now,
  };
  goals.push(goal);
  persist();
  return goal;
}

export function update(id, data) {
  const goal = getById(id);
  if (!goal) return null;
  const editable = [
    "title",
    "tier",
    "domain",
    "definition_of_success",
    "qualifying_examples",
    "frequency_target",
    "parent_id",
    "status",
    "next_review_at",
  ];
  for (const key of editable) {
    if (key in data) goal[key] = data[key];
  }
  goal.last_touched_at = new Date().toISOString();
  persist();
  return goal;
}

export function remove(id) {
  const idx = goals.findIndex((g) => g.id === id);
  if (idx === -1) return false;
  goals.splice(idx, 1);
  for (const g of goals) {
    if (g.parent_id === id) g.parent_id = null;
  }
  persist();
  return true;
}

export function addCheckIn(id, { note, at }) {
  const goal = getById(id);
  if (!goal) return null;
  const checkIn = {
    id: randomUUID(),
    at: at || new Date().toISOString(),
    note: note || "",
  };
  goal.check_ins.push(checkIn);
  goal.check_ins.sort((a, b) => new Date(a.at) - new Date(b.at));
  goal.last_touched_at = new Date().toISOString();
  persist();
  return { goal, checkIn };
}

export function removeCheckIn(id, checkInId) {
  const goal = getById(id);
  if (!goal) return null;
  const idx = goal.check_ins.findIndex((c) => c.id === checkInId);
  if (idx === -1) return null;
  goal.check_ins.splice(idx, 1);
  persist();
  return goal;
}

export function childrenOf(id) {
  return goals.filter((g) => g.parent_id === id);
}
