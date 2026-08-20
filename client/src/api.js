async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options,
  });
  if (res.status === 401 && path !== "/session" && path !== "/login") {
    window.dispatchEvent(new Event("auth:required"));
    throw new Error("Session expired. Please log in again.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listGoals: () => request("/goals"),
  getGoal: (id) => request(`/goals/${id}`),
  createGoal: (data) => request("/goals", { method: "POST", body: JSON.stringify(data) }),
  updateGoal: (id, data) => request(`/goals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: "DELETE" }),
  checkIn: (id, data) => request(`/goals/${id}/check-ins`, { method: "POST", body: JSON.stringify(data || {}) }),
  removeCheckIn: (id, checkInId) => request(`/goals/${id}/check-ins/${checkInId}`, { method: "DELETE" }),
  session: () => request("/session"),
  login: (password) => request("/login", { method: "POST", body: JSON.stringify({ password }) }),
  logout: () => request("/logout", { method: "POST" }),
};
