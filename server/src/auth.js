import crypto from "node:crypto";

const COOKIE_NAME = "gt_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_ATTEMPTS = 10;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

const APP_PASSWORD = process.env.APP_PASSWORD;
if (!APP_PASSWORD) {
  if (process.env.NODE_ENV === "production") {
    console.error("APP_PASSWORD environment variable is required in production. Set it and restart.");
    process.exit(1);
  }
  console.warn("APP_PASSWORD not set — using default dev password 'goals'. Set APP_PASSWORD before deploying.");
}
const PASSWORD = APP_PASSWORD || "goals";

const SESSION_SECRET = process.env.APP_SESSION_SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.APP_SESSION_SECRET) {
  console.warn("APP_SESSION_SECRET not set — logins will reset whenever the server restarts.");
}

function sign(payload) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

function createToken() {
  const payload = String(Date.now() + SESSION_TTL_MS);
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  const sigBuf = Buffer.from(sig, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return false;
  return Number(payload) > Date.now();
}

function checkPassword(candidate) {
  const a = Buffer.from(String(candidate ?? ""), "utf8");
  const b = Buffer.from(PASSWORD, "utf8");
  if (a.length !== b.length) {
    crypto.timingSafeEqual(Buffer.alloc(b.length), Buffer.alloc(b.length));
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

const attempts = new Map();

function isRateLimited(ip) {
  const rec = attempts.get(ip);
  if (!rec) return false;
  if (Date.now() > rec.resetAt) {
    attempts.delete(ip);
    return false;
  }
  return rec.count >= MAX_ATTEMPTS;
}

function recordFailure(ip) {
  const rec = attempts.get(ip);
  if (rec && Date.now() <= rec.resetAt) {
    rec.count++;
  } else {
    attempts.set(ip, { count: 1, resetAt: Date.now() + ATTEMPT_WINDOW_MS });
  }
}

function clearAttempts(ip) {
  attempts.delete(ip);
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  };
}

export function requireAuth(req, res, next) {
  if (verifyToken(req.cookies[COOKIE_NAME])) return next();
  res.status(401).json({ error: "unauthorized" });
}

export function handleSession(req, res) {
  res.json({ authenticated: verifyToken(req.cookies[COOKIE_NAME]) });
}

export function handleLogin(req, res) {
  const ip = req.ip;
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many attempts. Try again later." });
  }
  if (!checkPassword(req.body?.password)) {
    recordFailure(ip);
    return res.status(401).json({ error: "Incorrect password." });
  }
  clearAttempts(ip);
  res.cookie(COOKIE_NAME, createToken(), cookieOptions());
  res.status(204).end();
}

export function handleLogout(req, res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.status(204).end();
}
