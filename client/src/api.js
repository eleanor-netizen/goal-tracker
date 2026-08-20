import * as store from "./localStore.js";
import { computeProgress, needsReview, childSummary } from "./compute.js";

// This app is deployed as static files (GitHub Pages) — there is no server.
// Goals persist to this browser's localStorage only, and the "password" below
// ships inside the JS bundle like everything else here, so it only deters a
// casual look; it is not real access control.
const PASSWORD = "whiskerman2026";
const AUTH_KEY = "goal-tracker:auth";
const AUTH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function isUnlocked() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return false;
  return Number(raw) > Date.now();
}

function setUnlocked() {
  localStorage.setItem(AUTH_KEY, String(Date.now() + AUTH_TTL_MS));
}

function clearUnlocked() {
  localStorage.removeItem(AUTH_KEY);
}

function serializeGoal(goal, { includeCheckIns = false } = {}) {
  const children = store.childrenOf(goal.id);
  const out = {
    ...goal,
    computed: {
      progress: computeProgress(goal),
      needsReview: needsReview(goal),
      children: children.length ? childSummary(children) : [],
    },
  };
  if (!includeCheckIns) delete out.check_ins;
  return out;
}

export const api = {
  listGoals: () => Promise.resolve(store.getAll().map((g) => serializeGoal(g))),

  getGoal: (id) => {
    const goal = store.getById(id);
    if (!goal) return Promise.reject(new Error("not found"));
    return Promise.resolve(serializeGoal(goal, { includeCheckIns: true }));
  },

  createGoal: (data) => {
    if (!data.title || !data.tier || !data.frequency_target) {
      return Promise.reject(new Error("title, tier, and frequency_target are required"));
    }
    const goal = store.create(data);
    return Promise.resolve(serializeGoal(goal, { includeCheckIns: true }));
  },

  updateGoal: (id, data) => {
    const goal = store.update(id, data);
    if (!goal) return Promise.reject(new Error("not found"));
    return Promise.resolve(serializeGoal(goal, { includeCheckIns: true }));
  },

  deleteGoal: (id) => {
    const ok = store.remove(id);
    if (!ok) return Promise.reject(new Error("not found"));
    return Promise.resolve(null);
  },

  checkIn: (id, data) => {
    const result = store.addCheckIn(id, data || {});
    if (!result) return Promise.reject(new Error("not found"));
    return Promise.resolve(serializeGoal(result.goal, { includeCheckIns: true }));
  },

  removeCheckIn: (id, checkInId) => {
    const goal = store.removeCheckIn(id, checkInId);
    if (!goal) return Promise.reject(new Error("not found"));
    return Promise.resolve(serializeGoal(goal, { includeCheckIns: true }));
  },

  session: () => Promise.resolve({ authenticated: isUnlocked() }),

  login: (password) => {
    if (password !== PASSWORD) return Promise.reject(new Error("Incorrect password."));
    setUnlocked();
    return Promise.resolve(null);
  },

  logout: () => {
    clearUnlocked();
    return Promise.resolve(null);
  },
};
