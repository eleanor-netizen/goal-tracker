import { useEffect, useState } from "react";
import { api } from "./api.js";

export default function AuthGate({ children }) {
  const [status, setStatus] = useState("checking");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .session()
      .then((s) => setStatus(s.authenticated ? "authed" : "anon"))
      .catch(() => setStatus("anon"));
  }, []);

  useEffect(() => {
    function onAuthRequired() {
      setStatus("anon");
    }
    window.addEventListener("auth:required", onAuthRequired);
    return () => window.removeEventListener("auth:required", onAuthRequired);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.login(password);
      setPassword("");
      setStatus("authed");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "checking") return null;

  if (status === "anon") {
    return (
      <div className="login-screen">
        <form className="login-form" onSubmit={handleSubmit}>
          <h1>Goal Tracker</h1>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  return children;
}
